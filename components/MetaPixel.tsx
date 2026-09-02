'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { CONSENT_UPDATED_EVENT, hasMarketingConsent } from '@/lib/analytics/consent';
import { getPublicPixelId, trackPixel } from '@/lib/analytics/meta-pixel';

/**
 * Loads the Meta Pixel once on the public storefront.
 * PageView: initial load via fbq init snippet; subsequent App Router navigations via track().
 */
export default function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pixelId = getPublicPixelId();
  const initialPageViewDone = useRef(false);
  const lastPath = useRef<string | null>(null);
  const [consented, setConsented] = useState(hasMarketingConsent);

  useEffect(() => {
    if (!pixelId || !hasMarketingConsent()) return;
    const pathKey = `${pathname}?${searchParams.toString()}`;
    if (lastPath.current === pathKey) return;
    lastPath.current = pathKey;

    if (!initialPageViewDone.current) {
      initialPageViewDone.current = true;
      return;
    }
    trackPixel('PageView');
  }, [pathname, searchParams, pixelId]);

  useEffect(() => {
    const onConsent = () => {
      setConsented(hasMarketingConsent());
      lastPath.current = null;
    };
    window.addEventListener(CONSENT_UPDATED_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_UPDATED_EVENT, onConsent);
  }, []);

  if (!pixelId || !consented) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', ${JSON.stringify(pixelId)});
        fbq('track', 'PageView');
      `}
    </Script>
  );
}
