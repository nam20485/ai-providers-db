import { CapabilityKey } from '../types';

export const CAPABILITY_DISPLAY_LABELS: Record<CapabilityKey, string> = {
    web_app: 'Web App',
    api: 'API',
    sdk: 'SDK',
    cli: 'CLI',
    desktop: 'Desktop App',
    mobile: 'Mobile App',
    ide: 'IDE Extension',
    integration: 'Integration',
    other: 'Other'
};

export const CAPABILITY_DESCRIPTIONS: Partial<Record<CapabilityKey, string>> = {
    web_app: 'Browser-based experience or console',
    api: 'HTTP API surface exposed for developers',
    sdk: 'First-party SDKs or client libraries',
    cli: 'Command-line or terminal tooling',
    desktop: 'Native desktop or electron application',
    mobile: 'Native iOS/Android clients',
    ide: 'Integrated development environment extensions',
    integration: 'Automation, connectors, or embedded surfaces',
    other: 'Capabilities that require manual review'
};

const CAPABILITY_ORDER: CapabilityKey[] = [
    'web_app',
    'api',
    'sdk',
    'cli',
    'desktop',
    'mobile',
    'ide',
    'integration',
    'other'
];

const ALIAS_MAP = new Map<string, CapabilityKey>([
    ['web', 'web_app'],
    ['web app', 'web_app'],
    ['web-app', 'web_app'],
    ['web application', 'web_app'],
    ['browser', 'web_app'],
    ['online', 'web_app'],
    ['console', 'web_app'],
    ['dashboard', 'web_app'],
    ['api', 'api'],
    ['rest', 'api'],
    ['http', 'api'],
    ['graphql', 'api'],
    ['sdk', 'sdk'],
    ['client', 'sdk'],
    ['library', 'sdk'],
    ['client library', 'sdk'],
    ['cli', 'cli'],
    ['command line', 'cli'],
    ['terminal', 'cli'],
    ['shell', 'cli'],
    ['desktop', 'desktop'],
    ['desktop app', 'desktop'],
    ['native', 'desktop'],
    ['native app', 'desktop'],
    ['electron', 'desktop'],
    ['mobile', 'mobile'],
    ['mobile app', 'mobile'],
    ['ios', 'mobile'],
    ['android', 'mobile'],
    ['ide', 'ide'],
    ['ide extension', 'ide'],
    ['editor', 'ide'],
    ['plugin', 'ide'],
    ['extension', 'ide'],
    ['integration', 'integration'],
    ['zapier', 'integration'],
    ['make.com', 'integration'],
    ['automation', 'integration'],
    ['connector', 'integration'],
    ['self-hosted', 'other'],
    ['self hosted', 'other'],
    ['on-premise', 'other'],
    ['on premise', 'other'],
    ['marketplace', 'other'],
    ['spaces', 'integration']
]);

const SANITIZE_MATCHERS: Array<(value: string) => CapabilityKey | null> = [
    (value) => {
        const withoutParen = value.replace(/\([^)]*\)/g, '').trim();
        if (withoutParen !== value) {
            return mapAlias(withoutParen);
        }
        return null;
    },
    (value) => {
        if (value.includes('&')) {
            return mapAlias(value.split('&')[0].trim());
        }
        return null;
    },
    (value) => {
        if (value.includes('/')) {
            return mapAlias(value.split('/')[0].trim());
        }
        return null;
    }
];

function mapAlias(raw: string): CapabilityKey | null {
    const normalized = raw.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!normalized) {
        return null;
    }
    const directMatch = ALIAS_MAP.get(normalized);
    if (directMatch) {
        return directMatch;
    }
    return null;
}

export function normalizeCapabilities(values: string[] | undefined | null): {
    normalized: CapabilityKey[];
    unknown: string[];
} {
    if (!values || values.length === 0) {
        return { normalized: [], unknown: [] };
    }

    const normalized = new Set<CapabilityKey>();
    const unknown: string[] = [];

    values.forEach((value) => {
        if (!value) {
            return;
        }

        const direct = mapAlias(value);
        if (direct) {
            normalized.add(direct);
            return;
        }

        for (const matcher of SANITIZE_MATCHERS) {
            const attempt = matcher(value);
            if (attempt) {
                normalized.add(attempt);
                return;
            }
        }

        unknown.push(value);
    });

    return { normalized: sortCapabilities(Array.from(normalized)), unknown };
}

export function sortCapabilities(keys: CapabilityKey[]): CapabilityKey[] {
    return [...keys].sort((a, b) => CAPABILITY_ORDER.indexOf(a) - CAPABILITY_ORDER.indexOf(b));
}

export function getCapabilityLabel(key: CapabilityKey): string {
    return CAPABILITY_DISPLAY_LABELS[key] ?? key;
}

export function getCapabilityDescription(key: CapabilityKey): string | undefined {
    return CAPABILITY_DESCRIPTIONS[key];
}

export function isValidCapability(key: CapabilityKey): boolean {
    return CAPABILITY_ORDER.includes(key);
}
