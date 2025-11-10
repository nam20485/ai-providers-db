export type CapabilityKey =
    | 'web_app'
    | 'api'
    | 'sdk'
    | 'cli'
    | 'desktop'
    | 'mobile'
    | 'ide'
    | 'integration'
    | 'other';

export interface TierInfo {
    limits?: string;
    models?: string[];
}

export type PricingUnit = 'per_token' | 'subscription' | 'flat';

export interface PricingDetail {
    unit: PricingUnit;
    inputCost?: string;
    outputCost?: string;
    monthlyCost?: string;
    notes?: string;
}

export type ModelAvailability = 'free' | 'paid' | 'both';

export interface ModelDetail {
    name: string;
    availability: ModelAvailability;
    pricing?: PricingDetail;
}

export interface OpenAICompatibility {
    isCompatible: boolean;
    apiKeyPortal?: string;
    endpointDocs?: string;
    supportedModels?: string[];
}

export interface ProviderResourceLink {
    label: string;
    url: string;
}

export interface ProviderRecord {
    name: string;
    slug: string;
    website?: string;
    capabilities: CapabilityKey[];
    freeTier?: TierInfo;
    paidTier?: TierInfo;
    notes?: string;
    openAICompatible: OpenAICompatibility;
    models: ModelDetail[];
    resources?: ProviderResourceLink[];
    lastUpdated?: string;
}

export interface ProviderDataset {
    schemaVersion: number;
    generatedAt?: string;
    capabilityTaxonomyVersion?: string;
    providers: ProviderRecord[];
}

export type DataOrigin = 'cache' | 'unified';

export interface DataSourceInfo {
    origin: DataOrigin;
    label: string;
    sources: string[];
    fromCache: boolean;
    savedAt?: string;
    loadedAt: string;
    recordCount: number;
    schemaVersion?: number;
}

export interface ProviderLoadResult {
    providers: ProviderRecord[];
    metadata: DataSourceInfo;
    warnings: string[];
}
