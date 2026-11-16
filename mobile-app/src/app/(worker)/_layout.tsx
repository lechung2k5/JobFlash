import { Stack } from 'expo-router';

export default function WorkerLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="alert" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="onduty" />
            <Stack.Screen name="proof" />
            <Stack.Screen name="wallet" />
        </Stack>
    );
}
