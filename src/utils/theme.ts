export type Theme = 'dark' | 'light';

const THEME_KEY = 'ai_providers_theme';

export function getStoredTheme(): Theme {
    if (typeof window === 'undefined') return 'dark';
    try {
        const stored = localStorage.getItem(THEME_KEY);
        return stored === 'light' ? 'light' : 'dark';
    } catch {
        return 'dark';
    }
}

export function setStoredTheme(theme: Theme): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch {
        // Ignore storage errors
    }
}