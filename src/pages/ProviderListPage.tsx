import React, { useMemo, useState } from 'react';
import { Download, Filter, Search } from 'lucide-react';
import { useProviderDataContext } from '../context/ProviderDataContext';
import ProviderListCard from '../components/ProviderListCard';
import { CAPABILITY_DISPLAY_LABELS } from '../utils/capabilities';
import { CapabilityKey } from '../types';

const CAPABILITY_OPTIONS: Array<{ value: CapabilityKey | 'all'; label: string }> = [
    { value: 'all', label: 'All capabilities' },
    ...Object.entries(CAPABILITY_DISPLAY_LABELS).map(([key, label]) => ({
        value: key as CapabilityKey,
        label
    }))
];

type TierFilter = 'all' | 'free' | 'paid';
type CompatibilityFilter = 'all' | 'compatible' | 'not-compatible';

const ProviderListPage: React.FC = () => {
    const { providers } = useProviderDataContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [capabilityFilter, setCapabilityFilter] = useState<CapabilityKey | 'all'>('all');
    const [tierFilter, setTierFilter] = useState<TierFilter>('all');
    const [compatibilityFilter, setCompatibilityFilter] = useState<CompatibilityFilter>('all');

    const filteredProviders = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return providers.filter((provider) => {
            const matchesSearch = !normalizedSearch
                || provider.name.toLowerCase().includes(normalizedSearch)
                || (provider.website ?? '').toLowerCase().includes(normalizedSearch)
                || (provider.notes ?? '').toLowerCase().includes(normalizedSearch);

            if (!matchesSearch) {
                return false;
            }

            if (capabilityFilter !== 'all' && !provider.capabilities.includes(capabilityFilter)) {
                return false;
            }

            if (
                tierFilter === 'free' &&
                (!provider.freeTier || !(provider.freeTier.limits || provider.freeTier.models?.length))
            ) {
                return false;
            }

            if (
                tierFilter === 'paid' &&
                (!provider.paidTier || !(provider.paidTier.limits || provider.paidTier.models?.length))
            ) {
                return false;
            }

            if (compatibilityFilter === 'compatible' && !provider.openAICompatible.isCompatible) {
                return false;
            }

            if (compatibilityFilter === 'not-compatible' && provider.openAICompatible.isCompatible) {
                return false;
            }

            return true;
        });
    }, [providers, searchTerm, capabilityFilter, tierFilter, compatibilityFilter]);

    const exportAsJson = () => {
        const blob = new Blob([JSON.stringify(filteredProviders, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `ai-providers-${new Date().toISOString().split('T')[0]}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    const exportAsCsv = () => {
        const header = [
            'Provider',
            'Website',
            'Capabilities',
            'OpenAI Compatible',
            'Supported Models',
            'Free Tier Summary',
            'Paid Tier Summary'
        ];

        const rows = filteredProviders.map((provider) => {
            const capabilityLabels = provider.capabilities.map((key) => CAPABILITY_DISPLAY_LABELS[key]).join('; ');
            const compatibility = provider.openAICompatible.isCompatible ? 'Yes' : 'No';
            const supportedModels = provider.openAICompatible.supportedModels?.join('; ') ?? '—';
            const freeSummary = provider.freeTier?.limits ?? '—';
            const paidSummary = provider.paidTier?.limits ?? '—';

            return [
                provider.name,
                provider.website ?? '—',
                capabilityLabels,
                compatibility,
                supportedModels,
                freeSummary,
                paidSummary
            ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',');
        });

        const csv = [header.map((cell) => `"${cell}"`).join(',')].concat(rows).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `ai-providers-${new Date().toISOString().split('T')[0]}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    return (
        <section className="provider-list-page">
            <div className="provider-list-page__controls">
                <div className="searchbox">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search providers, URLs, or notes"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <label>
                        <Filter size={16} /> Capability
                        <select
                            value={capabilityFilter}
                            onChange={(event) => setCapabilityFilter(event.target.value as CapabilityKey | 'all')}
                        >
                            {CAPABILITY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Tier
                        <select value={tierFilter} onChange={(event) => setTierFilter(event.target.value as TierFilter)}>
                            <option value="all">Any tier</option>
                            <option value="free">Has free tier</option>
                            <option value="paid">Has paid tier</option>
                        </select>
                    </label>

                    <label>
                        OpenAI compatibility
                        <select
                            value={compatibilityFilter}
                            onChange={(event) => setCompatibilityFilter(event.target.value as CompatibilityFilter)}
                        >
                            <option value="all">All providers</option>
                            <option value="compatible">Compatible only</option>
                            <option value="not-compatible">Not compatible</option>
                        </select>
                    </label>
                </div>

                <div className="export-group">
                    <button className="btn" onClick={exportAsJson}>
                        <Download size={16} /> JSON
                    </button>
                    <button className="btn btn--ghost" onClick={exportAsCsv}>
                        <Download size={16} /> CSV
                    </button>
                </div>
            </div>

            <p className="provider-list-page__summary">
                Showing {filteredProviders.length} of {providers.length} providers
            </p>

            {filteredProviders.length === 0 ? (
                <div className="empty-state">
                    <p>No providers match the current filters.</p>
                </div>
            ) : (
                <div className="provider-grid">
                    {filteredProviders.map((provider) => (
                        <ProviderListCard key={provider.slug} provider={provider} />
                    ))}
                </div>
            )}
        </section>
    );
};

export default ProviderListPage;
