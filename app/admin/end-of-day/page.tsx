'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { adminFetch, cedis } from '@/lib/admin-fetch';
import { Card, Channel, Stat, Todo } from './eod-ui';

type Report = {
  day: string;
  canSeeProfit: boolean;
  summary: {
    paidOrders: number;
    unpaidOrders: number;
    cancelledOrders: number;
    posOrders: number;
    webOrders: number;
    affiliateOrders: number;
    revenue: number;
    posRevenue: number;
    webRevenue: number;
    netRevenue: number;
    discounts: number;
    affiliateOwed: number;
    toFulfil: number;
    unitsSold: number;
    averageOrder: number;
    profit: number | null;
    profitCoverage: number;
  };
  comparison: { yesterday: number; lastWeek: number };
  payments: { method: string; channel: 'POS' | 'Website'; orders: number; revenue: number }[];
  items: {
    productId: string | null;
    name: string;
    units: number;
    posUnits: number;
    webUnits: number;
    revenue: number;
    affiliateMarkup: number;
    stockLeft: number | null;
    profit: number | null;
  }[];
  lowStock: { name: string; stockLeft: number | null }[];
  orders: {
    id: string;
    order_number: string;
    total: number;
    payment_status: string;
    payment_method: string | null;
    status: string;
    created_at: string;
    channel: string;
    customer: string;
    affiliate_code: string | null;
  }[];
};

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  momo: 'Mobile Money',
  moolre: 'Mobile Money (Moolre)',
  paystack: 'Paystack (card / MoMo)',
  other: 'Other',
};

function todayAccra() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Accra' });
}

function changePct(now: number, before: number) {
  if (!before) return null;
  return Math.round(((now - before) / before) * 100);
}

