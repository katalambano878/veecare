/** Call after admin creates/updates products or categories. */
export async function revalidateStorefront() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    await fetch('/api/storefront/revalidate', {
      method: 'POST',
      signal: controller.signal,
    });
    clearTimeout(timer);
  } catch (err) {
    console.warn('[revalidateStorefront]', err);
  }
}
