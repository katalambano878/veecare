import { isSupabaseConfigured } from '@/lib/supabase-config';
import { supabaseAdmin } from '@/lib/supabase-admin';

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

  const [productsResult, categoriesResult] = await Promise.all([
    supabaseAdmin
      .from('products')
      .select('*, product_variants(*), product_images(*)')
      .eq('status', 'active')
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(8),
    supabaseAdmin
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

  const featuredProducts = ((productsResult.data ?? []) as HomeProduct[]).filter(
    (product) => (product.product_images?.length ?? 0) > 0
  );

  const homepageCategories = (
    (categoriesResult.data ?? []) as Array<HomeCategory & { metadata?: { featured?: boolean } }>
  )
    .filter((category) => category.metadata?.featured === true)
    .map(({ id, name, slug, description, image_url }) => ({
      id,
      name,
      slug,
      description,
      image_url,
    }));

  return {
    featuredProducts,
    categories: homepageCategories,
  };
}
