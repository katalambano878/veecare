'use client';

import { useEffect, useState } from 'react';
import PortalShell from '@/components/affiliate/PortalShell';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function AffiliateEarningsPage() {
  usePageTitle('Affiliate earnings');
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    fetch('/api/affiliate/earnings')
      .then((res) => res.json())
      .then((data) => {
        setSummary(data.summary || null);
        setRows(data.earnings || []);
      })
      .catch(() => undefined);
  }, []);

  return (
    <PortalShell>
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {Object.entries(summary)
            .filter(([key]) => key !== 'minimumPayoutGhs')
            .map(([key, value]) => (
              <div key={key} className="bg-white rounded-xl border border-brand-nude/60 p-4">
                <p className="text-xs text-brand-cocoa/60 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                <p className="font-semibold text-brand-espresso">GH₵{Number(value).toFixed(2)}</p>
              </div>
            ))}
        </div>
      )}
      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-brand-nude/60 p-8 text-center text-brand-cocoa/70">
          Your paid referred orders will appear here.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <article key={String(row.id)} className="bg-white rounded-xl border border-brand-nude/60 p-4 text-sm">
              <div className="flex justify-between">
                <strong>{String(row.order_number)}</strong>
                <span className="capitalize">{String(row.status)}</span>
              </div>
              <p>Base GH₵{Number(row.product_base_amount).toFixed(2)}</p>
              <p>Selling GH₵{Number(row.selling_amount).toFixed(2)}</p>
              <p>Affiliate GH₵{Number(row.affiliate_amount).toFixed(2)} ({Number(row.rate_snapshot)}%)</p>
            </article>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
