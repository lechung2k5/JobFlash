import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/useAuthStore';

// Tự động nhận diện IP máy chủ để điện thoại thật kết nối được qua Wi-Fi
const getBaseUrl = () => {
  try {
    // Lấy IP của máy tính đang chạy Expo từ hostUri (ví dụ: "192.168.4.10:8081" -> "192.168.4.10")
    const hostUri = Constants?.expoConfig?.hostUri;
    const hostIp = hostUri ? hostUri.split(':')[0] : '192.168.4.10';

    if (Platform.OS === 'android' && !hostUri) {
      return 'http://10.0.2.2:3000/api/v1';
    }
    return `http://${hostIp || '192.168.4.10'}:3000/api/v1`;
  } catch {
    return 'http://192.168.4.10:3000/api/v1';
  }
};

export const API_BASE_URL = getBaseUrl();

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || `Lỗi yêu cầu: ${response.status}`;
    throw new Error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
  }

  return data as T;
}

export const JobFlashAPI = {
  // Auth APIs
  auth: {
    sendOtp: (phone: string) =>
      request<{ success: boolean; devOtp: string }>('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      }),

    verifyOtp: (phone: string, otp: string, role?: string) =>
      request<{ accessToken: string; user: any }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, otp, role }),
      }),
  },

  // Users & Thợ APIs
  users: {
    getMe: () => request<any>('/users/me'),
    updateProfile: (profileData: {
      fullName?: string;
      email?: string;
      address?: string;
      gender?: string;
      dateOfBirth?: string;
      avatarUrl?: string;
      latitude?: number;
      longitude?: number;
    }) =>
      request<any>('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      }),
    updateWorkerProfile: (profileData: any) =>
      request<any>('/users/worker-profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      }),
    switchRole: (role: string) =>
      request<any>('/users/switch-role', {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }),
  },

  // Upload Cloudinary APIs
  upload: {
    uploadImage: (fileBase64: string, folder: string = 'jobflash/avatars') =>
      request<{ success: boolean; data: { url: string; publicId: string } }>('/upload/image', {
        method: 'POST',
        body: JSON.stringify({ file: fileBase64, folder }),
      }),
    verifyIdCard: (fileBase64: string, side: 'front' | 'back') =>
      request<{
        success: boolean;
        data: {
          isClear: boolean;
          qualityScore: number;
          message: string;
          url?: string;
          side: 'front' | 'back';
          detectedIdNumber?: string;
          fullName?: string;
          dateOfBirth?: string;
          address?: string;
        };
      }>('/upload/verify-id-card', {
        method: 'POST',
        body: JSON.stringify({ file: fileBase64, side }),
      }),
    getUploadConfig: (folder: string = 'jobflash/avatars') =>
      request<{ success: boolean; data: any }>(`/upload/config?folder=${folder}`),
  },

  // Jobs & Radar APIs
  jobs: {
    createJob: (jobData: any) =>
      request<any>('/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData),
      }),

    findNearestWorkers: (lat: number, lng: number, radiusKm: number = 10) =>
      request<any[]>(`/jobs/nearest-workers?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`),

    acceptJob: (jobId: string) =>
      request<any>(`/jobs/${jobId}/accept`, {
        method: 'POST',
      }),

    completeAssignment: (assignmentId: string, proofImageUrl?: string) =>
      request<any>(`/jobs/assignments/${assignmentId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ proofImageUrl }),
      }),
  },

  // Wallet & Nợ hoa hồng 10% APIs
  wallet: {
    getMyWallet: () => request<any>('/wallet/me'),
    settleDebt: (paidAmount: number) => {
      const phone = useAuthStore.getState().user?.phone || '0912345678';
      return request<any>('/wallet/webhook/payment-settlement', {
        method: 'POST',
        body: JSON.stringify({ phone, paidAmount }),
      });
    },
  },
};
