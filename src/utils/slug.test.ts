import { describe, it, expect } from 'vitest';
import { generateSlug, isSlugConsistent, ensureUniqueSlug } from './slug';

describe('slug utilities', () => {
    describe('generateSlug', () => {
        it('generates basic slugs from names', () => {
            expect(generateSlug('Test Provider')).toBe('test-provider');
            expect(generateSlug('OpenAI')).toBe('openai');
            expect(generateSlug('Google Cloud')).toBe('google-cloud');
        });

        it('handles special characters', () => {
            expect(generateSlug('Test & Provider')).toBe('test-provider');
            expect(generateSlug('Test / Provider')).toBe('test-provider');
            expect(generateSlug('Test (Provider)')).toBe('test-provider');
        });

        it('handles unicode characters', () => {
            expect(generateSlug('Naïve')).toBe('naive');
            expect(generateSlug('Café')).toBe('cafe');
            expect(generateSlug('测试')).toBe(''); // Chinese characters may not convert to ASCII
        });

        it('handles multiple spaces and dashes', () => {
            expect(generateSlug('Test   Provider')).toBe('test-provider');
            expect(generateSlug('Test--Provider')).toBe('test-provider');
            expect(generateSlug('Test - Provider')).toBe('test-provider');
        });

        it('handles leading and trailing spaces/dashes', () => {
            expect(generateSlug('  Test Provider  ')).toBe('test-provider');
            expect(generateSlug('-Test Provider-')).toBe('test-provider');
        });

        it('handles numbers', () => {
            expect(generateSlug('Provider 2.0')).toBe('provider-2-0');
            expect(generateSlug('Test123')).toBe('test123');
        });

        it('handles empty strings', () => {
            expect(generateSlug('')).toBe('');
            expect(generateSlug('   ')).toBe('');
        });

        it('preserves valid characters', () => {
            expect(generateSlug('test-provider-123')).toBe('test-provider-123');
            expect(generateSlug('a1b2c3')).toBe('a1b2c3');
        });
    });

    describe('isSlugConsistent', () => {
        it('returns true for consistent slugs', () => {
            expect(isSlugConsistent('Test Provider', 'test-provider')).toBe(true);
            expect(isSlugConsistent('OpenAI', 'openai')).toBe(true);
            expect(isSlugConsistent('Google Cloud', 'google-cloud')).toBe(true);
        });

        it('returns false for inconsistent slugs', () => {
            expect(isSlugConsistent('Test Provider', 'wrong-slug')).toBe(false);
            expect(isSlugConsistent('OpenAI', 'open-ai')).toBe(false);
            expect(isSlugConsistent('Google Cloud', 'google_cloud')).toBe(false);
        });

        it('handles special characters in names', () => {
            expect(isSlugConsistent('Test & Provider', 'test-provider')).toBe(true);
            expect(isSlugConsistent('Naïve', 'naive')).toBe(true);
        });
    });

    describe('ensureUniqueSlug', () => {
        it('returns original slug when not used', () => {
            const used = new Set<string>();
            expect(ensureUniqueSlug('test-slug', used)).toBe('test-slug');
            expect(used.has('test-slug')).toBe(true);
        });

        it('appends counter for collisions', () => {
            const used = new Set(['test-slug']);
            expect(ensureUniqueSlug('test-slug', used)).toBe('test-slug-2');
            expect(used.has('test-slug-2')).toBe(true);
        });

        it('handles multiple collisions', () => {
            const used = new Set(['test-slug', 'test-slug-2', 'test-slug-3']);
            expect(ensureUniqueSlug('test-slug', used)).toBe('test-slug-4');
            expect(used.has('test-slug-4')).toBe(true);
        });

        it('adds to used set', () => {
            const used = new Set<string>();
            ensureUniqueSlug('new-slug', used);
            expect(used.has('new-slug')).toBe(true);
        });

        it('works with empty used set', () => {
            const used = new Set<string>();
            expect(ensureUniqueSlug('test', used)).toBe('test');
        });
    });
});