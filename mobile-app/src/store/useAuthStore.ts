import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Định nghĩa kiểu dữ liệu
interface AuthState {
    token: string | null;
    userRole: 'requester' | 'worker' | null;
    userInfo: { name: string; phone: string; avatar?: string } | null;
    user: any | null;

    // Các hàm thay đổi state
    setRole: (role: 'requester' | 'worker') => void;
    setAuth: (token: string, userInfo: any) => void;
    logout: () => Promise<void> | void;
}

// Khởi tạo Store
export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            userRole: null,
            userInfo: null,
            user: null,

            setRole: (role) => set({ userRole: role }),
            setAuth: (token, userInfo) => set({ token, userInfo, user: userInfo }),
            logout: async () => {
                try {
                    await AsyncStorage.removeItem('jobflash-auth-storage');
                } catch (e) {
                    console.warn('[AuthStore] Lỗi xóa storage:', e);
                }
                set({ token: null, userRole: null, userInfo: null, user: null });
            },
        }),
        {
            name: 'jobflash-auth-storage', // Tên key lưu trong điện thoại
            storage: createJSONStorage(() => AsyncStorage), // Dùng AsyncStorage cho React Native
        }
    )
);