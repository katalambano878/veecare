import { createClient } from '@supabase/supabase-js';
import { getPublicSupabaseCredentials, isSupabaseConfigured } from '@/lib/supabase-config';

export type BlogPostSummary = {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    image: string;
    category: string;
    date: string;
    readTime: string;
    author: string;
    featured?: boolean;
};

export type BlogPostDetail = BlogPostSummary & {
    content: string;
};

const FALLBACK_IMAGE =
    'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80';

function estimateReadTime(content: string): string {
    const words = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min read`;
}

function formatDate(value: string | null | undefined): string {
    if (!value) return '';
    return new Date(value).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function mapDbPost(row: Record<string, unknown>, authorName = 'Vee-Care Hera'): BlogPostSummary {
    const content = String(row.content ?? '');
    const tags = Array.isArray(row.tags) ? row.tags : [];
    return {
        id: String(row.id),
        slug: String(row.slug),
        title: String(row.title),
        excerpt: String(row.excerpt ?? '').trim() || content.replace(/<[^>]+>/g, ' ').slice(0, 160).trim() + '…',
        image: String(row.featured_image ?? FALLBACK_IMAGE),
        category: tags[0] ? String(tags[0]) : 'Wellness',
        date: formatDate(row.published_at as string | null) || formatDate(row.created_at as string | null),
        readTime: estimateReadTime(content),
        author: authorName,
        featured: false,
    };
}

/** Demo posts shown when the blog module is on but no published DB posts exist yet. */
export const DEMO_BLOG_POSTS: BlogPostSummary[] = [
    {
        id: 'demo-1',
        slug: 'feminine-wellness-basics',
        title: 'Feminine Wellness Basics Every Woman Should Know',
        excerpt: 'Gentle guidance on daily hygiene, comfort, and confidence — written for real life in Ghana.',
        image: FALLBACK_IMAGE,
        category: 'Wellness',
        date: 'December 15, 2024',
        readTime: '6 min read',
        author: 'Vee-Care Hera',
        featured: true,
    },
    {
        id: 'demo-2',
        slug: 'self-care-rituals-at-home',
        title: 'Calm Self-Care Rituals You Can Start at Home',
        excerpt: 'Simple routines that support rest, softness, and everyday confidence.',
        image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecbe?auto=format&fit=crop&w=800&q=80',
        category: 'Self-Care',
        date: 'December 10, 2024',
        readTime: '5 min read',
        author: 'Vee-Care Hera',
    },
    {
        id: 'demo-3',
        slug: 'choosing-the-right-products',
        title: 'How to Choose the Right Feminine Care Products',
        excerpt: 'What to look for on labels, ingredients, and what feels right for your body.',
        image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=800&q=80',
        category: 'Shopping Tips',
        date: 'December 5, 2024',
        readTime: '7 min read',
        author: 'Vee-Care Hera',
    },
];

const DEMO_BLOG_DETAILS: Record<string, BlogPostDetail> = {
    'demo-1': {
        ...DEMO_BLOG_POSTS[0],
        content: `
          <p>Feminine wellness is personal — and it should feel supportive, not overwhelming. At Vee-Care Hera, we believe in honest products, calm guidance, and care that respects your body.</p>
          <h2>Daily hygiene with intention</h2>
          <p>Choose gentle washes formulated for pH balance. Avoid harsh soaps and prioritise products designed for feminine care — not generic body wash.</p>
          <h2>Listen to your body</h2>
          <p>Comfort, freshness, and confidence look different for everyone. If something doesn't feel right, pause and ask — we're here on WhatsApp anytime.</p>
        `,
    },
    'demo-2': {
        ...DEMO_BLOG_POSTS[1],
        content: `
          <p>Self-care doesn't have to be elaborate. Small rituals — a warm shower, a quiet moment, a product that smells like calm — can shift how you feel in your day.</p>
          <h2>Build a gentle routine</h2>
          <p>Pick one or two products you love and use them consistently. Consistency beats complexity every time.</p>
        `,
    },
    'demo-3': {
        ...DEMO_BLOG_POSTS[2],
        content: `
          <p>With so many options online, choosing feminine care products can feel confusing. Start with trusted brands, clear ingredient lists, and discreet delivery you can count on.</p>
          <h2>Check the basics</h2>
          <ul>
            <li>Ingredients you recognise</li>
            <li>Reviews from real customers</li>
            <li>A store that answers questions warmly</li>
          </ul>
        `,
    },
};

export async function getPublishedBlogPosts(): Promise<BlogPostSummary[]> {
    if (!isSupabaseConfigured()) return DEMO_BLOG_POSTS;

    const { url, anonKey } = getPublicSupabaseCredentials();
    const supabase = createClient(url, anonKey);

    const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, title, excerpt, content, featured_image, published_at, created_at, tags')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

    if (error) {
        console.error('[blog-data] list failed:', error.message);
        return DEMO_BLOG_POSTS;
    }

    if (!data?.length) return DEMO_BLOG_POSTS;

    return data.map((row) => mapDbPost(row));
}

export async function getBlogPostBySlugOrId(slugOrId: string): Promise<BlogPostDetail | null> {
    if (DEMO_BLOG_DETAILS[slugOrId]) {
        return DEMO_BLOG_DETAILS[slugOrId];
    }

    const demoBySlug = DEMO_BLOG_POSTS.find((p) => p.slug === slugOrId);
    if (demoBySlug && DEMO_BLOG_DETAILS[demoBySlug.id]) {
        return DEMO_BLOG_DETAILS[demoBySlug.id];
    }

    if (!isSupabaseConfigured()) return null;

    const { url, anonKey } = getPublicSupabaseCredentials();
    const supabase = createClient(url, anonKey);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

    let query = supabase
        .from('blog_posts')
        .select('id, slug, title, excerpt, content, featured_image, published_at, created_at, tags')
        .eq('status', 'published');

    query = isUuid ? query.eq('id', slugOrId) : query.eq('slug', slugOrId);

    const { data, error } = await query.maybeSingle();

    if (error || !data) return null;

    return {
        ...mapDbPost(data),
        content: String(data.content ?? ''),
    };
}
