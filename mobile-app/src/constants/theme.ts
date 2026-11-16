import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
    primary: string;
    primaryContainer: string;
    onPrimary: string;
    primaryFixed: string;

    secondary: string;
    secondaryContainer: string;
    onSecondary: string;
    secondaryFixed: string;

    tertiary: string;

    background: string;
    surface: string;
    surfaceDim: string;
    surfaceContainerLow: string;
    surfaceContainer: string;
    surfaceContainerHigh: string;

    onSurface: string;
    onSurfaceVariant: string;
    outline: string;
    outlineVariant: string;

    card: string;
    border: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    placeholder: string;

    success: string;
    warning: string;
    error: string;
}

export const LIGHT_COLORS: ThemeColors = {
    primary: '#2563eb',
    primaryContainer: '#3b82f6',
    onPrimary: '#ffffff',
    primaryFixed: '#dbeafe',

    secondary: '#0284c7',
    secondaryContainer: '#38bdf8',
    onSecondary: '#ffffff',
    secondaryFixed: '#e0f2fe',

    tertiary: '#1d4ed8',

    background: '#f8fafc',
    surface: '#ffffff',
    surfaceDim: '#e2e8f0',
    surfaceContainerLow: '#f1f5f9',
    surfaceContainer: '#eff6ff',
    surfaceContainerHigh: '#dbeafe',

    onSurface: '#0f172a',
    onSurfaceVariant: '#334155',
    outline: '#64748b',
    outlineVariant: '#cbd5e1',

    card: '#ffffff',
    border: '#e2e8f0',
    text: '#0f172a',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    placeholder: '#94a3b8',

    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
};

export const DARK_COLORS: ThemeColors = {
    primary: '#3b82f6',
    primaryContainer: '#1d4ed8',
    onPrimary: '#ffffff',
    primaryFixed: '#172554',

    secondary: '#38bdf8',
    secondaryContainer: '#0284c7',
    onSecondary: '#ffffff',
    secondaryFixed: '#082f49',

    tertiary: '#60a5fa',

    background: '#0b0f19',
    surface: '#111827',
    surfaceDim: '#0f172a',
    surfaceContainerLow: '#1e293b',
    surfaceContainer: '#1e293b',
    surfaceContainerHigh: '#334155',

    onSurface: '#f8fafc',
    onSurfaceVariant: '#94a3b8',
    outline: '#64748b',
    outlineVariant: '#334155',

    card: '#111827',
    border: '#1e293b',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    textTertiary: '#64748b',
    placeholder: '#64748b',

    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
};

export const GRADIENTS = {
    electric: ['#1d4ed8', '#2563eb', '#3b82f6'] as const,
    primary: ['#1e40af', '#2563eb'] as const,
    worker: ['#0284c7', '#2563eb', '#1d4ed8'] as const,
    cardGlassLight: ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)'] as const,
    cardGlassDark: ['rgba(17, 24, 39, 0.95)', 'rgba(15, 23, 42, 0.85)'] as const,
    success: ['#059669', '#10b981'] as const,
};

export const SHADOWS = {
    soft: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    electricGlow: {
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    card: {
        shadowColor: '#1d4ed8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    floating: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
};

export const THEME = {
    colors: LIGHT_COLORS,
    gradients: GRADIENTS,
    shadows: SHADOWS,
};

// React Context & Provider for Theme
interface ThemeContextType {
    mode: ThemeMode;
    isDark: boolean;
    colors: ThemeColors;
    gradients: typeof GRADIENTS;
    shadows: typeof SHADOWS;
    setThemeMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    mode: 'light',
    isDark: false,
    colors: LIGHT_COLORS,
    gradients: GRADIENTS,
    shadows: SHADOWS,
    setThemeMode: () => {},
    toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [mode, setMode] = useState<ThemeMode>('light');

    const isDark = mode === 'system' ? systemColorScheme === 'dark' : mode === 'dark';
    const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

    const toggleTheme = () => {
        setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    return React.createElement(
        ThemeContext.Provider,
        {
            value: {
                mode,
                isDark,
                colors,
                gradients: GRADIENTS,
                shadows: SHADOWS,
                setThemeMode: setMode,
                toggleTheme,
            },
        },
        children
    );
};

export const useAppTheme = () => useContext(ThemeContext);
