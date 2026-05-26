'use client';

import { useEffect } from 'react';

const REMIXICON_HREF = 'https://cdn.jsdelivr.net/npm/remixicon@4.1.0/fonts/remixicon.css';

/** Load icon font after first paint so LCP (hero) is not blocked. */
export default function DeferredRemixIcon() {
  useEffect(() => {
    if (document.querySelector(`link[href="${REMIXICON_HREF}"]`)) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = REMIXICON_HREF;
    link.media = 'print';
    link.onload = () => {
      link.media = 'all';
    };
    document.head.appendChild(link);
  }, []);

  return null;
}