export default function EndOfDayPage() {
  const [date, setDate] = useState(todayAccra());
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (day: string) => {
    setLoading(true);
    setError('');
    try {
      setReport(await adminFetch<Report>(`/api/admin/end-of-day?date=${day}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the report.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(date);
  }, [date, load]);

  const s = report?.summary;
  const vsYesterday = s && report ? changePct(s.revenue, report.comparison.yesterday) : null;
  const webShare = s && s.revenue ? Math.round((s.webRevenue / s.revenue) * 100) : 0;
  const prettyDay = new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const showProfitColumn = Boolean(report?.canSeeProfit && s && s.profit != null);

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-cocoa">End of Day</h1>
          <p className="text-gray-600 mt-1">{prettyDay} · sales, stock movement, website vs POS</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <input
            type="date"
            value={date}
            max={todayAccra()}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-berry focus:ring-brand-berry sm:w-auto"
          />
          <button
            type="button"
            onClick={() => setDate(todayAccra())}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-brand-berry hover:bg-[#B24D6A] px-4 py-2 text-sm font-semibold text-white flex items-center gap-2"
          >
            <i className="ri-printer-line" /> Print close
          </button>
        </div>
      </div>

      {error && <div className="p-4 rounded-lg bg-red-50 text-red-800 text-sm border border-red-100">{error}</div>}

      {loading && !report ? (
        <div className="flex items-center justify-center min-h-[30vh] text-gray-500">
          <i className="ri-loader-4-line text-3xl animate-spin mr-2" /> Loading…
        </div>
      ) : s && report ? (
        <>
          <div className={`grid gap-4 ${report.canSeeProfit ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3'}`}>
            <div className="col-span-2 rounded-xl bg-brand-berry p-6 text-white shadow-sm">
              <p className="text-sm text-white/90">Paid sales</p>
              <p className="mt-2 text-4xl font-bold tabular-nums">{cedis(s.revenue)}</p>
              <p className="mt-1 text-sm text-white/90 tabular-nums">Vee-Care keeps {cedis(s.netRevenue)}</p>
              <p className="mt-2 text-sm text-white/90">
                {s.paidOrders} paid order{s.paidOrders === 1 ? '' : 's'} · {s.unitsSold} item{s.unitsSold === 1 ? '' : 's'} sold
                {vsYesterday != null && (
                  <span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold">
                    {vsYesterday >= 0 ? '+' : ''}
                    {vsYesterday}% vs yesterday
                  </span>
                )}
              </p>
            </div>
            <Stat label="Average order" value={cedis(s.averageOrder)} />
            {report.canSeeProfit && (
              <Stat
                label="Profit (where cost is known)"
                value={s.profit == null ? '—' : cedis(s.profit)}
                hint={
                  s.profit == null ? (
                    <Link href="/admin/profit" className="text-brand-berry hover:underline font-medium">
                      Add supplier costs on Profit margins
                    </Link>
                  ) : (
                    `${Math.round(s.profitCoverage * 100)}% of items have a cost`
                  )
                }
              />
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="font-semibold text-brand-cocoa">Website vs POS</h2>
              <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-brand-blush" aria-hidden>
                <div className="h-full bg-brand-berry" style={{ width: `${webShare}%` }} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Channel label="Website" icon="ri-global-line" revenue={s.webRevenue} orders={s.webOrders} tone="dark" />
                <Channel label="POS (in store)" icon="ri-store-3-line" revenue={s.posRevenue} orders={s.posOrders} tone="light" />
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-brand-cocoa">Still to do</h2>
              <ul className="mt-4 space-y-3 text-sm">
                <Todo label="Paid, not yet sent out" value={s.toFulfil} href="/admin/orders" />
                <Todo label="Waiting for payment" value={s.unpaidOrders} href="/admin/orders" />
                <Todo label="Cancelled" value={s.cancelledOrders} />
                <Todo label="Discounts given" value={cedis(s.discounts)} />
              </ul>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-brand-cocoa mb-3">Affiliate</h2>
              <p className="text-3xl font-bold tabular-nums text-brand-cocoa">{s.affiliateOrders}</p>
              <p className="text-sm text-gray-600 mt-1">affiliate order{s.affiliateOrders === 1 ? '' : 's'} today</p>
              <p className="mt-4 text-sm text-gray-600">Owed to affiliates</p>
              <p className="text-2xl font-bold tabular-nums text-brand-berry">{cedis(s.affiliateOwed)}</p>
              <p className="mt-2 text-xs text-gray-500">Markup kept by affiliates (not Vee-Care revenue)</p>
            </div>
            <Card title="How customers paid" empty="No payments on this day.">
              {report.payments.length > 0 && (
                <ul className="divide-y divide-gray-100 text-sm">
                  {report.payments.map((p) => (
                    <li key={p.method + p.channel} className="flex items-center justify-between py-2.5">
                      <span className="text-gray-800">
                        {METHOD_LABELS[p.method] || p.method}
                        <span className="ml-2 rounded-full bg-brand-blush px-2 py-0.5 text-xs text-brand-cocoa">{p.channel}</span>
                      </span>
                      <span className="tabular-nums">
                        <span className="text-gray-500 mr-3">{p.orders}×</span>
                        <span className="font-semibold">{cedis(p.revenue)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card title="Stock movement" empty="Nothing sold on this day.">
            {report.items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-500">
                    <tr>
                      <th className="py-2 font-medium">Product</th>
                      <th className="py-2 font-medium text-right">Website</th>
                      <th className="py-2 font-medium text-right">POS</th>
                      <th className="py-2 font-medium text-right">Total out</th>
                      <th className="py-2 font-medium text-right">Stock left</th>
                      <th className="py-2 font-medium text-right">Sales</th>
                      {showProfitColumn && <th className="py-2 font-medium text-right">Profit</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.items.map((item) => (
                      <tr key={(item.productId || '') + item.name}>
                        <td className="py-2.5 font-medium text-brand-cocoa">{item.name}</td>
                        <td className="py-2.5 text-right tabular-nums">{item.webUnits}</td>
                        <td className="py-2.5 text-right tabular-nums">{item.posUnits}</td>
                        <td className="py-2.5 text-right font-semibold tabular-nums">−{item.units}</td>
                        <td
                          className={`py-2.5 text-right tabular-nums ${item.stockLeft != null && item.stockLeft <= 5 ? 'text-red-600 font-semibold' : ''}`}
                        >
                          {item.stockLeft ?? '—'}
                        </td>
                        <td className="py-2.5 text-right tabular-nums">{cedis(item.revenue)}</td>
                        {showProfitColumn && (
                          <td className="py-2.5 text-right tabular-nums">{item.profit == null ? '—' : cedis(item.profit)}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {report.lowStock.length > 0 && (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                <i className="ri-alarm-warning-line mr-1" />
                Running low after today: {report.lowStock.map((i) => `${i.name} (${i.stockLeft})`).join(', ')}
              </p>
            )}
          </Card>

          <Card title={`All orders (${report.orders.length})`} empty="No orders on this day.">
            {report.orders.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-500">
                    <tr>
                      <th className="py-2 font-medium">Time</th>
                      <th className="py-2 font-medium">Order</th>
                      <th className="py-2 font-medium">Customer</th>
                      <th className="py-2 font-medium">Channel</th>
                      <th className="py-2 font-medium">Affiliate</th>
                      <th className="py-2 font-medium">Payment</th>
                      <th className="py-2 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.orders.map((o) => (
                      <tr key={o.id}>
                        <td className="py-2.5 tabular-nums text-gray-600">
                          {new Date(o.created_at).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Africa/Accra',
                          })}
                        </td>
                        <td className="py-2.5">
                          <Link href={`/admin/orders/${o.id}`} className="font-medium text-brand-berry hover:underline print:no-underline">
                            {o.order_number}
                          </Link>
                        </td>
                        <td className="py-2.5 text-gray-800">{o.customer || 'Walk-in'}</td>
                        <td className="py-2.5">{o.channel}</td>
                        <td className="py-2.5 text-gray-800 font-mono text-xs">{o.affiliate_code || '—'}</td>
                        <td className="py-2.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${o.payment_status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                          >
                            {o.payment_status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-semibold tabular-nums">{cedis(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}
