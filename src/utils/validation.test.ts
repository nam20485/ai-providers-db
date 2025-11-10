import { describe, it, expect } from 'vitest';
import { validateProviderDataset, buildMetadata, composeLoadResult, summarizeCapabilities } from './validation';
import { ProviderDataset, ProviderRecord } from '../types';

describe('validation utilities', () => {
    describe('validateProviderDataset', () => {
        it('returns empty providers and warning for empty dataset', () => {
            const dataset: ProviderDataset = {
                schemaVersion: 1,
                providers: []
            };

            const result = validateProviderDataset(dataset);
            expect(result.providers).toEqual([]);
            expect(result.warnings).toEqual(['No providers present in dataset.']);
        });

        it('validates provider with all valid capabilities', () => {
            const provider: ProviderRecord = {
                name: 'Test Provider',
                slug: 'test-provider',
                capabilities: ['api', 'web_app'],
                openAICompatible: {
                    isCompatible: true,
                    supportedModels: ['gpt-3.5-turbo'],
                    apiKeyPortal: 'https://example.com'
                },
                models: [{ name: 'model1', availability: 'free' }]
            };

            const dataset: ProviderDataset = {
                schemaVersion: 1,
                providers: [provider]
            };

            const result = validateProviderDataset(dataset);
            expect(result.providers).toHaveLength(1);
            expect(result.providers[0].capabilities).toEqual(['web_app', 'api']); // sorted
            expect(result.warnings).toEqual([]);
        });

        it('filters out invalid capabilities and adds warning', () => {
            const provider: ProviderRecord = {
                name: 'Test Provider',
                slug: 'test-provider',
                capabilities: ['api', 'invalid_capability' as any],
                openAICompatible: {
                    isCompatible: true,
                    supportedModels: ['gpt-3.5-turbo'],
                    apiKeyPortal: 'https://example.com'
                },
                models: [{ name: 'model1', availability: 'free' }]
            };

            const dataset: ProviderDataset = {
                schemaVersion: 1,
                providers: [provider]
            };

            const result = validateProviderDataset(dataset);
            expect(result.providers[0].capabilities).toEqual(['api']);
            expect(result.warnings).toContain('Provider "Test Provider" contains unrecognized capabilities: invalid_capability. These will be ignored.');
        });

        it('generates slug when missing', () => {
            const provider = {
                name: 'Test Provider',
                capabilities: ['api'],
                openAICompatible: {
                    isCompatible: true,
                    supportedModels: ['gpt-3.5-turbo'],
                    apiKeyPortal: 'https://example.com'
                },
                models: [{ name: 'model1', availability: 'free' }]
            } as any as ProviderRecord;

            const dataset: ProviderDataset = {
                schemaVersion: 1,
                providers: [provider]
            };

            const result = validateProviderDataset(dataset);
            expect(result.providers[0].slug).toBe('test-provider');
            expect(result.warnings).toContain('Provider "Test Provider" is missing a slug. Generated fallback slug "test-provider".');
        });

        it('handles slug collisions', () => {
            const provider1: ProviderRecord = {
                name: 'Test Provider',
                slug: 'test-slug',
                capabilities: ['api'],
                openAICompatible: {
                    isCompatible: true,
                    supportedModels: ['gpt-3.5-turbo'],
                    apiKeyPortal: 'https://example.com'
                },
                models: [{ name: 'model1', availability: 'free' }]
            };

            const provider2: ProviderRecord = {
                name: 'Another Provider',
                slug: 'test-slug',
                capabilities: ['api'],
                openAICompatible: {
                    isCompatible: true,
                    supportedModels: ['gpt-3.5-turbo'],
                    apiKeyPortal: 'https://example.com'
                },
                models: [{ name: 'model1', availability: 'free' }]
            };

            const dataset: ProviderDataset = {
                schemaVersion: 1,
                providers: [provider1, provider2]
            };

            const result = validateProviderDataset(dataset);
            expect(result.providers[0].slug).toBe('test-slug');
            expect(result.providers[1].slug).toBe('test-slug-2');
            expect(result.warnings).toContain('Slug collision for provider "Another Provider" resolved as "test-slug-2". Update source data to avoid duplicates.');
        });

        it('validates OpenAI compatibility requirements', () => {
            const provider: ProviderRecord = {
                name: 'Test Provider',
                slug: 'test-provider',
                capabilities: ['api'],
                openAICompatible: {
                    isCompatible: true
                    // missing supportedModels and apiKeyPortal
                },
                models: [{ name: 'model1', availability: 'free' }]
            };

            const dataset: ProviderDataset = {
                schemaVersion: 1,
                providers: [provider]
            };

            const result = validateProviderDataset(dataset);
            expect(result.warnings).toContain('Provider "Test Provider" is marked OpenAI-compatible but has no supported models listed.');
            expect(result.warnings).toContain('Provider "Test Provider" is marked OpenAI-compatible but lacks API key portal or endpoint docs.');
        });

        it('warns about missing OpenAI compatibility metadata', () => {
            const provider: ProviderRecord = {
                name: 'Test Provider',
                slug: 'test-provider',
                capabilities: ['api'],
                openAICompatible: undefined as any,
                models: [{ name: 'model1', availability: 'free' }]
            };

            const dataset: ProviderDataset = {
                schemaVersion: 1,
                providers: [provider]
            };

            const result = validateProviderDataset(dataset);
            expect(result.warnings).toContain('Provider "Test Provider" is missing openAICompatible metadata.');
        });

        it('warns about missing models', () => {
            const provider: ProviderRecord = {
                name: 'Test Provider',
                slug: 'test-provider',
                capabilities: ['api'],
                openAICompatible: {
                    isCompatible: false
                },
                models: []
            };

            const dataset: ProviderDataset = {
                schemaVersion: 1,
                providers: [provider]
            };

            const result = validateProviderDataset(dataset);
            expect(result.warnings).toContain('Provider "Test Provider" is missing model catalog entries.');
        });

        it('warns about inconsistent slug', () => {
            const provider: ProviderRecord = {
                name: 'Test Provider',
                slug: 'wrong-slug',
                capabilities: ['api'],
                openAICompatible: {
                    isCompatible: true,
                    supportedModels: ['gpt-3.5-turbo'],
                    apiKeyPortal: 'https://example.com'
                },
                models: [{ name: 'model1', availability: 'free' }]
            };

            const dataset: ProviderDataset = {
                schemaVersion: 1,
                providers: [provider]
            };

            const result = validateProviderDataset(dataset);
            expect(result.warnings).toContain('Slug "wrong-slug" for provider "Test Provider" does not match generated slug "test-provider".');
        });

        it('warns about providers with no valid capabilities', () => {
            const provider: ProviderRecord = {
                name: 'Test Provider',
                slug: 'test-provider',
                capabilities: ['invalid1' as any, 'invalid2' as any],
                openAICompatible: {
                    isCompatible: true,
                    supportedModels: ['gpt-3.5-turbo'],
                    apiKeyPortal: 'https://example.com'
                },
                models: [{ name: 'model1', availability: 'free' }]
            };

            const dataset: ProviderDataset = {
                schemaVersion: 1,
                providers: [provider]
            };

            const result = validateProviderDataset(dataset);
            expect(result.providers[0].capabilities).toEqual([]);
            expect(result.warnings).toContain('Provider "Test Provider" does not declare any valid capabilities.');
        });
    });

    describe('buildMetadata', () => {
        it('builds metadata with correct structure', () => {
            const metadata = buildMetadata({
                origin: 'unified',
                fromCache: false,
                sources: ['file1.json', 'file2.json'],
                schemaVersion: 2,
                recordCount: 10
            });

            expect(metadata.origin).toBe('unified');
            expect(metadata.label).toBe('Unified dataset');
            expect(metadata.sources).toEqual(['file1.json', 'file2.json']);
            expect(metadata.fromCache).toBe(false);
            expect(metadata.recordCount).toBe(10);
            expect(metadata.schemaVersion).toBe(2);
            expect(metadata.savedAt).toBeDefined();
            expect(metadata.loadedAt).toBeDefined();
        });

        it('handles cache metadata correctly', () => {
            const metadata = buildMetadata({
                origin: 'cache',
                fromCache: true,
                sources: ['cache'],
                recordCount: 5
            });

            expect(metadata.fromCache).toBe(true);
            expect(metadata.savedAt).toBeUndefined();
        });
    });

    describe('composeLoadResult', () => {
        it('composes load result correctly', () => {
            const providers: ProviderRecord[] = [{
                name: 'Test',
                slug: 'test',
                capabilities: ['api'],
                openAICompatible: { isCompatible: false },
                models: []
            }];

            const metadata = buildMetadata({
                origin: 'unified',
                fromCache: false,
                sources: ['test.json'],
                recordCount: 1
            });

            const warnings = ['Test warning'];

            const result = composeLoadResult(providers, metadata, warnings);

            expect(result.providers).toBe(providers);
            expect(result.metadata).toBe(metadata);
            expect(result.warnings).toBe(warnings);
        });
    });

    describe('summarizeCapabilities', () => {
        it('summarizes capabilities with display labels', () => {
            const summary = summarizeCapabilities(['api', 'web_app', 'sdk']);
            expect(summary).toBe('API, Web App, SDK');
        });

        it('handles empty capabilities', () => {
            const summary = summarizeCapabilities([]);
            expect(summary).toBe('');
        });
    });
});