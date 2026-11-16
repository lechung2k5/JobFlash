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
    placeholder: string;

    success: string;
    warning: string;
    error: string;
}

export const LIGHT_COLORS: ThemeColors = {
    primary: '#6f00c5',
    primaryContainer: '#8b2ce6',
    onPrimary: '#ffffff',
    primaryFixed: '#efdbff',

    secondary: '#df1875',
    secondaryContainer: '#f43f5e',
    onSecondary: '#ffffff',
    secondaryFixed: '#ffd9e1',

    tertiary: '#4632c0',

    background: '#faf8fc',
    surface: '#ffffff',
    surfaceDim: '#e1d5f2',
    surfaceContainerLow: '#f9f1ff',
    surfaceContainer: '#f4eaff',
    surfaceContainerHigh: '#efe3ff',

    onSurface: '#1f182d',
    onSurfaceVariant: '#4c4355',
    outline: '#7e7386',
    outlineVariant: '#cfc2d7',

    card: '#ffffff',
    border: '#ebdffa',
    text: '#111827',
    textSecondary: '#6b7280',
    placeholder: '#9ca3af',

    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
};

export const DARK_COLORS: ThemeColors = {
    primary: '#a855f7',
    primaryContainer: '#7e22ce',
    onPrimary: '#ffffff',
    primaryFixed: '#3b0764',

    secondary: '#f43f5e',
    secondaryContainer: '#be123c',
    onSecondary: '#ffffff',
    secondaryFixed: '#4c0519',

    tertiary: '#818cf8',

    background: '#0d0914',
    surface: '#171222',
    surfaceDim: '#120d1c',
    surfaceContainerLow: '#1e182c',
    surfaceContainer: '#261f38',
    surfaceContainerHigh: '#322949',

    onSurface: '#f5f3ff',
    onSurfaceVariant: '#c4b5fd',
    outline: '#6d5a88',
    outlineVariant: '#433757',

    card: '#1b1428',
    border: '#34254b',
    text: '#f9fafb',
    textSecondary: '#9ca3af',
    placeholder: '#6b7280',

    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
};

export const GRADIENTS = {
    electric: ['#6f00c5', '#df1875'] as const,
    primary: ['#6f00c5', '#8b2ce6'] as const,
    worker: ['#e11d48', '#df1875', '#7c3aed'] as const,
    cardGlassLight: ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)'] as const,
    cardGlassDark: ['rgba(30, 24, 44, 0.95)', 'rgba(20, 15, 30, 0.85)'] as const,
    success: ['#059669', '#10b981'] as const,
};

export const SHADOWS = {
    electricGlow: {
        shadowColor: '#df1875',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 8,
    },
    card: {
        shadowColor: '#6f00c5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    floating: {
        shadowColor: '#1f182d',
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
