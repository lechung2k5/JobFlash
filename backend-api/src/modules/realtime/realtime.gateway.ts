import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service.js';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly prisma: PrismaService) {}

  handleConnection(client: Socket) {
    // Client kết nối Socket
  }

  handleDisconnect(client: Socket) {
    // Client ngắt kết nối
  }

  // 1. Gia nhập phòng theo dõi công việc
  @SubscribeMessage('job:join_room')
  handleJoinJobRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody('jobId') jobId: string,
  ) {
    client.join(`job_${jobId}`);
    return { status: 'joined', room: `job_${jobId}` };
  }

  // 2. Cập nhật vị trí thợ với Mini-Payload (Siêu tốc & Tiết kiệm byte)
  // Compact payload: [workerId, lat, lng, speed, heading]
  @SubscribeMessage('worker:location_update')
  async handleWorkerLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: [string, number, number, number?, number?],
  ) {
    const [workerId, lat, lng, speed, heading] = payload;

    // Broadcast ngay lập tức cho client theo dõi với độ trễ thấp nhất
    this.server.emit(`worker_location_${workerId}`, {
      workerId,
      lat,
      lng,
      speed: speed || 0,
      heading: heading || 0,
      timestamp: Date.now(),
    });

    // Cập nhật vị trí thợ trong database ngầm
    try {
      await this.prisma.workerProfile.update({
        where: { userId: workerId },
        data: {
          latitude: lat,
          longitude: lng,
        },
      });
    } catch (e) {
      // bỏ qua lỗi cập nhật ngầm để đảm bảo tốc độ socket
    }
  }

  // 3. Nhắn tin Chat thời gian thực (Kèm ảnh S3)
  @SubscribeMessage('chat:send_message')
  async handleChatMessage(
    @MessageBody() data: { jobId: string; senderId: string; text?: string; imageUrl?: string },
  ) {
    const message = await this.prisma.message.create({
      data: {
        jobId: data.jobId,
        senderId: data.senderId,
        text: data.text,
        imageUrl: data.imageUrl,
      },
      include: {
        sender: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });

    // Bắn tin nhắn đến phòng chat của Job
    this.server.to(`job_${data.jobId}`).emit('chat:new_message', message);
    return message;
  }

  // 4. WebRTC Signaling cho cuộc gọi trực tiếp qua App (In-App VoIP Call)
  @SubscribeMessage('call:signal')
  handleCallSignal(
    @MessageBody() data: { toUserId: string; signal: any; fromUserId: string },
  ) {
    this.server.emit(`call_signal_${data.toUserId}`, {
      fromUserId: data.fromUserId,
      signal: data.signal,
    });
  }
}
