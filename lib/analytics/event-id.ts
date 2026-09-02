export function randomEventId(prefix: string): string {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  return `${prefix}_${uuid}`;
}

/** Stable Purchase event_id shared by Pixel and CAPI. */
export function purchaseEventId(orderId: string): string {
  return `purchase_${orderId}`;
}
