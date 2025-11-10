import React from 'react';
import { RefreshCw } from 'lucide-react';

const LoadingState: React.FC = () => (
    <div className="loading-state">
        <RefreshCw className="loading-state__spinner" size={48} />
        <p>Loading AI providers…</p>
    </div>
);

export default LoadingState;
