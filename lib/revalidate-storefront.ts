import { supabase } from '@/lib/supabase';

/** Call after admin creates/updates products or categories. Sends the admin session so the route can authorize it. */
export async function revalidateStorefront() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const headers = new Headers();
    if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    await fetch('/api/storefront/revalidate', {
      method: 'POST',
      headers,
      credentials: 'include',
      signal: controller.signal,
    });
    clearTimeout(timer);
  } catch (err) {
    console.warn('[revalidateStorefront]', err);
  }
}
