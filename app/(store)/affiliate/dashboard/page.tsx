'use client';

import { useEffect, useState } from 'react';
import PortalShell from '@/components/affiliate/PortalShell';
import { usePageTitle } from '@/hooks/usePageTitle';

type Metrics = {
  totalClicks: number;
  uniqueVisitors: number;
  paidOrders: number;
  conversionRate: number;
  customerRevenue: number;
  baseRevenue: number;
  affiliateEarnings: number;
  pendingEarnings: number;
  approvedEarnings: number;
  paidEarnings: number;
  availableBalance: number;
};

export default function AffiliateDashboardPage() {
  usePageTitle('Affiliate dashboard');
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [commissions, setCommissions] = useState<Array<Record<string, unknown>>>([]);
  const [links, setLinks] = useState<Array<Record<string, unknown>>>([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/affiliate/dashboard')
      .then((res) => res.json())
      .then((data) => {
        setMetrics(data.metrics || null);
        setCommissions(data.commissions || []);
        setLinks(data.links || []);
        setStatus(data.affiliate?.status || '');
      })
      .catch(() => undefined);
  }, []);

  const cards = metrics
    ? [
        ['Clicks', metrics.totalClicks],
        ['Unique visitors', metrics.uniqueVisitors],
        ['Paid orders', metrics.paidOrders],
        ['Conversion', `${metrics.conversionRate}%`],
        ['Customer revenue', `GH₵${metrics.customerRevenue.toFixed(2)}`],
        ['Vee-care base', `GH₵${metrics.baseRevenue.toFixed(2)}`],
        ['Your earnings', `GH₵${metrics.affiliateEarnings.toFixed(2)}`],
        ['Pending', `GH₵${metrics.pendingEarnings.toFixed(2)}`],
        ['Approved', `GH₵${metrics.approvedEarnings.toFixed(2)}`],
        ['Paid', `GH₵${metrics.paidEarnings.toFixed(2)}`],
        ['Available', `GH₵${metrics.availableBalance.toFixed(2)}`],
      ]
    : [];

  return (
    <PortalShell>
      {status && status !== 'active' && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          Your account is {status}. You can browse, but only approved partners earn markup on new orders.
        </div>
      )}
      {status === 'active' && commissions.length === 0 && (
        <div className="mb-4 rounded-xl bg-white border border-brand-nude/60 p-4 text-sm text-brand-cocoa">
          Complete your profile, pick a product, generate a selling link, and share it. Paid referred orders appear here.
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {cards.map(([label, value]) => (
          <div key={String(label)} className="bg-white rounded-xl border border-brand-nude/60 p-4">
            <p className="text-xs text-brand-cocoa/60">{label}</p>
            <p className="text-lg font-semibold text-brand-espresso mt-1">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl border border-brand-nude/60 p-4">
          <h2 className="font-semibold text-brand-espresso mb-3">Recent earnings</h2>
          {commissions.length === 0 ? (
            <p className="text-sm text-brand-cocoa/70">Your paid referred orders will appear here.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {commissions.slice(0, 6).map((row) => (
                <li key={String(row.id)} className="flex justify-between gap-3">
                  <span>{String(row.order_number)}</span>
                  <span>GH₵{Number(row.affiliate_amount ?? row.commission_amount).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="bg-white rounded-xl border border-brand-nude/60 p-4">
          <h2 className="font-semibold text-brand-espresso mb-3">Recent links</h2>
          {links.length === 0 ? (
            <p className="text-sm text-brand-cocoa/70">Choose a product and generate your first selling link.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {links.map((row) => (
                <li key={String(row.id)} className="flex justify-between gap-3">
                  <span>{String((row.products as { name?: string } | undefined)?.name || row.public_token)}</span>
                  <span>{Number(row.click_count || 0)} clicks</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PortalShell>
  );
}
