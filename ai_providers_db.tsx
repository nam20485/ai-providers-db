import React, { useState, useEffect } from 'react';
import { Download, Search, RefreshCw, Database, Save } from 'lucide-react';

// Define types for our provider data
interface ProviderData {
  website?: string;
  client_types?: string[];
  free_tier?: {
    limits?: string;
    models?: string[];
  };
  paid_tier?: {
    limits?: string;
    models?: string[];
  };
  notes?: string;
}

interface Providers {
  [key: string]: ProviderData;
}

interface DataSourceInfo {
  origin: 'cache' | 'initial' | 'batch2' | 'merged';
  label: string;
  sources: string[];
  fromCache: boolean;
  savedAt?: string;
  loadedAt: string;
}

const ORIGIN_LABELS: Record<DataSourceInfo['origin'], string> = {
  cache: 'Cache',
  initial: 'Initial dataset',
  batch2: 'Batch dataset',
  merged: 'Merged datasets',
};

const formatTimestamp = (iso?: string) => {
  if (!iso) {
    return '—';
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString();
};

// Extend the Window interface to include our storage
declare global {
  interface Window {
    storage?: {
      get(key: string): Promise<any>;
      set(key: string, value: string): Promise<void>;
      delete(key: string): Promise<void>;
    };
  }
}

export default function AIProvidersDB() {
  const [providers, setProviders] = useState<Providers>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dataSourceInfo, setDataSourceInfo] = useState<DataSourceInfo | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const attemptLoadFromCache = async (): Promise<boolean> => {
    if (!window.storage) {
      return false;
    }

    try {
      const result = await window.storage.get('ai_providers_data');
      if (!result || !result.value) {
        return false;
      }

      const cachedData = JSON.parse(result.value) as Providers;

      let storedInfo: DataSourceInfo | null = null;
      try {
        const metadataResult = await window.storage.get('ai_providers_metadata');
        if (metadataResult && metadataResult.value) {
          storedInfo = JSON.parse(metadataResult.value) as DataSourceInfo;
        }
      } catch (metadataError) {
        console.warn('Unable to parse cached metadata.', metadataError);
      }

      const loadedAt = new Date().toISOString();
      const info: DataSourceInfo = storedInfo
        ? { ...storedInfo, fromCache: true, loadedAt }
        : {
          origin: 'cache',
          label: 'Cached dataset',
          sources: ['cache'],
          fromCache: true,
          savedAt: undefined,
          loadedAt,
        };

      setProviders(cachedData);
      setDataSourceInfo(info);
      return true;
    } catch (error) {
      console.error('Error loading cached data:', error);
      return false;
    }
  };

  const fetchInitialData = async (): Promise<Providers> => {
    const response = await fetch('provider-data/initialData.json');
    if (!response.ok) {
      throw new Error(`Failed to load initialData.json (${response.status})`);
    }
    return response.json();
  };

  const parseBatch2Text = (batch2Text: string): Providers => {
    const cleanedText = batch2Text.replace(/const batch2\s*=\s*/, '').trim();
    const objectStr = cleanedText.replace(/;$/, '').trim();
    return new Function('return ' + objectStr)();
  };

  const fetchBatch2Data = async (): Promise<Providers> => {
    const response = await fetch('provider-data/batch2.json');
    if (!response.ok) {
      throw new Error(`Failed to load batch2.json (${response.status})`);
    }

    const text = await response.text();
    try {
      return parseBatch2Text(text);
    } catch (error) {
      console.error('Error parsing batch2.json:', error);
      throw new Error('Error parsing batch2.json');
    }
  };

  const persistData = async (newData: Providers, info: Omit<DataSourceInfo, 'loadedAt'>) => {
    const timestamp = new Date().toISOString();
    const enriched: DataSourceInfo = {
      ...info,
      fromCache: false,
      savedAt: info.savedAt ?? timestamp,
      loadedAt: timestamp,
    };

    try {
      if (window.storage) {
        await window.storage.set('ai_providers_data', JSON.stringify(newData));
        await window.storage.set('ai_providers_metadata', JSON.stringify(enriched));
      }
    } catch (error) {
      console.error('Error saving data:', error);
    }

    setProviders(newData);
    setDataSourceInfo(enriched);
  };

  const loadInitialOnly = async () => {
    const initialData = await fetchInitialData();
    await persistData(initialData, {
      origin: 'initial',
      label: 'Initial dataset',
      sources: ['provider-data/initialData.json'],
      fromCache: false,
    });
  };

  const loadBatch2Only = async () => {
    const batch2Data = await fetchBatch2Data();
    await persistData(batch2Data, {
      origin: 'batch2',
      label: 'Batch dataset',
      sources: ['provider-data/batch2.json'],
      fromCache: false,
    });
  };

  const loadMergedData = async (): Promise<boolean> => {
    const initialData = await fetchInitialData();

    try {
      const batch2Data = await fetchBatch2Data();
      const mergedData: Providers = { ...initialData, ...batch2Data };
      await persistData(mergedData, {
        origin: 'merged',
        label: 'Merged datasets',
        sources: ['provider-data/initialData.json', 'provider-data/batch2.json'],
        fromCache: false,
      });
      return true;
    } catch (error) {
      console.error('Error loading batch2 data; falling back to initial dataset.', error);
      await persistData(initialData, {
        origin: 'initial',
        label: 'Initial dataset',
        sources: ['provider-data/initialData.json'],
        fromCache: false,
      });
      return false;
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const cacheLoaded = await attemptLoadFromCache();
      if (!cacheLoaded) {
        await loadMergedData();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFromCache = async () => {
    setLoading(true);
    try {
      const cacheLoaded = await attemptLoadFromCache();
      if (!cacheLoaded) {
        alert('No cached dataset was found. Load from sources first to populate the cache.');
      }
    } catch (error) {
      console.error('Error loading cached dataset:', error);
      alert('Unable to load cached dataset. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadInitial = async () => {
    setLoading(true);
    try {
      await loadInitialOnly();
    } catch (error) {
      console.error('Error loading initial dataset:', error);
      alert('Failed to load initialData.json. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadBatch2 = async () => {
    setLoading(true);
    try {
      await loadBatch2Only();
    } catch (error) {
      console.error('Error loading batch2 dataset:', error);
      alert('Failed to load batch2.json. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadAllSources = async () => {
    setLoading(true);
    try {
      const success = await loadMergedData();
      if (!success) {
        alert('Loaded initial dataset only. Batch2 data could not be parsed. See console for details.');
      }
    } catch (error) {
      console.error('Error loading all sources:', error);
      alert('Failed to load sources. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSnapshot = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      metadata: dataSourceInfo,
      providers,
    };

    const defaultName = `ai_providers_snapshot_${new Date().toISOString().replace(/[.:]/g, '-').replace('T', '_').split('Z')[0]}.json`;
    const inputName = prompt('Save snapshot as (filename):', defaultName);
    if (!inputName) {
      return;
    }

    const trimmed = inputName.trim();
    if (!trimmed) {
      return;
    }

    const fileName = trimmed.endsWith('.json') ? trimmed : `${trimmed}.json`;

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const dataStr = JSON.stringify(providers, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_providers_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const exportCSV = () => {
    let csv = 'Provider,Website,Client Types,Free Tier Limits,Free Tier Models,Paid Tier Limits,Paid Tier Models\n';

    Object.entries(providers).forEach(([name, data]: [string, ProviderData]) => {
      const row = [
        name,
        data.website || '',
        (data.client_types || []).join('; '),
        data.free_tier?.limits || '',
        (data.free_tier?.models || []).join('; '),
        data.paid_tier?.limits || '',
        (data.paid_tier?.models || []).join('; ')
      ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
      csv += row + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_providers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const copyToClipboard = () => {
    const payload = {
      metadata: dataSourceInfo,
      providers,
    };

    const text = JSON.stringify(payload, null, 2);
    navigator.clipboard.writeText(text)
      .then(() => alert('Copied dataset and metadata to clipboard!'))
      .catch(() => alert('Unable to copy to clipboard.'));
  };

  const clearData = async () => {
    if (confirm('Clear all data? This cannot be undone.')) {
      if (window.storage) {
        await window.storage.delete('ai_providers_data');
        await window.storage.delete('ai_providers_metadata');
      }
      setProviders({});
      setDataSourceInfo(null);
    }
  };

  const providerEntries = Object.entries(providers);
  const filteredProviders = providerEntries.filter(([name, data]: [string, ProviderData]) => {
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (data.website || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === 'all') return matchesSearch;
    if (filterType === 'free') return matchesSearch && data.free_tier;
    if (filterType === 'paid') return matchesSearch && data.paid_tier;
    if (filterType === 'cli') return matchesSearch && (data.client_types || []).includes('CLI');
    if (filterType === 'web') return matchesSearch && (data.client_types || []).includes('Web');

    return matchesSearch;
  });

  const totalProviders = providerEntries.length;
  const originDescriptor = dataSourceInfo ? ORIGIN_LABELS[dataSourceInfo.origin] : 'No dataset loaded';
  const sourcesSummary = dataSourceInfo && dataSourceInfo.sources.length > 0
    ? dataSourceInfo.sources.join(', ')
    : '—';

  if (loading) {
    return (
      <div className="app-wrapper">
        <div className="loading-state">
          <RefreshCw className="spinner" size={40} />
        </div>
      </div>
    );
  }



  return (

    <div className="app-wrapper">

      <header className="app-header">
        <div className="title-row">
          <div className="title-icon">
            <Database size={32} />
          </div>
          <div>
            <h1 className="app-title">AI Model Providers Research</h1>
            <p className="app-subtitle">Comprehensive database of AI model providers, clients, and access tiers</p>
          </div>
        </div>
      </header>


      <section className="controls-card">
        <div className="controls-grid">
          <div className="search-field">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search providers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Providers</option>
            <option value="free">Has Free Tier</option>
            <option value="paid">Has Paid Tier</option>
            <option value="cli">CLI Available</option>
            <option value="web">Web Available</option>
          </select>

          <div className="button-row">
            <button onClick={exportJSON} className="action-button json">
              <Download size={16} />
              JSON
            </button>
            <button onClick={exportCSV} className="action-button csv">
              <Download size={16} />
              CSV
            </button>
            <button onClick={copyToClipboard} className="action-button copy">
              Copy
            </button>
            <button onClick={handleSaveSnapshot} className="action-button save">
              <Save size={16} />
              Save Snapshot
            </button>
            <button onClick={clearData} className="action-button clear">
              Clear
            </button>
          </div>
        </div>
      </section>


      <section className="stats-card">
        <div>
          <p className="stats-title">Database Stats</p>
          <p className="stats-meta">
            {totalProviders} providers indexed | {filteredProviders.length} matching filters
          </p>
        </div>
      </section>


      <section className="source-card">
        <div className="source-info">
          <span className="source-label">Current dataset</span>
          <h3 className="source-value">{originDescriptor}</h3>

          <div className="source-meta">
            {dataSourceInfo ? (
              <>
                <span className={`source-chip ${dataSourceInfo.fromCache ? 'cache' : 'fresh'}`}>
                  {dataSourceInfo.fromCache ? 'Cache hit' : 'Fresh load'}
                </span>
                <span className="source-chip neutral">
                  {dataSourceInfo.sources.length} source{dataSourceInfo.sources.length === 1 ? '' : 's'}
                </span>
              </>
            ) : (
              <span className="source-chip neutral">No dataset loaded</span>
            )}
          </div>

          <dl className="source-details">
            <div>
              <dt>Sources</dt>
              <dd>{sourcesSummary}</dd>
            </div>
            <div>
              <dt>Saved</dt>
              <dd>{formatTimestamp(dataSourceInfo?.savedAt)}</dd>
            </div>
            <div>
              <dt>Loaded</dt>
              <dd>{formatTimestamp(dataSourceInfo?.loadedAt)}</dd>
            </div>
          </dl>
        </div>

        <div className="source-actions">
          <div className="button-group">
            <button className="ghost-button" onClick={handleLoadFromCache}>
              Load Cache
            </button>
            <button className="ghost-button" onClick={handleLoadInitial}>
              Load Initial
            </button>
            <button className="ghost-button" onClick={handleLoadBatch2}>
              Load Batch 2
            </button>
            <button className="ghost-button primary" onClick={handleLoadAllSources}>
              Load All Sources
            </button>
          </div>
        </div>
      </section>


      {totalProviders === 0 ? (
        <div className="empty-state">
          <Database size={52} className="empty-state-icon" />
          <h3 className="empty-state-title">No Data Yet</h3>
          <p className="empty-state-subtitle">Research data will appear here as it&rsquo;s collected.</p>
        </div>
      ) : (
        <div className="provider-list">
          {filteredProviders.map(([name, data]: [string, ProviderData]) => (
            <article key={name} className="provider-card">
              <div className="provider-body">
                <header className="provider-header">
                  <div>
                    <h2 className="provider-name">{name}</h2>
                    {data.website && (
                      <a
                        href={data.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="provider-link"
                      >
                        {data.website}
                      </a>
                    )}
                  </div>
                  {data.client_types && (
                    <div className="client-pill-group">
                      {data.client_types.map((type: string) => (
                        <span key={type} className="client-pill">
                          {type}
                        </span>
                      ))}
                    </div>
                  )}
                </header>

                <div className="tier-grid">
                  {data.free_tier && (
                    <div className="tier-card free-tier">
                      <h3 className="tier-title free">Free Tier</h3>
                      {data.free_tier.limits && (
                        <p className="tier-text">
                          <span>Limits:</span> {data.free_tier.limits}
                        </p>
                      )}
                      {data.free_tier.models && data.free_tier.models.length > 0 && (
                        <div>
                          <p className="tier-text">
                            <span>Models:</span>
                          </p>
                          <ul className="tier-list">
                            {data.free_tier.models.map((model: string, idx: number) => (
                              <li key={idx}>{model}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {data.paid_tier && (
                    <div className="tier-card paid-tier">
                      <h3 className="tier-title paid">Paid Tier</h3>
                      {data.paid_tier.limits && (
                        <p className="tier-text">
                          <span>Limits:</span> {data.paid_tier.limits}
                        </p>
                      )}
                      {data.paid_tier.models && data.paid_tier.models.length > 0 && (
                        <div>
                          <p className="tier-text">
                            <span>Models:</span>
                          </p>
                          <ul className="tier-list">
                            {data.paid_tier.models.map((model: string, idx: number) => (
                              <li key={idx}>{model}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {data.notes && (
                  <div className="notes-box">
                    <span>Notes:</span> {data.notes}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

    </div>

  );

}



import { createRoot } from 'react-dom/client';



const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<AIProvidersDB />);
}

