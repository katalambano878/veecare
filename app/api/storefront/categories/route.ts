import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPublicSupabaseCredentials, isSupabaseConfigured } from '@/lib/supabase-config';
import {
  CATEGORIES_CACHE_TTL,
  getCategoriesCache,
  setCategoriesCache,
} from '@/lib/storefront-cache';

function getSupabase() {
  const { url, anonKey } = getPublicSupabaseCredentials();
  return createClient(url, anonKey);
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json([]);
  }

  const supabase = getSupabase();
  const cached = getCategoriesCache();

  if (cached && Date.now() - cached.timestamp < CATEGORIES_CACHE_TTL) {
    return NextResponse.json(cached.data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Cache': 'HIT',
      },
    });
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, image_url, parent_id, metadata, description, position')
      .eq('status', 'active')
      .order('position', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('[Storefront API] Categories error:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    setCategoriesCache(data);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Cache': 'MISS',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Storefront API] Error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
