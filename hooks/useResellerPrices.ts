'use client';

import { useEffect, useMemo, useState } from 'react';

let quoteCache: { key: string; attributed: boolean; rows: ResellerPriceRow[]; at: number } | null = null;
const CACHE_MS = 60_000;

export type ResellerPriceRow = {
  product_id: string;
  variant_name: string | null;
  product_base_price: number;
  affiliate_selling_price: number;
  affiliate_markup_amount: number;
};

export function useResellerPrices(
  items: Array<{ id: string; quantity?: number; variant?: string | null }>
) {
  const [rows, setRows] = useState<ResellerPriceRow[]>([]);
  const [attributed, setAttributed] = useState(false);

  const key = useMemo(
    () => items.map((item) => `${item.id}:${item.variant || ''}:${item.quantity || 1}`).join('|'),
    [items]
  );

  useEffect(() => {
    if (!items.length) {
      setRows([]);
      setAttributed(false);
      return;
    }
    if (quoteCache && quoteCache.key === key && Date.now() - quoteCache.at < CACHE_MS) {
      setAttributed(quoteCache.attributed);
      setRows(quoteCache.rows);
      return;
    }
    let cancelled = false;
    fetch('/api/reseller/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((item) => ({
          id: item.id,
          quantity: item.quantity || 1,
          variant: item.variant || null,
        })),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setAttributed(Boolean(data.attributed));
        setRows(Array.isArray(data.items) ? data.items : []);
        quoteCache = {
          key,
          attributed: Boolean(data.attributed),
          rows: Array.isArray(data.items) ? data.items : [],
          at: Date.now(),
        };
      })
      .catch(() => {
        if (!cancelled) {
          setAttributed(false);
          setRows([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  function sellingPrice(productId: string, variant?: string | null, fallback?: number) {
    const match = rows.find(
      (row) => row.product_id === productId && (!variant || row.variant_name === variant)
    );
    if (match) return match.affiliate_selling_price;
    return fallback ?? 0;
  }

  return { attributed, rows, sellingPrice };
}
