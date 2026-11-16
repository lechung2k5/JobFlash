import { Stack } from 'expo-router';

export default function RequesterLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="create" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="radar" />
            <Stack.Screen name="tracking" />
            <Stack.Screen name="rating" />
        </Stack>
    );
}
