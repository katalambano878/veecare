'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MiniCart from './MiniCart';
import { useCart } from '@/context/CartContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useCMS } from '@/context/CMSContext';
import Logo from '@/components/Logo';
import { APP_TITLE, NAV_LINKS } from '@/lib/brand';

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlistCount, setWishlistCount] = useState(0);
  const [user, setUser] = useState<any>(null);

  const { cartCount, isCartOpen, setIsCartOpen } = useCart();
  const { getSetting } = useCMS();

  const siteName = getSetting('site_name') || APP_TITLE;

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

    let subscription: { unsubscribe: () => void } | undefined;
    let idleId: number | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const initAuth = () => {
      void (async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      })();

      const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user ?? null);
        }
      );
      subscription = authSub;
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(initAuth, { timeout: 2000 });
    } else {
      timerId = setTimeout(initAuth, 300);
    }

    return () => {
      window.removeEventListener('wishlistUpdated', updateWishlistCount);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timerId !== undefined) clearTimeout(timerId);
      subscription?.unsubscribe();
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
      <header className="fixed top-0 inset-x-0 z-50 transition-all duration-500 pt-2 px-4 sm:pt-4 sm:px-6 lg:px-8">
        <div className="glass mx-auto max-w-[1440px] rounded-2xl shadow-glass border border-white/40">
          <div className="absolute inset-0 bg-brand-cream/20 rounded-2xl -z-10" />
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/60 pointer-events-none" />
          <nav aria-label="Main navigation" className="relative">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="h-16 md:h-20 grid grid-cols-[auto_1fr_auto] items-center gap-4">

              <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center select-none" aria-label={`${siteName} — home`}>
                  <Logo className="h-10 md:h-11 w-auto max-w-[160px] md:max-w-[200px]" priority />
                </Link>
              </div>

              <div className="hidden lg:flex items-center justify-center gap-6 xl:gap-8">
                {NAV_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} className={navLinkClass}>
                    {link.label}
                    <span className="absolute inset-x-0 bottom-0 h-px scale-x-0 bg-brand-rose transition-transform duration-300 ease-out group-hover:scale-x-100" />
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

            {/* Mobile & tablet nav — includes Blog */}
            <div className="lg:hidden border-t border-white/50 px-2 pb-2">
              <div className="flex gap-1 overflow-x-auto scrollbar-hide py-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="shrink-0 px-3 py-1.5 text-xs font-medium text-brand-cocoa/85 hover:text-brand-espresso rounded-full hover:bg-white/40 transition-colors whitespace-nowrap"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>
        </div>
      </header>
      {/* Spacer for fixed glass header */}
      <div className="h-[6.25rem] md:h-24 shrink-0" aria-hidden />

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

      {/* Mobile slide-out menu removed; primary navigation lives in header + page sections */}
    </>
  );
}
