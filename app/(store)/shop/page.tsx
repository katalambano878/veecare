'use client';

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import ProductCard, { type ColorVariant } from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/skeletons/ProductCardSkeleton';
import { getColorHex } from '@/components/ProductCard';
import { supabase } from '@/lib/supabase';
import { cachedQuery } from '@/lib/query-cache';
import PageHero from '@/components/PageHero';

const PRODUCTS_PER_PAGE = 9;

function formatShopProduct(p: any) {
  const variants = p.product_variants || [];
  const hasVariants = variants.length > 0;
  const minVariantPrice = hasVariants ? Math.min(...variants.map((v: any) => v.price || p.price)) : undefined;
  const totalVariantStock = hasVariants ? variants.reduce((sum: number, v: any) => sum + (v.quantity || 0), 0) : 0;
  const effectiveStock = hasVariants ? totalVariantStock : p.quantity;
  const colorVariants: ColorVariant[] = [];
  const seenColors = new Set<string>();
  for (const v of variants) {
    const colorName = v.option2;
    if (colorName && !seenColors.has(colorName.toLowerCase().trim())) {
      const hex = getColorHex(colorName);
      if (hex) {
        seenColors.add(colorName.toLowerCase().trim());
        colorVariants.push({ name: colorName.trim(), hex });
      }
    }
  }

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    originalPrice: p.compare_at_price,
    image: p.product_images?.[0]?.url || 'https://via.placeholder.com/800x800?text=No+Image',
    rating: p.rating_avg || 0,
    reviewCount: 0,
    badge: p.compare_at_price > p.price ? 'Sale' : undefined,
    inStock: effectiveStock > 0,
    maxStock: effectiveStock || 50,
    moq: p.moq || 1,
    category: p.categories?.name,
    hasVariants,
    minVariantPrice,
    colorVariants,
  };
}

