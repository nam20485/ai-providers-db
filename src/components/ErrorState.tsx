import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface ErrorStateProps {
    message: string;
    onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
    <div className="error-state">
        <AlertCircle size={48} />
        <h2>We hit a snag</h2>
        <p>{message}</p>
        <button className="btn" onClick={onRetry}>
            <RefreshCcw size={16} />
            Try again
        </button>
    </div>
);

export default ErrorState;
