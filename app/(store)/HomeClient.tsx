'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ProductCard, { type ColorVariant, getColorHex } from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/skeletons/ProductCardSkeleton';
import AnimatedSection, { AnimatedGrid } from '@/components/AnimatedSection';
import HorizontalScroll from '@/components/HorizontalScroll';
import NewsletterSection from '@/components/NewsletterSection';
import WhoWeAreSection from '@/components/WhoWeAreSection';
import { usePageTitle } from '@/hooks/usePageTitle';
import { HERO_IMAGES, HERO_IMAGE_VERSION } from '@/lib/brand';

const CATEGORY_TINTS = [
  'from-[#A6A089]/80 via-[#EDE3D7]/60 to-[#FAF7F2]',
  'from-[#C8A46A]/70 via-[#EDE3D7]/50 to-[#A6A089]/40',
  'from-[#EDE3D7] via-[#FAF7F2] to-[#A6A089]/30',
  'from-[#8A6A58]/50 via-[#A6A089]/40 to-[#C8A46A]/30',
  'from-[#A6A089]/90 via-[#EDE3D7]/70 to-[#FAF7F2]',
  'from-[#8A6A58]/60 via-[#4A403B]/40 to-[#C8A46A]/25',
] as const;

type StoreCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
};

const CATEGORY_CARD_CLASS =
  'flex-shrink-0 w-[72vw] max-w-[300px] sm:w-[280px] md:w-[300px] lg:w-[320px]';

const HERO_SLIDES = [
  {
    tag: 'Trending Now',
    image: HERO_IMAGES[0],
    heading: (
      <>
        Trending Fashion <br />
        <span className="italic font-medium text-brand-champagne">&amp; Lifestyle Finds</span>
      </>
    ),
    subtext:
      'Your trending lifestyle destination and import plug: fashion, home appliances, accessories, and curated arrivals for every style.',
    cta: { text: 'Shop Collection', href: '/shop' },
    cta2: { text: 'Explore Arrivals', href: '/shop?sort=newest' },
  },
  {
    tag: 'Statement Style',
    image: HERO_IMAGES[1],
    heading: (
      <>
        Style That <br />
        <span className="italic font-light text-brand-nude">Stands Out</span>
      </>
    ),
    subtext:
      'From fashion and bags to home appliances and import-ready picks: discover what is trending and what is worth sourcing.',
    cta: { text: 'View Collection', href: '/shop' },
    cta2: { text: 'Discover More', href: '/categories' },
  },
  {
    tag: 'Import Lifestyle',
    image: HERO_IMAGES[2],
    heading: (
      <>
        Modern Imports <br />
        <span className="italic font-medium text-brand-champagne">For Every Home</span>
      </>
    ),
    subtext:
      'Fashion, appliances, cars, and curated lifestyle picks in one modern imported platform built for Ghana and beyond.',
    cta: { text: 'Shop New Arrivals', href: '/shop?sort=newest' },
    cta2: { text: 'Browse Categories', href: '/categories' },
  },
];

