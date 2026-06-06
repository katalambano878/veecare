'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import PageHero from '@/components/PageHero';
import { useWishlist } from '@/context/WishlistContext';
import ProductCard from '@/components/ProductCard';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function WishlistPage() {
  usePageTitle('Wishlist');
  const { wishlist: wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const addAllToCart = () => {
    const inStockItems = wishlistItems.filter(item => item.inStock);
    inStockItems.forEach(item => {
      addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: 1,
        slug: item.slug || item.id,
        maxStock: 99
      });
    });
    if (inStockItems.length > 0) {
      alert(`Added ${inStockItems.length} items to cart`);
    }
  };

  return (
    <main className="min-h-screen bg-brand-cream">
      <PageHero title="My Wishlist" />

      <section className="py-8 bg-white/60 border-b border-brand-nude/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <nav className="flex items-center space-x-2 text-sm mb-2">
                <Link href="/" className="text-brand-cocoa/70 hover:text-brand-espresso transition-colors">Home</Link>
                <i className="ri-arrow-right-s-line text-brand-nude"></i>
                <span className="text-brand-espresso font-medium">Wishlist</span>
              </nav>
              <p className="text-brand-cocoa/70">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
              </p>
            </div>
            {wishlistItems.length > 0 && (
              <button
                onClick={addAllToCart}
                className="btn-luxury-primary px-6 py-3"
              >
                Add All to Cart
              </button>
            )}
          </div>
        </div>
      </section>

      {wishlistItems.length === 0 ? (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <div className="w-24 h-24 flex items-center justify-center mx-auto mb-6 bg-brand-nude/40 rounded-full">
              <i className="ri-heart-line text-5xl text-brand-cocoa/40"></i>
            </div>
            <h2 className="font-display text-3xl font-semibold text-brand-espresso mb-4">Your wishlist is empty</h2>
            <p className="text-brand-cocoa/70 mb-8 text-lg">Save your favourite items here to easily find them later</p>
            <Link href="/shop" className="inline-block btn-luxury-primary px-8 py-4">
              Explore Products
            </Link>
          </div>
        </section>
      ) : (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {wishlistItems.map((product) => (
                <div key={product.id} className="relative">
                  <ProductCard {...product} slug={product.slug || product.id} />
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-luxury hover:bg-red-50 transition-colors z-10"
                  >
                    <i className="ri-close-line text-brand-cocoa text-xl"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 bg-white border-t border-brand-nude/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-r from-brand-espresso to-brand-cocoa rounded-2xl p-12 text-center text-white shadow-luxury">
            <h2 className="font-display text-3xl font-semibold mb-4">Share Your Wishlist</h2>
            <p className="text-brand-nude/90 mb-8 text-lg">Let friends and family know what you love</p>
            <div className="flex justify-center space-x-4">
              <button className="w-12 h-12 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                <i className="ri-facebook-fill text-xl"></i>
              </button>
              <button className="w-12 h-12 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                <i className="ri-twitter-x-fill text-xl"></i>
              </button>
              <button className="w-12 h-12 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                <i className="ri-whatsapp-fill text-xl"></i>
              </button>
              <button className="w-12 h-12 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                <i className="ri-mail-fill text-xl"></i>
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
