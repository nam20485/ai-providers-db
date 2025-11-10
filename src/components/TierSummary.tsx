import React from 'react';
import { TierInfo } from '../types';

interface TierSummaryProps {
    label: string;
    tier?: TierInfo;
}

const TierSummary: React.FC<TierSummaryProps> = ({ label, tier }) => (
    <div className="tier-summary">
        <h3>{label}</h3>
        {tier ? (
            <div className="tier-summary__content">
                {tier.limits && <p className="tier-summary__limits">{tier.limits}</p>}
                {tier.models && tier.models.length > 0 && (
                    <ul>
                        {tier.models.map((model, index) => (
                            <li key={`${model}-${index}`}>{model}</li>
                        ))}
                    </ul>
                )}
            </div>
        ) : (
            <p className="tier-summary__empty">Not published</p>
        )}
    </div>
);

export default TierSummary;
