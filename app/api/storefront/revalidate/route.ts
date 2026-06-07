import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { clearStorefrontCache } from '@/lib/storefront-cache';
import { clearCache } from '@/lib/query-cache';

/** Clears storefront + client query caches so new products/categories show immediately. */
export async function POST() {
  clearStorefrontCache();
  clearCache();
  revalidatePath('/');
  revalidatePath('/categories');
  revalidatePath('/shop');
  return NextResponse.json({ revalidated: true });
}
