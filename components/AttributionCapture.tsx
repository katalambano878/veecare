'use client';

import { useEffect } from 'react';
import { captureAttributionFromLocation } from '@/lib/analytics/attribution';

/** Persist UTM / fbclid so attribution survives cart → checkout → payment redirect. */
export default function AttributionCapture() {
  useEffect(() => {
    captureAttributionFromLocation();
  }, []);

  return null;
}
