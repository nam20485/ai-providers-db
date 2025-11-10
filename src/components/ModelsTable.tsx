import React from 'react';
import { ModelDetail } from '../types';

const AVAILABILITY_LABELS: Record<ModelDetail['availability'], string> = {
    free: 'Free',
    paid: 'Paid',
    both: 'Free & paid'
};

interface ModelsTableProps {
    models: ModelDetail[];
}

const ModelsTable: React.FC<ModelsTableProps> = ({ models }) => (
    <div className="models-table">
        <table>
            <thead>
                <tr>
                    <th>Model</th>
                    <th>Availability</th>
                    <th>Pricing</th>
                </tr>
            </thead>
            <tbody>
                {models.map((model) => {
                    const pricing = model.pricing;
                    const pricingLines: string[] = [];

                    if (!pricing) {
                        pricingLines.push('See provider documentation');
                    } else {
                        if (pricing.inputCost) pricingLines.push(`Input: ${pricing.inputCost}`);
                        if (pricing.outputCost) pricingLines.push(`Output: ${pricing.outputCost}`);
                        if (pricing.monthlyCost) pricingLines.push(`Monthly: ${pricing.monthlyCost}`);
                        if (pricing.notes) pricingLines.push(pricing.notes);
                        if (pricingLines.length === 0) {
                            pricingLines.push('See provider documentation');
                        }
                    }

                    return (
                        <tr key={model.name}>
                            <td>{model.name}</td>
                            <td>{AVAILABILITY_LABELS[model.availability]}</td>
                            <td>
                                <ul>
                                    {pricingLines.map((line, index) => (
                                        <li key={`${model.name}-${index}`}>{line}</li>
                                    ))}
                                </ul>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
);

export default ModelsTable;
