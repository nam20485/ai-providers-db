import React from 'react';
import { CapabilityKey } from '../types';
import { CAPABILITY_DISPLAY_LABELS, getCapabilityDescription } from '../utils/capabilities';

interface CapabilityBadgeProps {
    capability: CapabilityKey;
}

const CapabilityBadge: React.FC<CapabilityBadgeProps> = ({ capability }) => {
    const label = CAPABILITY_DISPLAY_LABELS[capability] ?? capability;
    const description = getCapabilityDescription(capability);
    return (
        <span className={`capability-badge capability-badge--${capability}`} title={description}>
            {label}
        </span>
    );
};

export default CapabilityBadge;
