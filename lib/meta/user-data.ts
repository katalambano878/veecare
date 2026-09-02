import 'server-only';
import {
  hashCity,
  hashCountry,
  hashEmail,
  hashName,
  hashPhone,
  sha256Hex,
} from './hash';

export type RawUserData = {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  externalId?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
};

export type MetaUserData = Record<string, string | string[]>;

function setHashed(target: MetaUserData, key: string, hashed: string | null): void {
  if (hashed) target[key] = hashed;
}

function isLikelyCustomerIp(ip: string | null | undefined): boolean {
  if (!ip) return false;
  const value = ip.trim();
  if (!value || value === 'unknown') return false;
  if (value.startsWith('10.') || value.startsWith('127.') || value.startsWith('192.168.')) {
    return false;
  }
  return true;
}

/**
 * Build CAPI user_data. Hash PII Meta requires hashed. Leave fbp/fbc/IP/UA raw.
 */
export function buildUserData(raw: RawUserData): MetaUserData {
  const user: MetaUserData = {};
  setHashed(user, 'em', hashEmail(raw.email));
  setHashed(user, 'ph', hashPhone(raw.phone));
  setHashed(user, 'fn', hashName(raw.firstName));
  setHashed(user, 'ln', hashName(raw.lastName));
  setHashed(user, 'ct', hashCity(raw.city));
  setHashed(user, 'st', hashCity(raw.state));
  setHashed(user, 'zp', raw.postalCode ? sha256Hex(raw.postalCode.replace(/\s+/g, '').toLowerCase()) : null);
  setHashed(user, 'country', hashCountry(raw.country || 'gh'));
  setHashed(user, 'external_id', raw.externalId ? sha256Hex(raw.externalId) : null);

  if (isLikelyCustomerIp(raw.clientIpAddress)) {
    user.client_ip_address = raw.clientIpAddress!.trim();
  }
  if (raw.clientUserAgent?.trim()) {
    user.client_user_agent = raw.clientUserAgent.trim();
  }
  if (raw.fbp && raw.fbp.startsWith('fb.')) {
    user.fbp = raw.fbp;
  }
  if (raw.fbc && raw.fbc.startsWith('fb.')) {
    user.fbc = raw.fbc;
  }

  return user;
}
