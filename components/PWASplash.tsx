'use client';

import { useState, useEffect } from 'react';
import { APP_TITLE, BRAND_NAME, LOGO_PATH, TAGLINE } from '@/lib/brand';

export default function PWASplash() {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Only show splash in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    // Only show on first load (not on subsequent navigations)
    const hasShownSplash = sessionStorage.getItem('splashShown');

    if (isStandalone && !hasShownSplash) {
      setShowSplash(true);
      sessionStorage.setItem('splashShown', 'true');

      const timer = setTimeout(() => setShowSplash(false), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showSplash) return null;

  return (
    <div className="pwa-splash" aria-hidden="true">
      <div className="pwa-splash-logo mb-6">
        <img
          src={LOGO_PATH}
          alt={BRAND_NAME}
          className="w-56 max-w-[85vw] h-auto object-contain"
        />
      </div>
      <h1 className="font-display text-xl font-semibold text-brand-espresso mb-2">{APP_TITLE}</h1>
      <p className="text-brand-cocoa/70 text-sm font-medium mb-8">{TAGLINE}</p>
      <div className="pwa-splash-dots flex gap-1.5">
        <span className="w-2 h-2 bg-brand-champagne rounded-full" />
        <span className="w-2 h-2 bg-brand-champagne rounded-full" />
        <span className="w-2 h-2 bg-brand-champagne rounded-full" />
      </div>
    </div>
  );
}
