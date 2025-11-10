import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getStoredTheme, setStoredTheme, type Theme } from './theme';

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

describe('theme utilities', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getStoredTheme', () => {
        it('returns "dark" when no stored value', () => {
            localStorageMock.getItem.mockReturnValue(null);
            expect(getStoredTheme()).toBe('dark');
        });

        it('returns "dark" when stored value is not "light"', () => {
            localStorageMock.getItem.mockReturnValue('invalid');
            expect(getStoredTheme()).toBe('dark');
        });

        it('returns "light" when stored value is "light"', () => {
            localStorageMock.getItem.mockReturnValue('light');
            expect(getStoredTheme()).toBe('light');
        });

        it('returns "dark" when localStorage throws', () => {
            localStorageMock.getItem.mockImplementation(() => {
                throw new Error('Storage error');
            });
            expect(getStoredTheme()).toBe('dark');
        });

        it('returns "dark" when window is undefined', () => {
            const originalWindow = global.window;
            // @ts-ignore
            delete global.window;
            expect(getStoredTheme()).toBe('dark');
            global.window = originalWindow;
        });
    });

    describe('setStoredTheme', () => {
        it('sets "dark" theme in localStorage', () => {
            setStoredTheme('dark');
            expect(localStorageMock.setItem).toHaveBeenCalledWith('ai_providers_theme', 'dark');
        });

        it('sets "light" theme in localStorage', () => {
            setStoredTheme('light');
            expect(localStorageMock.setItem).toHaveBeenCalledWith('ai_providers_theme', 'light');
        });

        it('does nothing when localStorage throws', () => {
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('Storage error');
            });
            expect(() => setStoredTheme('dark')).not.toThrow();
        });

        it('does nothing when window is undefined', () => {
            const originalWindow = global.window;
            // @ts-ignore
            delete global.window;
            expect(() => setStoredTheme('dark')).not.toThrow();
            global.window = originalWindow;
        });
    });
});