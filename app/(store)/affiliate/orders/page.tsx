'use client';

import { useEffect, useState } from 'react';
import PortalShell from '@/components/affiliate/PortalShell';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function AffiliateOrdersPage() {
  usePageTitle('Affiliate orders');
  const [orders, setOrders] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    fetch('/api/affiliate/orders')
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []))
      .catch(() => undefined);
  }, []);

  return (
    <PortalShell>
      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-brand-nude/60 p-8 text-center text-brand-cocoa/70">
          Your paid referred orders will appear here.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <article key={String(order.id)} className="bg-white rounded-xl border border-brand-nude/60 p-4 text-sm">
              <div className="flex justify-between gap-3">
                <strong>{String(order.order_number)}</strong>
                <span className="capitalize">{String(order.earning_status)}</span>
              </div>
              <p className="text-brand-cocoa/70 mt-1">{new Date(String(order.created_at)).toLocaleString()}</p>
              <p>Customer paid GH₵{Number(order.selling_amount).toFixed(2)}</p>
              <p>Vee-care base GH₵{Number(order.product_base_amount).toFixed(2)}</p>
              <p>You earned GH₵{Number(order.affiliate_amount).toFixed(2)}</p>
            </article>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
