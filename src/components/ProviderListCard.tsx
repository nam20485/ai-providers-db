import React from 'react';
import { Link } from 'react-router-dom';
import { ProviderRecord } from '../types';
import CapabilityBadge from './CapabilityBadge';
import TierSummary from './TierSummary';

interface ProviderListCardProps {
    provider: ProviderRecord;
}

const ProviderListCard: React.FC<ProviderListCardProps> = ({ provider }) => (
    <article className="provider-card">
        <header className="provider-card__header">
            <div>
                <h2>{provider.name}</h2>
                {provider.website && (
                    <a href={provider.website} target="_blank" rel="noopener noreferrer" className="provider-card__link">
                        {provider.website}
                    </a>
                )}
            </div>
            <div className="provider-card__badges">
                {provider.capabilities.map((capability) => (
                    <CapabilityBadge key={`${provider.slug}-${capability}`} capability={capability} />
                ))}
            </div>
        </header>

        <div className="provider-card__tiers">
            <TierSummary label="Free tier" tier={provider.freeTier} />
            <TierSummary label="Paid tier" tier={provider.paidTier} />
        </div>

        {provider.notes && <p className="provider-card__notes">{provider.notes}</p>}

        <footer className="provider-card__footer">
            <Link to={`/provider/${provider.slug}`} className="btn btn--primary">
                View details
            </Link>
        </footer>
    </article>
);

export default ProviderListCard;