function ShopContent() {
  usePageTitle('Shop All Products');
  const searchParams = useSearchParams();

  // State
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([{ id: 'all', name: 'All Products', count: 0 }]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [sortBy, setSortBy] = useState('popular');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const searchQuery = searchParams.get('search') || '';
  const filterSignature = useMemo(
    () => `${selectedCategory}|${searchQuery}|${priceRange.join('-')}|${selectedRating}|${sortBy}`,
    [selectedCategory, searchQuery, priceRange, selectedRating, sortBy],
  );

  // Initialize from URL params
  useEffect(() => {
    const category = searchParams.get('category');
    const sort = searchParams.get('sort');

    if (category) setSelectedCategory(category);
    if (sort) setSortBy(sort);
  }, [searchParams]);

  const prevFilterRef = useRef(filterSignature);

  // Fetch Categories from cached API
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/storefront/categories');
        if (res.ok) {
          const data = await res.json();
          if (data) setCategories(data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    }
    fetchCategories();
  }, []);

  // Fetch Products (infinite scroll pages)
  useEffect(() => {
    const filterChanged = prevFilterRef.current !== filterSignature;
    if (filterChanged) {
      prevFilterRef.current = filterSignature;
      setProducts([]);
      setHasMore(true);
      if (page !== 1) {
        setPage(1);
        return;
      }
    }

    async function fetchProducts() {
      const isFirstPage = page === 1;
      if (isFirstPage) setLoading(true);
      else setLoadingMore(true);

      try {
        const cacheKey = `shop:${filterSignature}:${page}`;

        const { data, count, error } = await cachedQuery<{ data: any; count: any; error: any }>(
          cacheKey,
          async () => {
            let query = supabase
              .from('products')
              .select(`
                *,
                categories(name, slug),
                product_images!product_id(url, position),
                product_variants(id, name, price, quantity, option1, option2, image_url)
              `, { count: 'exact' })
              .eq('status', 'active')
              .order('position', { foreignTable: 'product_images', ascending: true });

            if (searchQuery) {
              query = query.ilike('name', `%${searchQuery}%`);
            }

            if (selectedCategory !== 'all') {
              const categoryObj = categories.find(c => c.slug === selectedCategory);

              if (categoryObj) {
                const targetSlugs = [selectedCategory];
                const childSlugs = categories
                  .filter(c => c.parent_id === categoryObj.id)
                  .map(c => c.slug);
                targetSlugs.push(...childSlugs);
                query = query.in('categories.slug', targetSlugs);
              } else {
                query = query.eq('categories.slug', selectedCategory);
              }
            }

            if (priceRange[1] < 5000) {
              query = query.gte('price', priceRange[0]).lte('price', priceRange[1]);
            }

            if (selectedRating > 0) {
              query = query.gte('rating_avg', selectedRating);
            }

            switch (sortBy) {
              case 'price-low':
                query = query.order('price', { ascending: true });
                break;
              case 'price-high':
                query = query.order('price', { ascending: false });
                break;
              case 'rating':
                query = query.order('rating_avg', { ascending: false });
                break;
              case 'new':
              case 'popular':
              default:
                query = query.order('created_at', { ascending: false });
                break;
            }

            const from = (page - 1) * PRODUCTS_PER_PAGE;
            const to = from + PRODUCTS_PER_PAGE - 1;
            query = query.range(from, to);

            return query as any;
          },
          60 * 1000,
        );

        if (error) throw error;

        const formattedProducts = (data || []).map(formatShopProduct);
        const total = count || 0;

        setTotalProducts(total);
        setProducts((prev) => {
          if (isFirstPage) return formattedProducts;
          const seen = new Set(prev.map((item) => item.id));
          return [...prev, ...formattedProducts.filter((item: { id: string }) => !seen.has(item.id))];
        });
        setHasMore(page * PRODUCTS_PER_PAGE < total && formattedProducts.length > 0);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        if (isFirstPage) setLoading(false);
        else setLoadingMore(false);
      }
    }

    if (categories.length > 0 || selectedCategory === 'all') {
      fetchProducts();
    }
  }, [filterSignature, page, categories, selectedCategory, searchQuery, priceRange, selectedRating, sortBy]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      setPage((p) => p + 1);
    }
  }, [loading, loadingMore, hasMore]);

  const loadMoreRef = useInfiniteScroll({
    onLoadMore: loadMore,
    enabled: hasMore && !loading && !loadingMore && products.length > 0,
  });

  return (
    <main className="min-h-screen bg-brand-cream relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-rose/10 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-lavender/20 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />
      <PageHero
        title="Shop All Products"
        subtitle="Feminine care, hygiene, and wellness essentials — curated with a calm, crystalline touch for everyday confidence."
        
      />

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden glass-panel border-b border-white/50 py-4 px-4 sticky top-[72px] z-20 shadow-glass backdrop-blur-xl">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center space-x-2 text-brand-espresso font-semibold tracking-wide"
          >
            <i className="ri-filter-3-line text-xl"></i>
            <span>Filters & Sort</span>
          </button>
          <span className="text-sm font-medium tracking-wide text-brand-cocoa/70">{totalProducts} Products</span>
        </div>
      </div>

      <section className="py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className={`${isFilterOpen ? 'fixed inset-0 z-50 glass-panel overflow-y-auto backdrop-blur-xl' : 'hidden'} lg:block lg:w-72 lg:flex-shrink-0`}>
              <div className="lg:sticky lg:top-28">
                <div className="p-6 lg:p-0">
                  <div className="flex items-center justify-between mb-6 lg:hidden">
                    <h2 className="font-display text-xl font-semibold text-brand-espresso">Filters</h2>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl glass text-brand-cocoa hover:text-brand-espresso shadow-glass"
                    >
                      <i className="ri-close-line text-2xl"></i>
                    </button>
                  </div>

                  <div className="glass-panel rounded-[2rem] p-6 lg:p-8 border border-white/60 shadow-glass-strong space-y-8">
                    {/* Categories */}
                    <div>
                      <h3 className="font-semibold text-brand-espresso mb-4">Categories</h3>
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            setSelectedCategory('all');
                            setIsFilterOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 rounded-xl transition-all duration-300 ${selectedCategory === 'all'
                            ? 'glass text-brand-espresso font-semibold shadow-glass border border-white/60'
                            : 'text-brand-cocoa hover:glass hover:shadow-glass border border-transparent'
                            }`}
                        >
                          All Products
                        </button>

                        {/* Parent Categories */}
                        {categories.filter(c => !c.parent_id && c.id !== 'all').map(parent => {
                          const subcategories = categories.filter(c => c.parent_id === parent.id);
                          const isSelected = selectedCategory === parent.slug;
                          const isChildSelected = subcategories.some(sub => sub.slug === selectedCategory);
                          const isOpen = isSelected || isChildSelected; // Auto-expand if selected

                          return (
                            <div key={parent.id} className="space-y-1">
                              <button
                                onClick={() => {
                                  setSelectedCategory(parent.slug);
                                }}
                                className={`w-full text-left px-4 py-2.5 rounded-xl transition-all duration-300 flex justify-between items-center ${isSelected
                                  ? 'glass text-brand-espresso font-semibold shadow-glass border border-white/60'
                                  : 'text-brand-cocoa hover:glass hover:shadow-glass border border-transparent'
                                  }`}
                              >
                                <span>{parent.name}</span>
                              </button>

                              {/* Subcategories */}
                              {subcategories.length > 0 && (
                                <div className="ml-4 border-l-2 border-brand-rose/20 pl-2 space-y-1">
                                  {subcategories.map(child => (
                                    <button
                                      key={child.id}
                                      onClick={() => {
                                        setSelectedCategory(child.slug);
                                        setIsFilterOpen(false);
                                      }}
                                      className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-all duration-300 ${selectedCategory === child.slug
                                        ? 'glass text-brand-espresso font-semibold shadow-glass'
                                        : 'text-brand-cocoa/70 hover:glass hover:text-brand-espresso'
                                        }`}
                                    >
                                      {child.name}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div className="border-t border-white/50 pt-8">
                      <h3 className="font-semibold text-brand-espresso mb-4 tracking-wide uppercase text-xs">Max Price: GH₵{priceRange[1]}</h3>
                      <div className="space-y-4">
                        <input
                          type="range"
                          min="0"
                          max="5000"
                          step="50"
                          value={priceRange[1]}
                          onChange={(e) => {
                            setPriceRange([0, parseInt(e.target.value)]);
                          }}
                          className="w-full h-2 rounded-full appearance-none cursor-pointer accent-brand-berry bg-brand-blush/50"
                        />
                        <div className="flex items-center justify-between text-sm text-brand-cocoa/60">
                          <span>GH₵0</span>
                          <span>GH₵5000+</span>
                        </div>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="border-t border-white/40 pt-8">
                      <h3 className="font-semibold text-brand-espresso mb-4 tracking-wide">Rating</h3>
                      <div className="space-y-2">
                        {[4, 3, 2, 1].map(rating => (
                          <button
                            key={rating}
                            onClick={() => {
                              setSelectedRating(rating === selectedRating ? 0 : rating);
                            }}
                            className={`w-full text-left px-4 py-2.5 rounded-xl transition-all duration-300 ${selectedRating === rating
                              ? 'glass-panel text-brand-espresso shadow-glass border border-white/60'
                              : 'text-brand-cocoa hover:glass'
                              }`}
                          >
                            <div className="flex items-center space-x-2">
                              {[1, 2, 3, 4, 5].map(star => (
                                <i
                                  key={star}
                                  className={`${star <= rating ? 'ri-star-fill text-brand-champagne' : 'ri-star-line text-brand-nude'} text-sm`}
                                ></i>
                              ))}
                              <span className="text-sm">& Up</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsFilterOpen(false);
                      }}
                      className="w-full btn-wellness-primary py-3.5 shadow-glass hover:shadow-glass-hover"
                    >
                      Show Results
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 glass px-6 py-4 rounded-2xl shadow-glass border border-white/60">
                <p className="text-brand-cocoa/80 text-sm sm:text-base font-medium">
                  Showing <span className="font-semibold text-brand-espresso">{products.length}</span> of <span className="font-semibold text-brand-espresso">{totalProducts}</span> products
                </p>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <label className="text-sm font-semibold tracking-wide text-brand-espresso/80 whitespace-nowrap uppercase">SORT BY</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 sm:flex-none px-4 py-2.5 pr-10 border border-white/60 rounded-xl focus:ring-2 focus:ring-brand-rose focus:border-brand-rose text-sm font-medium glass-panel cursor-pointer text-brand-espresso shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23C95D7B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat"
                  >
                    <option value="popular">Most Popular</option>
                    <option value="new">Newest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>
              </div>

              {loading && products.length === 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-6 md:gap-8">
                  {[...Array(6)].map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6 md:gap-8" data-product-shop>
                    {products.map(product => (
                      <ProductCard key={product.id} {...product} />
                    ))}
                  </div>

                  {products.length === 0 && !loading && (
                    <div className="text-center py-20 glass-card rounded-[2.5rem] border border-white/60 shadow-glass">
                      <div className="w-20 h-20 flex items-center justify-center mx-auto mb-6 glass rounded-2xl shadow-glass">
                        <i className="ri-inbox-line text-4xl text-brand-berry/60"></i>
                      </div>
                      <h3 className="text-2xl font-display text-brand-espresso mb-2">No Products Found</h3>
                      <p className="text-brand-cocoa/70 mb-8 font-medium text-base max-w-md mx-auto">Try adjusting your filters to find what you&apos;re looking for</p>
                      <button
                        onClick={() => {
                          setSelectedCategory('all');
                          setPriceRange([0, 5000]);
                          setSelectedRating(0);
                        }}
                        className="glass-panel inline-flex items-center px-8 py-3.5 rounded-full font-semibold text-brand-espresso hover:text-brand-berry transition-all hover:shadow-glass-hover border border-white/60"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  )}

                  {products.length > 0 && (
                    <div ref={loadMoreRef} className="mt-12 flex flex-col items-center justify-center min-h-[4rem]">
                      {loadingMore && (
                        <div className="flex items-center gap-3 text-brand-cocoa/70 text-sm font-medium">
                          <div className="w-6 h-6 border-2 border-brand-espresso border-t-transparent rounded-full animate-spin" />
                          Loading more products…
                        </div>
                      )}
                      {!hasMore && !loadingMore && totalProducts > PRODUCTS_PER_PAGE && (
                        <p className="text-sm text-brand-cocoa/60">You&apos;ve seen all {totalProducts} products</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-brand-cream"><div className="w-12 h-12 border-4 border-brand-espresso border-t-transparent rounded-full animate-spin"></div></div>}>
      <ShopContent />
    </Suspense>
  );
}