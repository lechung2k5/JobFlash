import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JobsService } from './jobs.service.js';
import { CreateJobDto } from './dto/create-job.dto.js';

@ApiTags('Jobs - Quản lý Công việc & Radar thợ gần nhất')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ApiOperation({ summary: 'Người thuê tạo công việc mới' })
  async createJob(@Request() req: any, @Body() dto: CreateJobDto) {
    return this.jobsService.createJob(req.user.id, dto);
  }

  @Get('nearest-workers')
  @ApiOperation({ summary: 'Tìm kiếm top thợ gần nhất dựa trên tọa độ OpenStreetMap & PostGIS' })
  @ApiQuery({ name: 'lat', type: Number, example: 10.7924 })
  @ApiQuery({ name: 'lng', type: Number, example: 106.6835 })
  @ApiQuery({ name: 'radiusKm', type: Number, required: false, example: 10 })
  async findNearestWorkers(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radiusKm') radiusKm?: number,
  ) {
    return this.jobsService.findNearestWorkers(Number(lat), Number(lng), radiusKm ? Number(radiusKm) : 10);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Thợ bấm chấp nhận cuốc việc (Atomic Locking)' })
  async acceptJob(@Param('id') jobId: string, @Request() req: any) {
    return this.jobsService.acceptJob(jobId, req.user.id);
  }

  @Post('assignments/:id/complete')
  @ApiOperation({ summary: 'Nghiệm thu ca làm việc, tự động tính 10% hoa hồng và trừ nợ thợ' })
  async completeAssignment(
    @Param('id') assignmentId: string,
    @Body('proofImageUrl') proofImageUrl?: string,
  ) {
    return this.jobsService.completeAssignment(assignmentId, proofImageUrl);
  }
}
