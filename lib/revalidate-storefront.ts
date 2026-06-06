/** Call after admin creates/updates products or categories. */
export async function revalidateStorefront() {
  try {
    await fetch('/api/storefront/revalidate', { method: 'POST' });
  } catch (err) {
    console.warn('[revalidateStorefront]', err);
  }
}
