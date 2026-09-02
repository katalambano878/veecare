'use client';

import { useEffect, useState } from 'react';
import PortalShell from '@/components/affiliate/PortalShell';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function AffiliatePayoutsPage() {
  usePageTitle('Affiliate payouts');
  const [paid, setPaid] = useState<Array<Record<string, unknown>>>([]);
  const [minimum, setMinimum] = useState(50);

  useEffect(() => {
    fetch('/api/affiliate/earnings')
      .then((res) => res.json())
      .then((data) => {
        setPaid((data.earnings || []).filter((row: { status: string }) => row.status === 'paid'));
        setMinimum(Number(data.summary?.minimumPayoutGhs || 50));
      })
      .catch(() => undefined);
  }, []);

  return (
    <PortalShell>
      <p className="text-sm text-brand-cocoa/80 mb-4">
        Payouts are reviewed and marked paid by Vee-care. Minimum payout is GH₵{minimum.toFixed(2)}. Automatic MoMo
        disbursement is not enabled yet.
      </p>
      {paid.length === 0 ? (
        <div className="bg-white rounded-xl border border-brand-nude/60 p-8 text-center text-brand-cocoa/70">
          Paid commissions will appear here after admin marks them paid.
        </div>
      ) : (
        <div className="space-y-3">
          {paid.map((row) => (
            <article key={String(row.id)} className="bg-white rounded-xl border border-brand-nude/60 p-4 text-sm">
              <div className="flex justify-between">
                <strong>{String(row.order_number)}</strong>
                <span>GH₵{Number(row.affiliate_amount).toFixed(2)}</span>
              </div>
              <p className="text-brand-cocoa/70">{row.paid_at ? new Date(String(row.paid_at)).toLocaleString() : 'Paid'}</p>
            </article>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
