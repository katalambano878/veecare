import type { AttributionSnapshot, OrderAttributionMeta } from './types';

export const ATTRIBUTION_STORAGE_KEY = 'veecare_attribution';
const ATTRIBUTION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function emptySnapshot(): AttributionSnapshot {
  return {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
    fbclid: null,
    fbc: null,
    fbp: null,
    landing_page: null,
    referrer: null,
    user_agent: null,
    captured_at: null,
  };
}

function parseStored(raw: string | null): AttributionSnapshot | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AttributionSnapshot;
    if (!parsed || typeof parsed !== 'object') return null;
    const captured = parsed.captured_at ? Date.parse(parsed.captured_at) : NaN;
    if (Number.isFinite(captured) && Date.now() - captured > ATTRIBUTION_MAX_AGE_MS) {
      return null;
    }
    return { ...emptySnapshot(), ...parsed };
  } catch {
    return null;
  }
}

export function readFbp(): string | null {
  const value = readCookie('_fbp');
  return value && value.startsWith('fb.') ? value : null;
}

export function readFbcCookie(): string | null {
  const value = readCookie('_fbc');
  return value && value.startsWith('fb.') ? value : null;
}

/**
 * Build fbc from a real fbclid only. Never invent click IDs.
 * Format: fb.1.{creation_time_ms}.{fbclid}
 */
export function fbcFromFbclid(fbclid: string, timestampMs = Date.now()): string {
  const clean = fbclid.trim();
  return clean ? `fb.1.${timestampMs}.${clean}` : '';
}

function persist(snapshot: AttributionSnapshot): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(snapshot);
    sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, serialized);
    localStorage.setItem(ATTRIBUTION_STORAGE_KEY, serialized);
  } catch {
    /* private mode */
  }
}

export function loadAttribution(): AttributionSnapshot {
  if (typeof window === 'undefined') return emptySnapshot();
  return (
    parseStored(sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY)) ||
    parseStored(localStorage.getItem(ATTRIBUTION_STORAGE_KEY)) ||
    emptySnapshot()
  );
}

/** Capture UTM / fbclid from the current URL. Last paid click wins for campaign fields. */
export function captureAttributionFromLocation(): AttributionSnapshot {
  const current = loadAttribution();
  const params = new URLSearchParams(window.location.search);
  const next: AttributionSnapshot = { ...current };

  let touched = false;

  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim();
    if (value) {
      next[key] = value;
      touched = true;
    }
  }

  const fbclid = params.get('fbclid')?.trim();
  if (fbclid) {
    next.fbclid = fbclid;
    next.fbc = fbcFromFbclid(fbclid);
    touched = true;
  } else if (!next.fbc) {
    next.fbc = readFbcCookie();
  }

  const fbp = readFbp();
  if (fbp) {
    next.fbp = fbp;
  }

  if (!next.landing_page) {
    next.landing_page = `${window.location.pathname}${window.location.search}`;
    touched = true;
  }

  if (!next.referrer && document.referrer) {
    try {
      const refHost = new URL(document.referrer).hostname;
      if (refHost && refHost !== window.location.hostname) {
        next.referrer = document.referrer;
        touched = true;
      }
    } catch {
      /* ignore invalid referrer */
    }
  }

  next.user_agent = navigator.userAgent || next.user_agent;
  if (touched || !next.captured_at) {
    next.captured_at = next.captured_at || new Date().toISOString();
    persist(next);
  } else if (fbp && fbp !== current.fbp) {
    persist(next);
  }

  return next;
}

export function refreshMetaCookies(): AttributionSnapshot {
  const current = loadAttribution();
  const fbp = readFbp();
  const fbc = current.fbc || readFbcCookie();
  if (fbp !== current.fbp || fbc !== current.fbc) {
    const next = { ...current, fbp: fbp || current.fbp, fbc: fbc || current.fbc };
    persist(next);
    return next;
  }
  return current;
}

export function getAttributionForOrder(): OrderAttributionMeta {
  const snap = refreshMetaCookies();
  const out: OrderAttributionMeta = {};
  const assign = (
    key: Exclude<keyof OrderAttributionMeta, 'marketing_consent'>,
    value: string | null | undefined
  ) => {
    if (value) out[key] = value;
  };
  assign('utm_source', snap.utm_source);
  assign('utm_medium', snap.utm_medium);
  assign('utm_campaign', snap.utm_campaign);
  assign('utm_content', snap.utm_content);
  assign('utm_term', snap.utm_term);
  assign('fbclid', snap.fbclid);
  assign('fbc', snap.fbc);
  assign('fbp', snap.fbp);
  assign('landing_page', snap.landing_page);
  assign('referrer', snap.referrer);
  assign('user_agent', snap.user_agent);
  return out;
}
