'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { setAffiliateCookie } from '@/lib/affiliate-client';

/** Captures ?ref=CODE: legacy cookie for display + signed server attribution. */
export default function AffiliateCapture() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');

  useEffect(() => {
    if (!ref?.trim()) return;
    setAffiliateCookie(ref);
    fetch('/api/affiliate/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: ref }),
    }).catch(() => undefined);
  }, [ref]);

  return null;
}
