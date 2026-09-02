'use client';

import { hasMarketingConsent } from './consent';
import type { MetaStandardEvent } from './types';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export function getPublicPixelId(): string | null {
  const id = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  return id || null;
}

export function isPixelReady(): boolean {
  return typeof window !== 'undefined' && typeof window.fbq === 'function' && !!getPublicPixelId();
}

export function trackPixel(
  event: MetaStandardEvent,
  payload?: Record<string, unknown>,
  eventId?: string
): void {
  if (!hasMarketingConsent() || !isPixelReady() || !window.fbq) return;
  try {
    if (eventId) {
      window.fbq('track', event, payload || {}, { eventID: eventId });
    } else {
      window.fbq('track', event, payload || {});
    }
  } catch (error) {
    console.error('[META_EVENT_FAILED]', { channel: 'pixel', event });
    void error;
  }
}
