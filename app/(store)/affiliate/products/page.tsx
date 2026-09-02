'use client';

import { useEffect, useState } from 'react';
import PortalShell from '@/components/affiliate/PortalShell';
import { usePageTitle } from '@/hooks/usePageTitle';

type Product = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  stock: number;
  available: boolean;
  customPriceAllowed: boolean;
  minSellingGhs: number | null;
  maxSellingGhs: number | null;
  product_base_price: number;
  affiliate_markup_rate: number;
  affiliate_markup_amount: number;
  affiliate_selling_price: number;
};

export default function AffiliateProductsPage() {
  usePageTitle('Affiliate products');
  const [products, setProducts] = useState<Product[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/affiliate/products')
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => undefined);
  }, []);

  const generate = async (product: Product) => {
    setBusyId(product.id);
    setMessage('');
    try {
      const res = await fetch('/api/affiliate/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not generate link');
      await navigator.clipboard.writeText(data.link.url);
      setMessage(`Link copied for ${product.name}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not generate link');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PortalShell>
      {message && <p className="mb-4 text-sm text-brand-espresso">{message}</p>}
      {products.length === 0 ? (
        <div className="bg-white rounded-xl border border-brand-nude/60 p-8 text-center text-brand-cocoa/70">
          Affiliate products are currently unavailable.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {products.map((product) => (
            <article key={product.id} className="bg-white rounded-xl border border-brand-nude/60 overflow-hidden">
              {product.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image} alt="" className="h-40 w-full object-cover" />
              )}
              <div className="p-4 space-y-1 text-sm">
                <h2 className="font-semibold text-brand-espresso text-base">{product.name}</h2>
                <p>Vee-care base price: <strong>GH₵{product.product_base_price.toFixed(2)}</strong></p>
                <p>Your markup: <strong>{product.affiliate_markup_rate}%</strong></p>
                <p>Customer pays: <strong>GH₵{product.affiliate_selling_price.toFixed(2)}</strong></p>
                <p>You earn: <strong>GH₵{product.affiliate_markup_amount.toFixed(2)}</strong> per unit</p>
                <p className="text-brand-cocoa/70">{product.available ? 'In stock' : 'Out of stock'}</p>
                <button
                  type="button"
                  disabled={!product.available || busyId === product.id}
                  onClick={() => generate(product)}
                  className="mt-3 w-full btn-luxury-primary py-3 disabled:opacity-50"
                >
                  {busyId === product.id ? 'Generating…' : 'Generate selling link'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
