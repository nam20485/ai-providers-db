import { describe, it, expect } from 'vitest';
import {
    normalizeCapabilities,
    sortCapabilities,
    getCapabilityLabel,
    getCapabilityDescription,
    isValidCapability
} from './capabilities';

describe('capabilities utilities', () => {
    describe('normalizeCapabilities', () => {
        it('normalizes valid capabilities', () => {
            const result = normalizeCapabilities(['api', 'web app', 'SDK']);
            expect(result.normalized).toEqual(['web_app', 'api', 'sdk']);
            expect(result.unknown).toEqual([]);
        });

        it('handles aliases correctly', () => {
            const result = normalizeCapabilities(['web', 'rest', 'client library', 'command line']);
            expect(result.normalized).toEqual(['web_app', 'api', 'sdk', 'cli']);
            expect(result.unknown).toEqual([]);
        });

        it('filters out unknown capabilities', () => {
            const result = normalizeCapabilities(['api', 'unknown_capability', 'web_app']);
            expect(result.normalized).toEqual(['web_app', 'api']);
            expect(result.unknown).toEqual(['unknown_capability']);
        });

        it('handles parenthetical content', () => {
            const result = normalizeCapabilities(['api (rest)', 'web app (browser)']);
            expect(result.normalized).toEqual(['web_app', 'api']);
            expect(result.unknown).toEqual([]);
        });

        it('handles ampersand separators', () => {
            const result = normalizeCapabilities(['api & sdk', 'web app']);
            expect(result.normalized).toEqual(['web_app', 'api']);
            expect(result.unknown).toEqual([]);
        });

        it('handles slash separators', () => {
            const result = normalizeCapabilities(['api/sdk', 'web app']);
            expect(result.normalized).toEqual(['web_app', 'api']);
            expect(result.unknown).toEqual([]);
        });

        it('handles empty input', () => {
            const result = normalizeCapabilities([]);
            expect(result.normalized).toEqual([]);
            expect(result.unknown).toEqual([]);
        });

        it('handles null/undefined input', () => {
            const result1 = normalizeCapabilities(null);
            const result2 = normalizeCapabilities(undefined);
            expect(result1.normalized).toEqual([]);
            expect(result2.normalized).toEqual([]);
        });

        it('handles empty strings', () => {
            const result = normalizeCapabilities(['', 'api', '']);
            expect(result.normalized).toEqual(['api']);
            expect(result.unknown).toEqual([]);
        });

        it('normalizes case and spacing', () => {
            const result = normalizeCapabilities(['API', 'Web_App', 'sdk']);
            expect(result.normalized).toEqual(['web_app', 'api', 'sdk']);
            expect(result.unknown).toEqual([]);
        });
    });

    describe('sortCapabilities', () => {
        it('sorts capabilities in correct order', () => {
            const capabilities = ['sdk', 'api', 'web_app', 'cli'];
            const sorted = sortCapabilities(capabilities as any);
            expect(sorted).toEqual(['web_app', 'api', 'sdk', 'cli']);
        });

        it('handles all capability types', () => {
            const capabilities: any[] = ['other', 'ide', 'integration', 'mobile', 'desktop', 'cli', 'sdk', 'api', 'web_app'];
            const sorted = sortCapabilities(capabilities as any);
            expect(sorted).toEqual(['web_app', 'api', 'sdk', 'cli', 'desktop', 'mobile', 'ide', 'integration', 'other']);
        });

        it('returns new array without modifying original', () => {
            const original = ['sdk', 'api'];
            const sorted = sortCapabilities(original as any);
            expect(original).toEqual(['sdk', 'api']);
            expect(sorted).toEqual(['api', 'sdk']);
        });
    });

    describe('getCapabilityLabel', () => {
        it('returns correct labels for all capabilities', () => {
            expect(getCapabilityLabel('web_app')).toBe('Web App');
            expect(getCapabilityLabel('api')).toBe('API');
            expect(getCapabilityLabel('sdk')).toBe('SDK');
            expect(getCapabilityLabel('cli')).toBe('CLI');
            expect(getCapabilityLabel('desktop')).toBe('Desktop App');
            expect(getCapabilityLabel('mobile')).toBe('Mobile App');
            expect(getCapabilityLabel('ide')).toBe('IDE Extension');
            expect(getCapabilityLabel('integration')).toBe('Integration');
            expect(getCapabilityLabel('other')).toBe('Other');
        });

        it('returns key for unknown capability', () => {
            expect(getCapabilityLabel('unknown' as any)).toBe('unknown');
        });
    });

    describe('getCapabilityDescription', () => {
        it('returns descriptions for all capabilities', () => {
            expect(getCapabilityDescription('ide')).toBe('Integrated development environment extensions');
            expect(getCapabilityDescription('other')).toBe('Capabilities that require manual review');
        });
    });

    describe('isValidCapability', () => {
        it('returns true for valid capabilities', () => {
            expect(isValidCapability('web_app')).toBe(true);
            expect(isValidCapability('api')).toBe(true);
            expect(isValidCapability('sdk')).toBe(true);
            expect(isValidCapability('cli')).toBe(true);
            expect(isValidCapability('desktop')).toBe(true);
            expect(isValidCapability('mobile')).toBe(true);
            expect(isValidCapability('ide')).toBe(true);
            expect(isValidCapability('integration')).toBe(true);
            expect(isValidCapability('other')).toBe(true);
        });

        it('returns false for invalid capabilities', () => {
            expect(isValidCapability('invalid' as any)).toBe(false);
            expect(isValidCapability('' as any)).toBe(false);
            expect(isValidCapability('web' as any)).toBe(false); // alias, not key
        });
    });
});