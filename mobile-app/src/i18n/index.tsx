import React, { createContext, useContext, useState } from 'react';
import { vi } from './vi';
import { en } from './en';

export type LanguageCode = 'vi' | 'en';

type Translations = typeof vi;

interface I18nContextType {
    language: LanguageCode;
    setLanguage: (lang: LanguageCode) => void;
    toggleLanguage: () => void;
    t: (keyPath: string, fallback?: string) => string;
}

const translations: Record<LanguageCode, Translations> = {
    vi,
    en,
};

const I18nContext = createContext<I18nContextType>({
    language: 'vi',
    setLanguage: () => {},
    toggleLanguage: () => {},
    t: (keyPath: string, fallback?: string) => fallback || keyPath,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<LanguageCode>('vi');

    const toggleLanguage = () => {
        setLanguage((prev) => (prev === 'vi' ? 'en' : 'vi'));
    };

    const t = (keyPath: string, fallback?: string): string => {
        const keys = keyPath.split('.');
        let current: any = translations[language];

        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                // Thử tìm trong tiếng Việt nếu tiếng Anh thiếu
                let viFallback: any = translations.vi;
                for (const fbKey of keys) {
                    if (viFallback && typeof viFallback === 'object' && fbKey in viFallback) {
                        viFallback = viFallback[fbKey];
                    } else {
                        return fallback || keyPath;
                    }
                }
                return typeof viFallback === 'string' ? viFallback : fallback || keyPath;
            }
        }

        return typeof current === 'string' ? current : fallback || keyPath;
    };

    return (
        <I18nContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useI18n = () => useContext(I18nContext);
