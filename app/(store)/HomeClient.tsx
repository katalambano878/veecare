'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import ProductCard, { type ColorVariant, getColorHex } from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/skeletons/ProductCardSkeleton';
import AnimatedSection, { AnimatedGrid } from '@/components/AnimatedSection';
import HorizontalScroll from '@/components/HorizontalScroll';
import HomeHero from '@/components/home/HomeHero';
import { usePageTitle } from '@/hooks/usePageTitle';
import { HOME_CATEGORIES } from '@/lib/brand';
import type { HomeCategory, HomeProduct } from '@/lib/home-data';

const SelfCareBenefits = dynamic(() => import('@/components/home/SelfCareBenefits'), { ssr: true });
const TestimonialsSection = dynamic(() => import('@/components/home/TestimonialsSection'), { ssr: true });
const SocialProofSection = dynamic(() => import('@/components/home/SocialProofSection'), { ssr: true });
const WhatsAppCta = dynamic(() => import('@/components/home/WhatsAppCta'), { ssr: true });
const HomeFaqSection = dynamic(() => import('@/components/home/HomeFaqSection'), { ssr: true });
const NewsletterSection = dynamic(() => import('@/components/NewsletterSection'), { ssr: true });

const CATEGORY_CARD_CLASS =
  'flex-shrink-0 w-[72vw] max-w-[300px] sm:w-[280px] md:w-[300px] lg:w-[320px]';

type HomeClientProps = {
  initialFeaturedProducts?: HomeProduct[];
  initialCategories?: HomeCategory[];
};

