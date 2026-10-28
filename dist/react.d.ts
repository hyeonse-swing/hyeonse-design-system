import type { ReactNode } from 'react';
import type { Preferences } from './preferences.js';
export type Locale = 'ko' | 'en';
type PreferenceContext = {
    preferences: Preferences;
    setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
    resetPreferences: () => void;
};
export declare function PreferencesProvider({ children, storageKey, eventName, defaults }: {
    children: ReactNode;
    storageKey?: string;
    eventName?: string;
    defaults?: Partial<Preferences>;
}): import("react").JSX.Element;
export declare function usePreferences(): PreferenceContext;
export declare function ThemeToggle({ locale }: {
    locale?: Locale;
}): import("react").JSX.Element;
export declare function PreferencesPanel({ locale }: {
    locale?: Locale;
}): import("react").JSX.Element;
export {};
