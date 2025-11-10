import React from 'react';
import { CheckCircle2, Link2, ShieldAlert, XCircle } from 'lucide-react';
import { OpenAICompatibility } from '../types';

interface OpenAICompatibilityCardProps {
    compatibility: OpenAICompatibility;
}

const OpenAICompatibilityCard: React.FC<OpenAICompatibilityCardProps> = ({ compatibility }) => {
    if (!compatibility.isCompatible) {
        return (
            <section className="compatibility-card compatibility-card--negative">
                <header>
                    <XCircle size={24} />
                    <h3>OpenAI compatibility</h3>
                </header>
                <p>This provider does not expose an OpenAI-compatible API interface.</p>
            </section>
        );
    }

    return (
        <section className="compatibility-card compatibility-card--positive">
            <header>
                <CheckCircle2 size={24} />
                <h3>OpenAI compatibility</h3>
            </header>
            <ul>
                {compatibility.apiKeyPortal && (
                    <li>
                        <Link2 size={16} />
                        <a href={compatibility.apiKeyPortal} target="_blank" rel="noopener noreferrer">
                            API key portal
                        </a>
                    </li>
                )}
                {compatibility.endpointDocs && (
                    <li>
                        <Link2 size={16} />
                        <a href={compatibility.endpointDocs} target="_blank" rel="noopener noreferrer">
                            Endpoint documentation
                        </a>
                    </li>
                )}
            </ul>
            {compatibility.supportedModels && compatibility.supportedModels.length > 0 ? (
                <div className="compatibility-card__models">
                    <h4>Supported models</h4>
                    <ul>
                        {compatibility.supportedModels.map((model) => (
                            <li key={model}>
                                <ShieldAlert size={14} /> {model}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p className="compatibility-card__warning">No supported models listed.</p>
            )}
        </section>
    );
};

export default OpenAICompatibilityCard;
