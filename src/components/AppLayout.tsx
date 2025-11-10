import React from 'react';
import { Database, RefreshCw, Trash2, Sun, Moon } from 'lucide-react';
import { useProviderDataContext } from '../context/ProviderDataContext';
import { useTheme } from '../context/ThemeContext';
import { formatTimestamp } from '../utils/time';

interface AppLayoutProps {
    children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const { metadata, warnings, loading, refresh, clearCache } = useProviderDataContext();
    const { theme, toggleTheme } = useTheme();

    const originLabel = metadata?.fromCache ? 'Cached dataset' : metadata?.label ?? 'Unified dataset';
    const sourceSummary = metadata?.sources.join(', ') ?? 'provider-data/providers.json';

    return (
        <div className="app-shell">
            <header className="app-shell__header">
                <div className="app-shell__title">
                    <Database size={32} />
                    <div>
                        <h1>AI Model Provider Catalog</h1>
                        <p>Unified research datastore with capability and pricing details</p>
                    </div>
                </div>
                <div className="app-shell__meta">
                    <div>
                        <h2>{originLabel}</h2>
                        <dl>
                            <div>
                                <dt>Sources</dt>
                                <dd>{sourceSummary}</dd>
                            </div>
                            <div>
                                <dt>Saved</dt>
                                <dd>{formatTimestamp(metadata?.savedAt)}</dd>
                            </div>
                            <div>
                                <dt>Loaded</dt>
                                <dd>{formatTimestamp(metadata?.loadedAt)}</dd>
                            </div>
                            <div>
                                <dt>Providers</dt>
                                <dd>{metadata?.recordCount ?? 0}</dd>
                            </div>
                        </dl>
                    </div>
                    <div className="app-shell__actions">
                        <button className="btn" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                        <button className="btn" onClick={refresh} disabled={loading}>
                            <RefreshCw size={16} />
                            Refresh data
                        </button>
                        <button className="btn btn--ghost" onClick={clearCache} disabled={loading}>
                            <Trash2 size={16} />
                            Clear cache
                        </button>
                    </div>
                </div>
            </header>

            {warnings.length > 0 && (
                <section className="app-shell__warnings" aria-live="polite">
                    <h2>Data warnings</h2>
                    <ul>
                        {warnings.map((warning, index) => (
                            <li key={`${warning}-${index}`}>{warning}</li>
                        ))}
                    </ul>
                </section>
            )}

            <main className="app-shell__content">{children}</main>
        </div>
    );
};

export default AppLayout;
