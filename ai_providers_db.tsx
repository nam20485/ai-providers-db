import React, { useState, useEffect } from 'react';
import { Download, Search, RefreshCw, Database } from 'lucide-react';

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Check if window.storage is available
      if (window.storage) {
        const result = await window.storage.get('ai_providers_data');
        if (result && result.value) {
          setProviders(JSON.parse(result.value));
          setLoading(false);
          return;
        }
      }

      // Load initial data
      const initialResponse = await fetch('provider-data/initialData.json');
      const initialData = await initialResponse.json();

      // Load batch2 data - need to fetch and process the JavaScript file
      const batch2Response = await fetch('provider-data/batch2.json');
      const batch2Text = await batch2Response.text();

      // Process the JavaScript file to extract the object
      // Remove the 'const batch2 =' part and handle the object
      const cleanedText = batch2Text.replace(/const batch2\s*=\s*/, '').trim();
      const objectStr = cleanedText.replace(/;$/, '').trim(); // Remove trailing semicolon if present

      // Parse the object using JSON.parse after converting JavaScript object syntax to JSON
      let batch2Data: Providers = {};
      try {
        // This approach handles the JavaScript object format by using a Function constructor
        // which is safer than eval()
        batch2Data = new Function('return ' + objectStr)();
      } catch (e) {
        console.error('Error parsing batch2.json:', e);
        // If parsing fails, try to load just the initial data
        await saveData(initialData);
        return;
      }

      // Merge both datasets, with batch2 potentially overriding initial data
      const mergedData: Providers = { ...initialData, ...batch2Data };
      await saveData(mergedData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const saveData = async (newData: Providers) => {
    try {
      if (window.storage) {
        await window.storage.set('ai_providers_data', JSON.stringify(newData));
      }
      setProviders(newData);
    } catch (error) {
      console.error('Error saving data:', error);
    }
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
    const text = JSON.stringify(providers, null, 2);
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const clearData = async () => {
    if (confirm('Clear all data? This cannot be undone.')) {
      if (window.storage) {
        await window.storage.delete('ai_providers_data');
      }
      setProviders({});
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

