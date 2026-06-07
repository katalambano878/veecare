import { createClient } from '@supabase/supabase-js';
import { getPublicSupabaseCredentials, isSupabaseConfigured } from '@/lib/supabase-config';

export type HomeCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
};

export type HomeProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compare_at_price?: number | null;
  quantity?: number;
  moq?: number;
  featured?: boolean;
  rating_avg?: number;
  review_count?: number;
  product_variants?: { price?: number; quantity?: number; option2?: string }[];
  product_images?: { url?: string; position?: number }[];
};

export type HomePageData = {
  featuredProducts: HomeProduct[];
  categories: HomeCategory[];
};

export async function getHomePageData(): Promise<HomePageData> {
  if (!isSupabaseConfigured()) {
    return { featuredProducts: [], categories: [] };
  }

  const { url, anonKey } = getPublicSupabaseCredentials();
  const supabase = createClient(url, anonKey);

  const [productsResult, categoriesResult] = await Promise.all([
    supabase
      .from('products')
      .select('*, product_variants(*), product_images(*)')
      .eq('status', 'active')
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('categories')
      .select('id, name, slug, description, image_url, metadata')
      .eq('status', 'active')
      .is('parent_id', null)
      .order('position', { ascending: true })
      .limit(12),
  ]);

  if (productsResult.error) {
    console.error('[getHomePageData] featured products:', productsResult.error.message);
  }
  if (categoriesResult.error) {
    console.error('[getHomePageData] categories:', categoriesResult.error.message);
  }

  const featuredProducts = (productsResult.data ?? []).filter(
    (product) => (product.product_images?.length ?? 0) > 0
  );

  const homepageCategories = (categoriesResult.data ?? []).filter(
    (category) => category.metadata?.featured === true
  );

  return {
    featuredProducts,
    categories: homepageCategories,
  };
}