export default function HomeClient() {
  usePageTitle('');
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchHomeData() {
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
          .select('id, name, slug, description, image_url')
          .eq('status', 'active')
          .is('parent_id', null)
          .contains('metadata', { featured: true })
          .order('position', { ascending: true }),
      ]);

      if (productsResult.error) {
        const err = productsResult.error as { message?: string; code?: string };
        if (err?.code !== 'PGRST205') {
          console.error('Error fetching featured products:', err?.message);
        }
      } else {
        setFeaturedProducts(productsResult.data || []);
      }
      setProductsLoading(false);

      if (categoriesResult.error) {
        const err = categoriesResult.error as { message?: string; code?: string };
        if (err?.code !== 'PGRST205') {
          console.error('Error fetching categories:', err?.message);
        }
      } else {
        setCategories(categoriesResult.data || []);
      }
      setCategoriesLoading(false);
    }

    fetchHomeData();
  }, []);

  return (
    <main className="flex-col min-h-screen">
      {/* Hero: sharp 16:9 lifestyle imagery, left-aligned copy */}
      <section className="relative w-full overflow-hidden bg-brand-cream">
        <div className="relative w-full aspect-video min-h-[546px] max-md:max-h-none md:min-h-[420px] md:max-h-[92vh]">
        <div className="absolute top-0 left-0 right-0 z-30 h-0.5 bg-brand-nude/50 hidden md:block">
          <div
            key={currentSlide}
            className="h-full bg-brand-mauve animate-progress origin-left"
            style={{ animationDuration: '5500ms' }}
          />
        </div>

        {HERO_SLIDES.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
            aria-hidden={index !== currentSlide}
          >
            {/* Native img: avoids Next optimizer + zoom animation blur on PNG heroes */}
            <img
              src={`${slide.image}?v=${HERO_IMAGE_VERSION}`}
              alt=""
              width={1024}
              height={576}
              decoding={index === 0 ? 'sync' : 'async'}
              fetchPriority={index === 0 ? 'high' : 'auto'}
              className="hero-slide-media absolute inset-0 w-full h-full"
            />

            <div
              className="absolute inset-0 bg-black/30 pointer-events-none"
              aria-hidden
            />

            <div className="absolute inset-0 flex items-center pointer-events-none">
              <div className="relative z-10 w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 xl:px-16 py-16 sm:py-0 pointer-events-auto">
                <div className="max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl text-left flex flex-col items-start">
                  <div
                    className={`transition-all duration-700 delay-100 ${
                      index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                    }`}
                  >
                    <span className="inline-block py-2 px-5 mb-5 sm:mb-6 text-white text-xs sm:text-sm font-medium tracking-normal bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
                      {slide.tag}
                    </span>
                  </div>

                  <div
                    className={`transition-all duration-700 delay-200 ${
                      index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                    }`}
                  >
                    <h1 className="text-[2.35rem] sm:text-5xl md:text-6xl lg:text-[4.25rem] font-display font-semibold text-white mb-5 sm:mb-6 leading-[1.06] tracking-tight drop-shadow-[0_2px_16px_rgba(0,0,0,0.35)]">
                      {slide.heading}
                    </h1>
                  </div>

                  <div
                    className={`transition-all duration-700 delay-300 ${
                      index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                    }`}
                  >
                    <p className="text-base sm:text-lg md:text-xl text-white/95 max-w-md md:max-w-lg mb-8 sm:mb-10 font-medium leading-relaxed drop-shadow-md">
                      {slide.subtext}
                    </p>
                  </div>

                  <div
                    className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 transition-all duration-700 delay-400 w-full sm:w-auto ${
                      index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                    }`}
                  >
                    <Link
                      href={slide.cta.href}
                      className="btn-luxury-primary text-sm md:text-base shadow-soft justify-center group"
                    >
                      <span className="flex items-center gap-2">
                        {slide.cta.text}
                        <i className="ri-arrow-right-line transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                    <Link
                      href={slide.cta2.href}
                      className="hidden sm:inline-flex btn-luxury-outline text-sm md:text-base justify-center border-white/40 text-white hover:bg-white hover:text-brand-espresso"
                    >
                      {slide.cta2.text}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="absolute bottom-8 sm:bottom-10 left-5 sm:left-8 lg:left-14 xl:left-16 z-20 hidden md:flex gap-2.5">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentSlide(i)}
              className={`h-1 rounded-full transition-all duration-500 ${
                currentSlide === i ? 'w-10 bg-white' : 'w-5 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="absolute bottom-10 right-5 md:right-12 z-20 hidden lg:block pointer-events-none">
          <p
            className="text-brand-cocoa/40 text-xs font-medium tracking-normal"
            style={{ writingMode: 'vertical-rl' }}
          >
            Upscale Vintage
          </p>
        </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 md:py-28 bg-white relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-nude to-transparent" />

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <AnimatedSection className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
            <div>
              <span className="brand-eyebrow mb-3 block">Shop by category</span>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-brand-espresso leading-[1.1] tracking-tight">
                Curated <span className="italic text-brand-mauve/80">for you</span>
              </h2>
            </div>
            <Link
              href="/categories"
              className="group flex items-center justify-center w-12 h-12 rounded-full border border-brand-nude hover:border-brand-mauve hover:bg-brand-mauve hover:text-white transition-all duration-300 text-brand-espresso bg-brand-cream"
            >
              <i className="ri-arrow-right-line text-lg transition-transform group-hover:translate-x-0.5" />
            </Link>
          </AnimatedSection>

          {categoriesLoading ? (
            <div className="-mx-4 sm:-mx-6">
            <HorizontalScroll aria-label="Loading categories" className="px-4 sm:px-6" autoScrollSpeed={16}>
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`${CATEGORY_CARD_CLASS} aspect-[4/5] rounded-3xl bg-brand-nude/40 animate-pulse border border-brand-nude/60`}
                />
              ))}
            </HorizontalScroll>
            </div>
          ) : categories.length > 0 ? (
            <AnimatedSection>
              <div className="-mx-4 sm:-mx-6">
              <HorizontalScroll aria-label="Shop by category" className="px-4 sm:px-6" autoScrollSpeed={16}>
                {categories.map((category, index) => (
                  <Link
                    href={`/shop?category=${category.slug}`}
                    key={category.id}
                    className={`group block ${CATEGORY_CARD_CLASS}`}
                    draggable={false}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-brand-nude/40 shadow-luxury border border-brand-nude/60">
                      {category.image_url ? (
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                          draggable={false}
                        />
                      ) : (
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${CATEGORY_TINTS[index % CATEGORY_TINTS.length]} transition-transform duration-[1200ms] ease-out group-hover:scale-105`}
                        />
                      )}
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-black/55 from-25% to-transparent pointer-events-none"
                        aria-hidden
                      />
                      <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 flex flex-col justify-end z-10">
                        <span className="text-xs font-medium text-brand-champagne mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 drop-shadow-md">
                          Shop now
                        </span>
                        <h3 className="font-display text-2xl md:text-3xl text-white leading-tight mb-2 drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
                          {category.name}
                        </h3>
                        <div className="h-px w-10 bg-white/60 mb-3 group-hover:w-full transition-all duration-700 ease-out" />
                        {category.description && (
                          <p className="text-white/95 text-sm sm:text-base font-medium line-clamp-2 drop-shadow-md">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </HorizontalScroll>
              </div>
            </AnimatedSection>
          ) : (
            <p className="text-center text-brand-cocoa/55 font-light py-8">
              Add categories in the admin dashboard to show them here.
            </p>
          )}
        </div>
      </section>

      {/* Featured */}
      <section className="py-16 md:py-24 bg-brand-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-14">
            <span className="brand-eyebrow mb-3 block">Handpicked</span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-brand-espresso mb-4 tracking-tight">
              Featured Products
            </h2>
            <div className="w-16 h-px bg-brand-champagne mx-auto mb-6" />
            <p className="brand-body max-w-xl mx-auto text-center">
              Trending lifestyle picks and import-ready favorites: fashion, appliances, accessories, and more.
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
                  ? Math.min(...variants.map((v: any) => v.price || product.price))
                  : undefined;
                const totalVariantStock = hasVariants
                  ? variants.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0)
                  : 0;
                const effectiveStock = hasVariants ? totalVariantStock : product.quantity;

                const colorVariants: ColorVariant[] = [];
                const seenColors = new Set<string>();
                for (const v of variants) {
                  const colorName = (v as any).option2;
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
                    originalPrice={product.compare_at_price}
                    image={primaryImage || ''}
                    rating={product.rating_avg || 5}
                    reviewCount={product.review_count || 0}
                    badge={product.featured ? 'Featured' : undefined}
                    inStock={effectiveStock > 0}
                    maxStock={effectiveStock || 50}
                    moq={product.moq || 1}
                    hasVariants={hasVariants}
                    minVariantPrice={minVariantPrice}
                    colorVariants={colorVariants}
                  />
                );
              })}
            </AnimatedGrid>
          ) : (
            <p className="text-center text-brand-cocoa/55 font-light py-12">
              New featured pieces arriving soon.
            </p>
          )}

          {(featuredProducts.length > 0 || !productsLoading) && (
            <div className="text-center mt-14">
              <Link href="/shop" className="btn-luxury-primary">
                View All Products
              </Link>
            </div>
          )}
        </div>
      </section>

      <WhoWeAreSection />
      <NewsletterSection />
    </main>
  );
}
