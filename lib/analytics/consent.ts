/**
 * Reads the existing cookieConsent localStorage record.
 * CookieConsent.tsx is not currently mounted, so most visitors have no record.
 * Missing consent matches current GA behavior (allowed). Explicit marketing:false suppresses Meta.
 */

export const CONSENT_STORAGE_KEY = 'cookieConsent';
export const CONSENT_UPDATED_EVENT = 'veecare-consent-updated';

export type StoredConsent = {
  necessary?: boolean;
  analytics?: boolean;
  marketing?: boolean;
  functional?: boolean;
  timestamp?: string;
};

export function readStoredConsent(): StoredConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/** Marketing pixels/CAPI from the browser. */
export function hasMarketingConsent(): boolean {
  const stored = readStoredConsent();
  if (!stored) return true;
  return stored.marketing === true;
}

export function notifyConsentUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CONSENT_UPDATED_EVENT));
}
