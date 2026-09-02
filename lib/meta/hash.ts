import { createHash } from 'crypto';
import 'server-only';

/** SHA-256 hex of a normalized string. Empty/invalid input returns null (omit field). */
export function sha256Hex(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return createHash('sha256').update(normalized).digest('hex');
}

export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed.includes('@') ? trimmed : null;
}

/** Digits only, Ghana leading 0 → 233. */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 10) {
    digits = `233${digits.slice(1)}`;
  }
  return digits.length >= 8 ? digits : null;
}

export function normalizeName(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value.trim().toLowerCase().replace(/[^a-z\s'-]/gi, '');
  return cleaned || null;
}

export function normalizeCity(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value.trim().toLowerCase().replace(/[^a-z0-9\s]/gi, '');
  return cleaned || null;
}

export function hashEmail(email: string | null | undefined): string | null {
  return sha256Hex(normalizeEmail(email));
}

export function hashPhone(phone: string | null | undefined): string | null {
  const normalized = normalizePhone(phone);
  return normalized ? sha256Hex(normalized) : null;
}

export function hashName(value: string | null | undefined): string | null {
  return sha256Hex(normalizeName(value));
}

export function hashCity(value: string | null | undefined): string | null {
  return sha256Hex(normalizeCity(value));
}

export function hashCountry(code: string | null | undefined): string | null {
  if (!code) return sha256Hex('gh');
  return sha256Hex(code.trim().toLowerCase());
}