export default function HomeClient({
  initialFeaturedProducts = [],
  initialCategories = [],
}: HomeClientProps) {
  usePageTitle('');

  const featuredProducts = initialFeaturedProducts;
  const categories = initialCategories;
  const productsLoading = false;
  const categoriesLoading = false;

  const fallbackCategories = HOME_CATEGORIES.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.subtitle,
    image_url: null as string | null,
    tint: c.tint,
  }));

  const displayCategories =
    categories.length > 0
      ? categories.map((c, i) => ({
          ...c,
          tint: HOME_CATEGORIES[i % HOME_CATEGORIES.length]?.tint ?? 'from-brand-blush to-brand-ivory',
        }))
      : fallbackCategories;

  return (
    <main className="flex-col min-h-screen relative -mt-[6.25rem] md:-mt-24 pt-0">
      <HomeHero />

      {/* Wellness categories */}
      <section className="py-20 sm:py-24 md:py-24 bg-brand-cream relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-blush/80 to-transparent" />
        <div className="absolute -top-40 right-0 w-96 h-96 bg-brand-rose/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-16 gap-4 sm:gap-6 relative z-10">
            <div>
              <span className="glass inline-flex items-center px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold tracking-wider text-brand-espresso mb-4 shadow-glass">
                WELLNESS CATEGORIES
              </span>
              <h2 className="font-display text-[2rem] sm:text-4xl lg:text-5xl text-brand-cocoa leading-[1.12] tracking-tight">
                Shop by <span className="italic text-brand-berry/90 font-medium">categories</span>
              </h2>
              <p className="text-[0.95rem] sm:text-lg mt-3 sm:mt-5 max-w-lg text-brand-cocoa/70">
                Personal care, hygiene, wellness, and self-care — curated with a calm, crystalline touch.
              </p>
            </div>
            <Link
              href="/categories"
              className="glass-panel group flex items-center justify-center w-14 h-14 rounded-full text-brand-espresso hover:text-brand-berry transition-all duration-300 shadow-glass hover:shadow-glass-hover hover:-translate-y-1"
              aria-label="View all categories"
            >
              <i className="ri-arrow-right-line text-xl transition-transform group-hover:translate-x-1" />
            </Link>
          </AnimatedSection>

          {categoriesLoading ? (
            <HorizontalScroll aria-label="Loading categories" className="-mx-4 sm:-mx-6 px-4 sm:px-6" autoScrollSpeed={14}>
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`${CATEGORY_CARD_CLASS} aspect-[3/4] rounded-[2.5rem] bg-brand-nude/30 animate-pulse border border-white/50 glass-card`}
                />
              ))}
            </HorizontalScroll>
          ) : (
            <HorizontalScroll aria-label="Wellness categories" className="-mx-4 sm:-mx-6 px-4 sm:px-6 pb-8 pt-4" autoScrollSpeed={14}>
              {displayCategories.map((category, index) => (
                <Link
                  href={`/shop?category=${category.slug}`}
                  key={category.id}
                  className={`group block ${CATEGORY_CARD_CLASS} transform transition-all duration-500 hover:-translate-y-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-espresso rounded-[2.5rem]`}
                  draggable={false}
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-[2.5rem] glass-card shadow-glass group-hover:shadow-glass-strong border-2 border-white/60">
                    {'image_url' in category && category.image_url ? (
                      <>
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
                          loading={index < 3 ? 'eager' : 'lazy'}
                          draggable={false}
                        />
                        <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-brand-cocoa/55 via-brand-cocoa/15 to-transparent pointer-events-none" />
                        <div className="absolute inset-0 bg-brand-espresso/10 mix-blend-color opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </>
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${'tint' in category ? category.tint : 'from-brand-blush to-brand-ivory'} opacity-80 group-hover:opacity-100 transition-all duration-700 ease-out group-hover:scale-105`} />
                    )}
                    
                    <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end pointer-events-none">
                      <div className="relative transform transition-transform duration-500 group-hover:translate-y-0 translate-y-1">
                        <h3 className={`font-display text-2xl lg:text-3xl font-medium mb-1 transition-colors ${
                          'image_url' in category && category.image_url
                            ? 'text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] group-hover:text-brand-cream'
                            : 'text-brand-cocoa group-hover:text-brand-espresso'
                        }`}>
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className={`text-sm line-clamp-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 h-0 group-hover:h-auto overflow-hidden ${
                            'image_url' in category && category.image_url
                              ? 'text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]'
                              : 'text-brand-cocoa/80'
                          }`}>
                            {category.description}
                          </p>
                        )}
                        <span className={`inline-flex items-center text-xs font-semibold uppercase tracking-wider mt-3 transition-colors ${
                          'image_url' in category && category.image_url
                            ? 'text-brand-blush drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)] group-hover:text-white'
                            : 'text-brand-berry group-hover:text-brand-rose'
                        }`}>
                          Explore <i className="ri-arrow-right-line ml-1.5 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </HorizontalScroll>
          )}
        </div>
      </section>

      {/* Featured products */}
      <section className="py-20 sm:py-24 md:py-24 bg-brand-blush/10 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-brand-rose/10 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-lavender/10 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />
        
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection className="text-center mb-10 sm:mb-16 lg:mb-20">
            <span className="glass inline-flex items-center px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold tracking-wider text-brand-espresso mb-4 sm:mb-6 shadow-glass">
              CURATED FOR YOU
            </span>
            <h2 className="font-display text-[2rem] sm:text-4xl lg:text-5xl text-brand-cocoa mb-4 sm:mb-6 tracking-tight leading-[1.12]">
              Featured <span className="italic text-brand-berry font-medium">products</span>
            </h2>
            <div className="w-16 sm:w-20 h-px bg-gradient-to-r from-transparent via-brand-rose/50 to-transparent mx-auto mb-6 sm:mb-8" />
            <p className="text-[0.95rem] sm:text-lg text-brand-cocoa/70 max-w-xl mx-auto leading-relaxed">
              Gentle essentials chosen to support hygiene, comfort, and everyday confidence.
            </p>
          </AnimatedSection>

          {productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(4)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <AnimatedGrid className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product) => {
                const variants = product.product_variants || [];
                const hasVariants = variants.length > 0;
                const minVariantPrice = hasVariants
                  ? Math.min(...variants.map((v: { price?: number }) => v.price || product.price))
                  : undefined;
                const totalVariantStock = hasVariants
                  ? variants.reduce((sum: number, v: { quantity?: number }) => sum + (v.quantity || 0), 0)
                  : 0;
                const effectiveStock = hasVariants ? totalVariantStock : product.quantity;

                const colorVariants: ColorVariant[] = [];
                const seenColors = new Set<string>();
                for (const v of variants) {
                  const colorName = (v as { option2?: string }).option2;
                  if (colorName && !seenColors.has(colorName.toLowerCase().trim())) {
                    const hex = getColorHex(colorName);
                    if (hex) {
                      seenColors.add(colorName.toLowerCase().trim());
                      colorVariants.push({ name: colorName.trim(), hex });
                    }
                  }
                }

                const primaryImage = [...(product.product_images || [])].sort(
                  (a: { position?: number }, b: { position?: number }) =>
                    (a.position ?? 0) - (b.position ?? 0)
                )[0]?.url;

                return (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    slug={product.slug}
                    name={product.name}
                    price={product.price}
                    originalPrice={product.compare_at_price ?? undefined}
                    image={primaryImage || ''}
                    rating={product.rating_avg || 5}
                    reviewCount={product.review_count || 0}
                    badge={product.featured ? 'Featured' : undefined}
                    inStock={(effectiveStock ?? 0) > 0}
                    maxStock={effectiveStock ?? 50}
                    moq={product.moq || 1}
                    hasVariants={hasVariants}
                    minVariantPrice={minVariantPrice}
                    colorVariants={colorVariants}
                  />
                );
              })}
            </AnimatedGrid>
          ) : (
            <p className="text-center text-brand-cocoa/60 font-normal py-12">
              New wellness essentials arriving soon. Follow us on Instagram for updates.
            </p>
          )}

          <div className="text-center mt-14">
            <Link href="/shop" className="btn-wellness-primary">
              View all products
            </Link>
          </div>
        </div>
      </section>

      <SelfCareBenefits />
      <TestimonialsSection />
      <SocialProofSection />
      <WhatsAppCta />
      <HomeFaqSection />
      <NewsletterSection />
    </main>
  );
}
