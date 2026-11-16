import '../global.css';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useAppTheme } from '../constants/theme';
import { I18nProvider } from '../i18n';

function AppNavigator() {
    const { isDark } = useAppTheme();
    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack initialRouteName="index" screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(requester)" />
                <Stack.Screen name="(worker)" />
                <Stack.Screen name="(shared)" />
            </Stack>
        </>
    );
}

export default function RootLayout() {
    return (
        <ThemeProvider>
            <I18nProvider>
                <AppNavigator />
            </I18nProvider>
        </ThemeProvider>
    );
}
