import { DataSourceInfo, ProviderDataset, ProviderLoadResult, ProviderRecord } from '../types';
import { getCapabilityLabel, isValidCapability, sortCapabilities } from './capabilities';
import { ensureUniqueSlug, generateSlug, isSlugConsistent } from './slug';

interface BuildMetadataOptions {
    origin: DataSourceInfo['origin'];
    fromCache: boolean;
    sources: string[];
    schemaVersion?: number;
    recordCount: number;
}

export function validateProviderDataset(dataset: ProviderDataset): { providers: ProviderRecord[]; warnings: string[] } {
    const warnings: string[] = [];

    if (!dataset.providers || dataset.providers.length === 0) {
        return { providers: [], warnings: ['No providers present in dataset.'] };
    }

    const usedSlugs = new Set<string>();
    const sanitizedProviders = dataset.providers.map((provider) => {
        const normalizedCapabilities = sortCapabilities(provider.capabilities ?? []);
        const invalidCaps = normalizedCapabilities.filter((capability) => !isValidCapability(capability));

        if (invalidCaps.length > 0) {
            warnings.push(
                `Provider "${provider.name}" contains unrecognized capabilities: ${invalidCaps.join(', ')}. These will be ignored.`
            );
        }

        const validCapabilities = normalizedCapabilities.filter(isValidCapability);
        if (validCapabilities.length === 0) {
            warnings.push(`Provider "${provider.name}" does not declare any valid capabilities.`);
        }

        if (!provider.slug) {
            const generated = generateSlug(provider.name);
            warnings.push(`Provider "${provider.name}" is missing a slug. Generated fallback slug "${generated}".`);
            provider.slug = ensureUniqueSlug(generated, usedSlugs);
        } else {
            const candidate = ensureUniqueSlug(provider.slug, usedSlugs);
            if (candidate !== provider.slug) {
                warnings.push(
                    `Slug collision for provider "${provider.name}" resolved as "${candidate}". Update source data to avoid duplicates.`
                );
                provider.slug = candidate;
            } else if (!isSlugConsistent(provider.name, provider.slug)) {
                warnings.push(
                    `Slug "${provider.slug}" for provider "${provider.name}" does not match generated slug "${generateSlug(provider.name)}".`
                );
            }
        }

        const compat = provider.openAICompatible;
        if (!compat) {
            warnings.push(`Provider "${provider.name}" is missing openAICompatible metadata.`);
        } else if (compat.isCompatible) {
            if (!compat.supportedModels || compat.supportedModels.length === 0) {
                warnings.push(
                    `Provider "${provider.name}" is marked OpenAI-compatible but has no supported models listed.`
                );
            }
            if (!compat.apiKeyPortal && !compat.endpointDocs) {
                warnings.push(
                    `Provider "${provider.name}" is marked OpenAI-compatible but lacks API key portal or endpoint docs.`
                );
            }
        }

        if (!provider.models || provider.models.length === 0) {
            warnings.push(`Provider "${provider.name}" is missing model catalog entries.`);
        }

        provider.capabilities = validCapabilities;

        return provider;
    });

    return { providers: sanitizedProviders, warnings };
}

export function buildMetadata({ origin, fromCache, sources, schemaVersion, recordCount }: BuildMetadataOptions): DataSourceInfo {
    const timestamp = new Date().toISOString();
    return {
        origin,
        label: 'Unified dataset',
        sources,
        fromCache,
        savedAt: fromCache ? undefined : timestamp,
        loadedAt: timestamp,
        schemaVersion,
        recordCount
    };
}

export function composeLoadResult(
    providers: ProviderRecord[],
    metadata: DataSourceInfo,
    warnings: string[]
): ProviderLoadResult {
    return {
        providers,
        metadata,
        warnings
    };
}

export function summarizeCapabilities(capabilities: string[]): string {
    return capabilities.map((key) => getCapabilityLabel(key as any)).join(', ');
}
