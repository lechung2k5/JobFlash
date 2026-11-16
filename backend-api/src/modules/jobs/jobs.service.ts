import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { JobStatus, AssignmentStatus, UserStatus } from '@prisma/client';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Tạo công việc mới (Dành cho Người Thuê)
  async createJob(requesterId: string, dto: CreateJobDto) {
    const totalWage = dto.workersNeeded * dto.wagePerWorker;

    return this.prisma.job.create({
      data: {
        requesterId,
        title: dto.title,
        category: dto.category,
        workersNeeded: dto.workersNeeded,
        wageType: dto.wageType,
        wagePerWorker: dto.wagePerWorker,
        totalWage: totalWage,
        latitude: dto.latitude,
        longitude: dto.longitude,
        address: dto.address,
        status: JobStatus.FINDING_WORKERS,
      },
    });
  }

  // 2. Thuật toán tìm thợ gần nhất dựa trên OpenStreetMap / PostGIS KNN
  async findNearestWorkers(lat: number, lng: number, radiusKm: number = 10) {
    // Truy vấn thợ gần nhất qua PostGIS (Khoảng cách tính bằng mét qua ST_DistanceSphere)
    const workers = await this.prisma.$queryRaw<any[]>`
      SELECT 
        u.id,
        u.phone,
        u.full_name AS "fullName",
        u.avatar_url AS "avatarUrl",
        w.skills,
        w.experience_years AS "experienceYears",
        w.rating_avg AS "ratingAvg",
        w.total_completed_jobs AS "totalCompletedJobs",
        w.latitude,
        w.longitude,
        ROUND(ST_DistanceSphere(
          ST_SetSRID(ST_MakePoint(w.longitude, w.latitude), 4326),
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
        )::numeric, 0) AS "distanceMeters"
      FROM worker_profiles w
      JOIN users u ON u.id = w.user_id
      WHERE w.is_online = true
        AND u.status = 'ACTIVE'
        AND w.latitude IS NOT NULL
        AND w.longitude IS NOT NULL
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(w.longitude, w.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusKm * 1000}
        )
      ORDER BY "distanceMeters" ASC
      LIMIT 15;
    `;

    return workers;
  }

  // 3. Thợ chấp nhận cuốc việc (Atomic Locking chống tranh chấp slot)
  async acceptJob(jobId: string, workerId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Kiểm tra trạng thái tài khoản thợ có bị khóa nợ không
      const worker = await tx.user.findUnique({
        where: { id: workerId },
        include: { wallet: true },
      });

      if (!worker || worker.status === UserStatus.DEBT_LOCKED) {
        throw new ForbiddenException(
          'Tài khoản của bạn đang bị khóa do nợ phí hoa hồng 10%. Vui lòng thanh toán để mở khóa nhận việc.',
        );
      }

      // Khóa bản ghi Job để kiểm tra số slot
      const job = await tx.job.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        throw new NotFoundException('Không tìm thấy công việc này.');
      }

      if (job.workersAccepted >= job.workersNeeded) {
        throw new BadRequestException('Công việc này đã đủ số lượng thợ nhận.');
      }

      // Tạo Assignment cho thợ
      const assignment = await tx.jobAssignment.create({
        data: {
          jobId,
          workerId,
          status: AssignmentStatus.ASSIGNED,
        },
      });

      // Tăng số thợ đã nhận
      const updatedJob = await tx.job.update({
        where: { id: jobId },
        data: {
          workersAccepted: { increment: 1 },
          status: job.workersAccepted + 1 >= job.workersNeeded ? JobStatus.ONDUTY : JobStatus.FINDING_WORKERS,
        },
      });

      return { assignment, job: updatedJob };
    });
  }

  // 4. Nghiệm thu & Tự động tính 10% hoa hồng và trừ nợ thợ
  async completeAssignment(assignmentId: string, proofImageUrl?: string) {
    return this.prisma.$transaction(async (tx) => {
      const assignment = await tx.jobAssignment.findUnique({
        where: { id: assignmentId },
        include: { job: true, worker: { include: { wallet: true } } },
      });

      if (!assignment) {
        throw new NotFoundException('Không tìm thấy ca làm việc này.');
      }

      // Cập nhật trạng thái hoàn thành
      await tx.jobAssignment.update({
        where: { id: assignmentId },
        data: {
          status: AssignmentStatus.COMPLETED,
          proofImageUrl,
          completedAt: new Date(),
        },
      });

      // Tính 10% hoa hồng nền tảng dựa trên mức lương thợ nhận
      const wage = Number(assignment.job.wagePerWorker);
      const commission = wage * 0.1; // 10%

      // Ghi log công nợ hoa hồng
      await tx.debtLog.create({
        data: {
          userId: assignment.workerId,
          jobId: assignment.jobId,
          jobTotalWage: wage,
          commissionAmount: commission,
          paymentMethod: 'CASH_OR_DIRECT_TRANSFER',
          status: 'UNPAID',
        },
      });

      // Cập nhật ví công nợ của thợ
      const currentDebt = Number(assignment.worker.wallet?.debtBalance || 0);
      const newDebt = currentDebt + commission;
      const debtLimit = Number(assignment.worker.wallet?.debtLimit || 200000);

      // Cập nhật nợ và hạn chót trả (24 giờ kể từ lúc hoàn thành)
      const dueDate = new Date();
      dueDate.setHours(dueDate.getHours() + 24);

      await tx.userWallet.update({
        where: { userId: assignment.workerId },
        data: {
          debtBalance: newDebt,
          debtDueDate: dueDate,
        },
      });

      // Nếu nợ vượt quá hạn mức cho phép -> Khóa tài khoản DEBT_LOCKED
      let isLocked = false;
      if (newDebt > debtLimit) {
        await tx.user.update({
          where: { id: assignment.workerId },
          data: { status: UserStatus.DEBT_LOCKED },
        });
        isLocked = true;
      }

      return {
        success: true,
        message: 'Đã nghiệm thu thành công.',
        commissionDeducted: commission,
        totalDebt: newDebt,
        isDebtLocked: isLocked,
      };
    });
  }
}
