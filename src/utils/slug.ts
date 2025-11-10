export function generateSlug(name: string): string {
    return name
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');
}

export function isSlugConsistent(name: string, slug: string): boolean {
    return generateSlug(name) === slug;
}

export function ensureUniqueSlug(baseSlug: string, used: Set<string>): string {
    let slug = baseSlug;
    let counter = 2;
    while (used.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter += 1;
    }
    used.add(slug);
    return slug;
}
