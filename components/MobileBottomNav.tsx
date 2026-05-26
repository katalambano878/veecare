'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useState, useEffect } from 'react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [isStandalone, setIsStandalone] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
  }, []);

  const navItems = [
    {
      href: '/',
      label: 'Home',
      iconActive: 'ri-home-5-fill',
      iconInactive: 'ri-home-5-line',
    },
    {
      href: '/shop',
      label: 'Shop',
      iconActive: 'ri-store-3-fill',
      iconInactive: 'ri-store-3-line',
    },
    {
      href: '/cart',
      label: 'Cart',
      iconActive: 'ri-shopping-cart-fill',
      iconInactive: 'ri-shopping-cart-line',
      badge: cartCount,
    },
    {
      href: '/wishlist',
      label: 'Wishlist',
      iconActive: 'ri-heart-3-fill',
      iconInactive: 'ri-heart-3-line',
      badge: wishlistCount,
    },
    {
      href: '/account',
      label: 'Account',
      iconActive: 'ri-user-3-fill',
      iconInactive: 'ri-user-3-line',
    },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] safe-area-bottom"
      aria-label="Mobile navigation"
    >
      <div className="relative">
        <div className="glass-panel border-t border-white/60 shadow-[0_-8px_30px_rgba(107,62,46,0.08)] rounded-t-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-nude/10 via-transparent to-brand-nude/10" />
          <div
            className={`grid grid-cols-5 relative z-10 pt-2 ${
              isStandalone ? 'pb-6' : 'pb-[max(0.5rem,env(safe-area-inset-bottom))]'
            }`}
          >
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-2 transition-all duration-200 relative group active:scale-90 ${
                    active ? 'text-brand-espresso' : 'text-brand-cocoa/40'
                  }`}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                >
                  {active && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand-espresso rounded-full transition-all duration-300" />
                  )}

                  <div className="relative w-7 h-7 flex items-center justify-center">
                    <i
                      className={`${active ? item.iconActive : item.iconInactive} text-[22px] transition-all duration-300 ${
                        active
                          ? 'scale-110 text-brand-espresso'
                          : 'group-hover:scale-105 text-brand-cocoa/50'
                      }`}
                    />

                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] bg-brand-espresso text-brand-cream text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm animate-scale-in">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-medium tracking-wide mt-0.5 transition-all duration-300 ${
                      active ? 'opacity-100 text-brand-espresso' : 'opacity-70 text-brand-cocoa/60'
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
