import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProviderDataContext } from './context/ProviderDataContext';
import { DataSourceInfo, ProviderRecord } from './types';
import { attemptLoadFromCache, clearDatasetCache, fetchUnifiedDataset, refreshUnifiedDataset } from './services/providerData';
import ProviderListPage from './pages/ProviderListPage';
import ProviderDetailPage from './pages/ProviderDetailPage';
import AppLayout from './components/AppLayout';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';

function App() {
    const [providers, setProviders] = useState<ProviderRecord[]>([]);
    const [metadata, setMetadata] = useState<DataSourceInfo | null>(null);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasAttemptedInitialLoad, setHasAttemptedInitialLoad] = useState(false);

    const hydrate = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const cached = await attemptLoadFromCache();
            if (cached) {
                setProviders(cached.providers);
                setMetadata({ ...cached.metadata, fromCache: true });
                setWarnings(cached.warnings);
            }

            const latest = await fetchUnifiedDataset();
            setProviders(latest.providers);
            setMetadata({ ...latest.metadata, fromCache: false });
            setWarnings(latest.warnings);
        } catch (err) {
            if (!providers.length) {
                setError(err instanceof Error ? err.message : 'Failed to load providers.');
            } else {
                setWarnings((prev) => [
                    ...(err instanceof Error ? [err.message] : ['Unknown error refreshing providers.']),
                    ...prev
                ]);
            }
        } finally {
            setLoading(false);
        }
    }, [providers.length]);

    const loadInitial = useCallback(async () => {
        setHasAttemptedInitialLoad(true);
        await hydrate();
    }, [hydrate]);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await refreshUnifiedDataset();
            setProviders(result.providers);
            setMetadata({ ...result.metadata, fromCache: false });
            setWarnings(result.warnings);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to refresh providers.');
        } finally {
            setLoading(false);
        }
    }, []);

    const clearCacheAndNotify = useCallback(async () => {
        await clearDatasetCache();
        setWarnings((prev) => ['Cleared cached dataset from local storage.', ...prev]);
        setMetadata((prev) => (prev ? { ...prev, fromCache: false } : prev));
    }, []);

    const contextValue = useMemo(
        () => ({
            providers,
            metadata,
            warnings,
            loading,
            error,
            refresh,
            clearCache: clearCacheAndNotify,
            loadInitial
        }),
        [providers, metadata, warnings, loading, error, refresh, clearCacheAndNotify, loadInitial]
    );

    if (!hasAttemptedInitialLoad && !providers.length) {
        return (
            <div className="initial-load-prompt">
                <div className="initial-load-prompt__content">
                    <h1>AI Model Provider Catalog</h1>
                    <p>Unified research datastore with capability and pricing details</p>
                    <button className="btn btn--primary" onClick={loadInitial} disabled={loading}>
                        {loading ? 'Loading...' : 'Load Dataset'}
                    </button>
                </div>
            </div>
        );
    }

    if (loading && !providers.length) {
        return <LoadingState />;
    }

    if (error && !providers.length) {
        return <ErrorState message={error} onRetry={loadInitial} />;
    }

    return (
        <ProviderDataContext.Provider value={contextValue}>
            <AppLayout>
                <Routes>
                    <Route path="/" element={<ProviderListPage />} />
                    <Route path="/provider/:slug" element={<ProviderDetailPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AppLayout>
        </ProviderDataContext.Provider>
    );
}

export default App;
