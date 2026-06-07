'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { setAffiliateCookie } from '@/lib/affiliate';

/** Saves ?ref=CODE to a 30-day cookie so checkout can attribute the order. */
export default function AffiliateCapture() {
    const searchParams = useSearchParams();
    const ref = searchParams.get('ref');

    useEffect(() => {
        if (ref?.trim()) {
            setAffiliateCookie(ref);
        }
    }, [ref]);

    return null;
}
