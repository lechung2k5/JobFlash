import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getSocketUrl = () => {
    const hostUri = Constants.expoConfig?.hostUri;
    const hostIp = hostUri ? hostUri.split(':')[0] : '192.168.4.10';

    if (Platform.OS === 'android' && !hostUri) {
        return 'http://10.0.2.2:3000';
    }
    return `http://${hostIp}:3000`;
};

class RealtimeSocketService {
    private socket: Socket | null = null;

    connect() {
        if (this.socket && this.socket.connected) return this.socket;

        this.socket = io(getSocketUrl(), {
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
            // Socket connected
        });

        return this.socket;
    }

    joinJobRoom(jobId: string) {
        if (!this.socket) this.connect();
        this.socket?.emit('job:join_room', { jobId });
    }

    // Gửi vị trí siêu tốc mini-payload: [workerId, lat, lng, speed, heading]
    sendWorkerLocation(workerId: string, lat: number, lng: number, speed: number = 0, heading: number = 0) {
        if (!this.socket) this.connect();
        this.socket?.emit('worker:location_update', [workerId, lat, lng, speed, heading]);
    }

    // Lắng nghe vị trí thợ
    onWorkerLocation(workerId: string, callback: (data: any) => void) {
        if (!this.socket) this.connect();
        this.socket?.on(`worker_location_${workerId}`, callback);
    }

    // Gửi tin nhắn chat kèm ảnh
    sendChatMessage(jobId: string, senderId: string, text?: string, imageUrl?: string) {
        if (!this.socket) this.connect();
        this.socket?.emit('chat:send_message', { jobId, senderId, text, imageUrl });
    }

    // Lắng nghe tin nhắn mới
    onChatMessage(callback: (message: any) => void) {
        if (!this.socket) this.connect();
        this.socket?.on('chat:new_message', callback);
    }

    // WebRTC call signaling
    sendCallSignal(toUserId: string, signal: any, fromUserId: string) {
        if (!this.socket) this.connect();
        this.socket?.emit('call:signal', { toUserId, signal, fromUserId });
    }

    onCallSignal(myUserId: string, callback: (data: any) => void) {
        if (!this.socket) this.connect();
        this.socket?.on(`call_signal_${myUserId}`, callback);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = new RealtimeSocketService();
