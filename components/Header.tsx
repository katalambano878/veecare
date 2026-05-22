'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MiniCart from './MiniCart';
import { useCart } from '@/context/CartContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useCMS } from '@/context/CMSContext';
import AnnouncementBar from './AnnouncementBar';
import {
  APP_TITLE,
  LOGO_PATH,
  LOGO_CLASS_HEADER,
  NAV_LINKS,
  NAV_LINKS_OPTIONAL,
} from '@/lib/brand';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlistCount, setWishlistCount] = useState(0);
  const [user, setUser] = useState<any>(null);

  const { cartCount, isCartOpen, setIsCartOpen } = useCart();
  const { getSetting } = useCMS();

  const siteName = getSetting('site_name') || APP_TITLE;
  const headerLogo = getSetting('site_logo') || LOGO_PATH;

  useEffect(() => {
    const updateWishlistCount = () => {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      setWishlistCount(wishlist.length);
    };

    updateWishlistCount();
    window.addEventListener('wishlistUpdated', updateWishlistCount);

    if (!isSupabaseConfigured()) {
      return () => {
        window.removeEventListener('wishlistUpdated', updateWishlistCount);
      };
    }

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      window.removeEventListener('wishlistUpdated', updateWishlistCount);
      subscription.unsubscribe();
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const navLinkClass =
    'group relative py-2 text-sm font-medium tracking-normal text-brand-cocoa/85 transition-colors duration-300 hover:text-brand-espresso';

  return (
    <>
      <AnnouncementBar />

      <header className="glass sticky top-0 z-50 transition-all duration-500 border-b-0">
        <div className="absolute inset-0 bg-brand-cream/40 -z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-nude/80 to-transparent" />
        <div className="safe-area-top" />
        <nav aria-label="Main navigation" className="relative">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-20 grid grid-cols-[auto_1fr_auto] items-center gap-4">

              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 -ml-2 text-brand-cocoa hover:text-brand-espresso transition-colors"
                  onClick={() => setIsMobileMenuOpen(true)}
                  aria-label="Open menu"
                >
                  <i className="ri-menu-line text-2xl"></i>
                </button>
                <Link href="/" className="flex items-center select-none" aria-label="Go to homepage">
                  <img
                    src={headerLogo}
                    alt={siteName}
                    className={`${LOGO_CLASS_HEADER} max-w-[160px] md:max-w-[200px]`}
                  />
                </Link>
              </div>

              <div className="hidden lg:flex items-center justify-center gap-8 xl:gap-10">
                {NAV_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} className={navLinkClass}>
                    {link.label}
                    <span className="absolute inset-x-0 bottom-0 h-px scale-x-0 bg-brand-champagne transition-transform duration-300 ease-out group-hover:scale-x-100" />
                  </Link>
                ))}
              </div>

              <div className="flex items-center justify-end space-x-1 sm:space-x-3">
                <button
                  className="p-2 text-brand-cocoa hover:text-brand-espresso transition-transform hover:scale-105"
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="Search"
                >
                  <i className="ri-search-line text-xl"></i>
                </button>

                <Link
                  href="/wishlist"
                  className="p-2 text-brand-cocoa hover:text-brand-espresso transition-transform hover:scale-105 relative hidden sm:block"
                  aria-label="Wishlist"
                >
                  <i className="ri-heart-line text-xl"></i>
                  {wishlistCount > 0 && (
                    <span className="absolute top-1 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-brand-espresso text-[10px] font-bold text-brand-cream">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                {user ? (
                  <Link
                    href="/account"
                    className="p-2 text-brand-cocoa hover:text-brand-espresso transition-transform hover:scale-105 hidden sm:block"
                    aria-label="Account"
                  >
                    <i className="ri-user-line text-xl"></i>
                  </Link>
                ) : (
                  <Link
                    href="/auth/login"
                    className="p-2 text-brand-cocoa hover:text-brand-espresso transition-transform hover:scale-105 hidden sm:block"
                    aria-label="Login"
                  >
                    <i className="ri-user-line text-xl"></i>
                  </Link>
                )}

                <button
                  className="relative p-2 text-brand-cocoa hover:text-brand-espresso transition-transform hover:scale-105"
                  onClick={() => setIsCartOpen(!isCartOpen)}
                  aria-label="Cart"
                >
                  <i className="ri-shopping-bag-line text-xl"></i>
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-brand-champagne text-[10px] font-bold text-brand-espresso">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <MiniCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {isSearchOpen && (
        <div className="fixed inset-0 bg-brand-cocoa/20 backdrop-blur-md z-50 flex items-start justify-center pt-24 transition-all duration-500 animate-in fade-in">
          <div className="glass-panel rounded-3xl w-full max-w-2xl mx-4 animate-in slide-in-from-top-4 duration-500">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-display font-semibold text-brand-espresso">Search</h3>
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/50 text-brand-cocoa/60 hover:text-brand-espresso hover:bg-white transition-all"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
              <form onSubmit={handleSearch}>
                <div className="relative group">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search curated pieces..."
                    className="w-full px-6 py-4 pr-14 border border-white/60 rounded-2xl focus:ring-2 focus:ring-brand-champagne/50 focus:border-brand-champagne text-lg bg-white/60 backdrop-blur-sm text-brand-cocoa shadow-inner transition-all placeholder:text-brand-cocoa/40"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl bg-brand-espresso text-white hover:bg-brand-cocoa transition-colors shadow-md group-focus-within:bg-brand-champagne"
                  >
                    <i className="ri-search-line text-xl"></i>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div
            className="absolute inset-0 bg-brand-cocoa/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-0 left-0 bottom-0 w-[85%] max-w-sm bg-brand-cream shadow-luxury-lg flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-5 border-b border-brand-nude flex items-center justify-between">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                <img src={headerLogo} alt={siteName} className="h-9 w-auto object-contain max-w-[140px]" />
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 -mr-2 text-brand-cocoa/60 hover:text-brand-espresso"
                aria-label="Close menu"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-5 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-4 py-3.5 text-base font-medium text-brand-cocoa hover:bg-brand-nude/50 rounded-xl transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-px bg-brand-nude my-3" />
              <p className="px-4 text-xs font-medium text-brand-cocoa/50 mb-1">Discover</p>
              {NAV_LINKS_OPTIONAL.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-4 py-3 text-sm text-brand-cocoa/80 hover:bg-brand-nude/40 rounded-xl transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-px bg-brand-nude my-3" />
              {[
                { label: 'Track Order', href: '/order-tracking' },
                { label: 'Wishlist', href: '/wishlist' },
                { label: 'My Account', href: '/account' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-4 py-3 text-sm text-brand-cocoa/70 hover:bg-brand-nude/30 rounded-xl transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="p-5 border-t border-brand-nude">
              <p className="text-xs text-brand-cocoa/50 text-center tracking-wide">
                &copy; {new Date().getFullYear()} {siteName}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
