/** URL-safe slug helpers for products, categories, and blog posts. */

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function sanitizeSlugInput(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+/, '');
}

export type SlugValidation = {
    valid: boolean;
    message?: string;
};

export function validateSlug(slug: string): SlugValidation {
    const trimmed = slug.trim();
    if (!trimmed) {
        return { valid: false, message: 'URL slug is required' };
    }
    if (trimmed.length < 3) {
        return { valid: false, message: 'Slug must be at least 3 characters' };
    }
    if (trimmed.length > 80) {
        return { valid: false, message: 'Slug must be 80 characters or fewer' };
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed)) {
        return {
            valid: false,
            message: 'Use only lowercase letters, numbers, and single hyphens between words',
        };
    }
    return { valid: true };
}

export function getSlugLengthStatus(length: number, min: number, max: number): 'good' | 'warn' | 'bad' {
    if (length === 0) return 'bad';
    if (length <= max) return length >= min ? 'good' : 'warn';
    return 'bad';
}
