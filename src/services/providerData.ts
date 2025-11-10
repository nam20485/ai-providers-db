import { ProviderDataset, ProviderLoadResult } from '../types';
import { buildMetadata, composeLoadResult, validateProviderDataset } from '../utils/validation';

const DATA_URL = 'provider-data/providers.json';
const CACHE_KEY_DATA = 'ai_providers_unified_data';
const CACHE_KEY_META = 'ai_providers_unified_metadata';

const SOURCES = [DATA_URL];

function hasWindowStorage(): boolean {
    return typeof window !== 'undefined' && typeof window.storage !== 'undefined';
}

async function fetchDataset(): Promise<ProviderDataset> {
    const response = await fetch(DATA_URL, { cache: 'no-cache' });
    if (!response.ok) {
        throw new Error(`Failed to fetch providers.json (${response.status})`);
    }
    return response.json();
}

async function writeToCache(dataset: ProviderDataset, serializedMetadata: string): Promise<void> {
    if (!hasWindowStorage()) {
        return;
    }
    try {
        await window.storage!.set(CACHE_KEY_DATA, JSON.stringify(dataset));
        await window.storage!.set(CACHE_KEY_META, serializedMetadata);
    } catch (error) {
        console.warn('Unable to persist dataset to cache.', error);
    }
}

export async function attemptLoadFromCache(): Promise<ProviderLoadResult | null> {
    if (!hasWindowStorage()) {
        return null;
    }

    try {
        const [dataPayload, metadataPayload] = await Promise.all([
            window.storage!.get(CACHE_KEY_DATA),
            window.storage!.get(CACHE_KEY_META)
        ]);

        if (!dataPayload?.value) {
            return null;
        }

        const dataset = JSON.parse(dataPayload.value) as ProviderDataset;
        const { providers, warnings } = validateProviderDataset(dataset);

        let savedAt: string | undefined;
        let schemaVersion: number | undefined;

        if (metadataPayload?.value) {
            try {
                const parsedMeta = JSON.parse(metadataPayload.value) as { savedAt?: string; schemaVersion?: number };
                savedAt = parsedMeta.savedAt;
                schemaVersion = parsedMeta.schemaVersion;
            } catch (error) {
                console.warn('Unable to parse cached metadata payload.', error);
            }
        }

        const metadata = buildMetadata({
            origin: 'cache',
            fromCache: true,
            sources: SOURCES,
            schemaVersion: schemaVersion ?? dataset.schemaVersion,
            recordCount: providers.length
        });

        metadata.savedAt = savedAt ?? metadata.savedAt;

        return composeLoadResult(providers, metadata, warnings);
    } catch (error) {
        console.warn('Failed to read cached provider data.', error);
        return null;
    }
}

export async function fetchUnifiedDataset(): Promise<ProviderLoadResult> {
    const dataset = await fetchDataset();
    const { providers, warnings } = validateProviderDataset(dataset);

    const metadata = buildMetadata({
        origin: 'unified',
        fromCache: false,
        sources: SOURCES,
        schemaVersion: dataset.schemaVersion,
        recordCount: providers.length
    });

    metadata.savedAt = metadata.loadedAt;

    if (hasWindowStorage()) {
        const metadataForCache = JSON.stringify({ savedAt: metadata.savedAt, schemaVersion: metadata.schemaVersion });
        const datasetForCache: ProviderDataset = {
            ...dataset,
            providers
        };
        await writeToCache(datasetForCache, metadataForCache);
    }

    return composeLoadResult(providers, metadata, warnings);
}

export async function refreshUnifiedDataset(): Promise<ProviderLoadResult> {
    return fetchUnifiedDataset();
}

export async function clearDatasetCache(): Promise<void> {
    if (!hasWindowStorage()) {
        return;
    }
    try {
        await Promise.all([
            window.storage!.delete(CACHE_KEY_DATA),
            window.storage!.delete(CACHE_KEY_META)
        ]);
    } catch (error) {
        console.warn('Unable to clear cached provider data.', error);
    }
}
