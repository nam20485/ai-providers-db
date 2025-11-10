export function formatTimestamp(iso?: string | null): string {
    if (!iso) {
        return '—';
    }

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}
