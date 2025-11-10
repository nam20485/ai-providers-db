import React, { createContext, useContext } from 'react';
import { DataSourceInfo, ProviderRecord } from '../types';

export interface ProviderDataContextValue {
    providers: ProviderRecord[];
    metadata: DataSourceInfo | null;
    warnings: string[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    clearCache: () => Promise<void>;
    loadInitial: () => Promise<void>;
}

export const ProviderDataContext = createContext<ProviderDataContextValue | undefined>(undefined);

export function useProviderDataContext(): ProviderDataContextValue {
    const context = useContext(ProviderDataContext);
    if (!context) {
        throw new Error('useProviderDataContext must be used within a ProviderDataContext provider.');
    }
    return context;
}
