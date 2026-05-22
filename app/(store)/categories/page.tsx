import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import PageHero from '@/components/PageHero';

export const revalidate = 0;

export default async function CategoriesPage() {
  const { data: categoriesData } = await supabase
    .from('categories')
    .select(`
      id,
      name,
      slug,
      description,
      image_url,
      position
    `)
    .eq('status', 'active')
    .order('position', { ascending: true });

  const palette = [
    { color: 'from-brand-espresso to-brand-cocoa', icon: 'ri-store-2-line' },
    { color: 'from-brand-mauve to-brand-espresso', icon: 'ri-shopping-bag-3-line' },
    { color: 'from-brand-champagne to-brand-espresso', icon: 'ri-t-shirt-line' },
    { color: 'from-brand-nude to-brand-mauve', icon: 'ri-home-smile-line' },
    { color: 'from-brand-espresso to-brand-mauve', icon: 'ri-heart-line' },
    { color: 'from-brand-cocoa to-brand-espresso', icon: 'ri-star-smile-line' },
  ];

  const categories = categoriesData?.map((c, i) => {
    const style = palette[i % palette.length];
    return {
      ...c,
      image: c.image_url || 'https://via.placeholder.com/600x400?text=Category',
      color: style.color,
      icon: style.icon,
      productCount: 'Browse',
    };
  }) || [];

  return (
    <div className="min-h-screen bg-brand-cream">
      <PageHero
        title="Shop by Category"
        subtitle="Fashion, home appliances, imports, accessories, and lifestyle. Shop every category in one place."
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-16">
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 md:gap-8">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug}`}
                className="group bg-white/90 border border-brand-nude/60 rounded-xl sm:rounded-2xl overflow-hidden hover:shadow-luxury transition-all cursor-pointer h-full flex flex-col"
              >
                <div className="relative h-28 sm:h-40 md:h-48 overflow-hidden shrink-0">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${category.color} opacity-0 group-hover:opacity-20 transition-opacity`}></div>
                </div>
                <div className="p-3 sm:p-5 md:p-6 flex flex-col flex-1">
                  <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className={`w-8 h-8 sm:w-11 sm:h-11 md:w-12 md:h-12 shrink-0 bg-gradient-to-br ${category.color} rounded-full flex items-center justify-center`}>
                      <i className={`${category.icon} text-base sm:text-xl md:text-2xl text-white`}></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-sm sm:text-lg md:text-xl font-semibold text-brand-espresso leading-tight line-clamp-2">
                        {category.name}
                      </h3>
                      <p className="text-[10px] sm:text-sm text-brand-cocoa/60 mt-0.5">Collection</p>
                    </div>
                  </div>
                  <p className="text-brand-cocoa/70 leading-snug text-[11px] sm:text-sm mb-2 sm:mb-4 line-clamp-2 flex-1">
                    {category.description || 'Explore our exclusive collection in this category.'}
                  </p>
                  <div className="flex items-center text-brand-espresso font-medium text-[11px] sm:text-sm group-hover:gap-1.5 transition-all mt-auto">
                    <span className="line-clamp-1">Browse</span>
                    <i className="ri-arrow-right-line text-sm sm:text-base shrink-0"></i>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-brand-nude/20 rounded-2xl border border-brand-nude/50">
            <i className="ri-inbox-line text-5xl text-brand-nude mb-4"></i>
            <p className="text-xl text-brand-cocoa/60">No categories found.</p>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-brand-espresso to-brand-cocoa py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-4xl font-semibold text-white mb-4">Can&apos;t Find What You&apos;re Looking For?</h2>
          <p className="text-xl text-brand-nude/90 mb-8 leading-relaxed">
            Try our advanced search or contact our team for personalised product recommendations
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-white text-brand-espresso px-8 py-4 rounded-full font-medium hover:bg-brand-cream transition-colors whitespace-nowrap"
            >
              <i className="ri-search-line"></i>
              Search All Products
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-brand-mauve text-white px-8 py-4 rounded-full font-medium hover:bg-brand-espresso transition-colors whitespace-nowrap"
            >
              <i className="ri-customer-service-line"></i>
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
