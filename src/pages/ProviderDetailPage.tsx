import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ExternalLink, ArrowLeft } from 'lucide-react';
import { useProviderDataContext } from '../context/ProviderDataContext';
import CapabilityBadge from '../components/CapabilityBadge';
import TierSummary from '../components/TierSummary';
import ModelsTable from '../components/ModelsTable';
import OpenAICompatibilityCard from '../components/OpenAICompatibilityCard';

const ProviderDetailPage: React.FC = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { providers } = useProviderDataContext();

    const provider = providers.find((entry) => entry.slug === slug);

    if (!provider) {
        return (
            <section className="provider-detail-page">
                <div className="provider-detail-page__not-found">
                    <p>We couldn&apos;t find that provider.</p>
                    <button className="btn" onClick={() => navigate('/')}>Return to catalog</button>
                </div>
            </section>
        );
    }

    return (
        <section className="provider-detail-page">
            <div className="provider-detail-page__back">
                <Link to="/">
                    <ArrowLeft size={16} /> Back to providers
                </Link>
            </div>

            <header className="provider-detail-page__hero">
                <div>
                    <h1>{provider.name}</h1>
                    {provider.website && (
                        <a href={provider.website} target="_blank" rel="noopener noreferrer" className="hero-link">
                            Visit website <ExternalLink size={16} />
                        </a>
                    )}
                    {provider.notes && <p className="provider-detail-page__notes">{provider.notes}</p>}
                </div>
                <div className="provider-detail-page__badges">
                    {provider.capabilities.map((capability) => (
                        <CapabilityBadge key={`${provider.slug}-${capability}`} capability={capability} />
                    ))}
                </div>
            </header>

            <div className="provider-detail-page__grid">
                <OpenAICompatibilityCard compatibility={provider.openAICompatible} />
                <div className="provider-detail-page__tiers">
                    <TierSummary label="Free tier" tier={provider.freeTier} />
                    <TierSummary label="Paid tier" tier={provider.paidTier} />
                </div>
            </div>

            <section className="provider-detail-page__models">
                <h2>Models & pricing</h2>
                {provider.models && provider.models.length > 0 ? (
                    <ModelsTable models={provider.models} />
                ) : (
                    <p className="provider-detail-page__models-empty">
                        Model catalog coming soon. Check the provider documentation for the latest pricing.
                    </p>
                )}
            </section>

            {provider.resources && provider.resources.length > 0 && (
                <section className="provider-detail-page__resources">
                    <h2>Resources</h2>
                    <ul>
                        {provider.resources.map((resource) => (
                            <li key={resource.url}>
                                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                    {resource.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </section>
    );
};

export default ProviderDetailPage;
