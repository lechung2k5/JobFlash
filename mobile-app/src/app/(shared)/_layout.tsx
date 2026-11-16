import { Stack } from 'expo-router';

export default function SharedLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="chat" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="call" options={{ animation: 'fade', presentation: 'fullScreenModal' }} />
        </Stack>
    );
}
