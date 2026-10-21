import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { clearStorefrontCache } from '@/lib/storefront-cache';
import { clearCache } from '@/lib/query-cache';

/**
 * Clears storefront + client query caches so new products/categories show immediately.
 * Admin/staff only: an open cache-wipe endpoint is a cheap way to push every request to the DB.
 */
export async function POST(req: Request) {
  const limit = checkRateLimit(`revalidate:${getClientIdentifier(req)}`, { maxRequests: 30, windowSeconds: 60 });
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const auth = await verifyAuth(req, { requireAdmin: true });
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  clearStorefrontCache();
  clearCache();
  revalidatePath('/');
  revalidatePath('/categories');
  revalidatePath('/shop');
  return NextResponse.json({ revalidated: true });
}
