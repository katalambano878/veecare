import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPublicSupabaseCredentials, isSupabaseConfigured } from '@/lib/supabase-config';
import {
    PRODUCTS_CACHE_TTL,
    getProductsCache,
    setProductsCacheEntry,
} from '@/lib/storefront-cache';

function getSupabase() {
    const { url, anonKey } = getPublicSupabaseCredentials();
    return createClient(url, anonKey);
}

export async function GET(request: Request) {
    if (!isSupabaseConfigured()) {
        return NextResponse.json([]);
    }

    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const category = searchParams.get('category');

    // Build a cache key from params
    const cacheKey = `${featured}-${limit}-${category || 'all'}`;

  const cache = getProductsCache();

    // Check cache (only for featured/home requests — general shop is more dynamic)
    if (featured && cache && cache.data?.[cacheKey] && Date.now() - cache.timestamp < PRODUCTS_CACHE_TTL) {
        return NextResponse.json(cache.data[cacheKey], {
            headers: {
                'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
                'X-Cache': 'HIT'
            }
        });
    }

    try {
        let query = supabase
            .from('products')
            .select(`
                id, name, slug, price, compare_at_price, quantity, description, metadata,
                categories(id, name, slug),
                product_images(url, position),
                product_variants(id, name, price, quantity)
            `)
            .order('created_at', { ascending: false });

        // Always filter active products
        query = query.eq('status', 'active');

        if (featured) {
            query = query.eq('featured', true).limit(limit);
        } else if (category) {
            // Filter by category slug or name
            query = query.limit(limit);
        } else {
            query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[Storefront API] Products error:', error);
            return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
        }

        setProductsCacheEntry(cacheKey, data);

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
                'X-Cache': 'MISS'
            }
        });
    } catch (err: any) {
        console.error('[Storefront API] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
