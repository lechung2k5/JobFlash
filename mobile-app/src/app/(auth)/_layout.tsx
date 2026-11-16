import { Stack } from 'expo-router';

export default function AuthLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            {/* Ẩn header cho toàn bộ các màn hình nằm trong thư mục (auth) */}
            <Stack.Screen name="role-select" />
            <Stack.Screen name="login" />
            <Stack.Screen name="profile-setup" />
        </Stack>
    );
}