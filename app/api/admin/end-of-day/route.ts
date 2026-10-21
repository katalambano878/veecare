import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/pool';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const POS = `COALESCE(o.metadata->>'pos_sale', '') = 'true'`;
const AFFILIATE_MARKUP = `COALESCE((o.metadata->'reseller'->>'affiliate_markup_total')::numeric, 0)`;
const LOW_STOCK_AT = 5;
const MAX_ORDERS = 300;
const MAX_ITEMS = 200;

type DayTotals = {
  paid_orders: number;
  unpaid_orders: number;
  cancelled_orders: number;
  pos_orders: number;
  web_orders: number;
  affiliate_orders: number;
  revenue: number;
  pos_revenue: number;
  web_revenue: number;
  discounts: number;
  affiliate_owed: number;
  to_fulfil: number;
};

type PaymentRow = { method: string; channel: string; orders: number; revenue: number };

type ItemRow = {
  product_id: string | null;
  name: string;
  units: number;
  pos_units: number;
  web_units: number;
  revenue: number;
  affiliate_markup: number;
  stock_left: number | null;
  unit_cost: number | null;
};

type OrderRow = {
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
};

type PriorDay = { yesterday: number; last_week: number };

const EMPTY_TOTALS: DayTotals = {
  paid_orders: 0,
  unpaid_orders: 0,
  cancelled_orders: 0,
  pos_orders: 0,
  web_orders: 0,
  affiliate_orders: 0,
  revenue: 0,
  pos_revenue: 0,
  web_revenue: 0,
  discounts: 0,
  affiliate_owed: 0,
  to_fulfil: 0,
};

/** Ghana is UTC+0 all year, so an Accra calendar day is a plain UTC range. */
function dayRange(raw: string | null) {
  const today = new Date().toISOString().slice(0, 10);
  const day = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) && raw <= today ? raw : today;
  return { day, start: `${day}T00:00:00.000Z`, end: `${day}T23:59:59.999Z` };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request, { requireAdmin: true });
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
  }
  const canSeeProfit = auth.role === 'admin';

  const { day, start, end } = dayRange(request.nextUrl.searchParams.get('date'));
  const range = [start, end];

  try {
    const [totals, payments, products, orders, previous] = await Promise.all([
      query<DayTotals>(
        `SELECT
           COUNT(*) FILTER (WHERE o.payment_status = 'paid')::int AS paid_orders,
           COUNT(*) FILTER (WHERE o.payment_status <> 'paid' AND o.status <> 'cancelled')::int AS unpaid_orders,
           COUNT(*) FILTER (WHERE o.status = 'cancelled')::int AS cancelled_orders,
           COUNT(*) FILTER (WHERE o.payment_status = 'paid' AND ${POS})::int AS pos_orders,
           COUNT(*) FILTER (WHERE o.payment_status = 'paid' AND NOT ${POS})::int AS web_orders,
           COUNT(*) FILTER (WHERE o.payment_status = 'paid' AND ${AFFILIATE_MARKUP} > 0)::int AS affiliate_orders,
           COALESCE(SUM(o.total) FILTER (WHERE o.payment_status = 'paid'), 0)::float AS revenue,
           COALESCE(SUM(o.total) FILTER (WHERE o.payment_status = 'paid' AND ${POS}), 0)::float AS pos_revenue,
           COALESCE(SUM(o.total) FILTER (WHERE o.payment_status = 'paid' AND NOT ${POS}), 0)::float AS web_revenue,
           COALESCE(SUM(o.discount_total) FILTER (WHERE o.payment_status = 'paid'), 0)::float AS discounts,
           COALESCE(SUM(${AFFILIATE_MARKUP}) FILTER (WHERE o.payment_status = 'paid'), 0)::float AS affiliate_owed,
           COUNT(*) FILTER (WHERE o.payment_status = 'paid' AND o.status NOT IN ('shipped', 'delivered', 'cancelled'))::int AS to_fulfil
         FROM orders o
         WHERE o.created_at BETWEEN $1 AND $2`,
        range
      ),
      query<PaymentRow>(
        `SELECT COALESCE(NULLIF(o.payment_method, ''), 'other') AS method,
                CASE WHEN ${POS} THEN 'POS' ELSE 'Website' END AS channel,
                COUNT(*)::int AS orders,
                COALESCE(SUM(o.total), 0)::float AS revenue
           FROM orders o
          WHERE o.created_at BETWEEN $1 AND $2 AND o.payment_status = 'paid'
          GROUP BY 1, 2
          ORDER BY revenue DESC`,
        range
      ),
      query<ItemRow>(
        `SELECT oi.product_id,
                COALESCE(p.name, oi.product_name, 'Unknown item') AS name,
                SUM(oi.quantity)::int AS units,
                COALESCE(SUM(oi.quantity) FILTER (WHERE ${POS}), 0)::int AS pos_units,
                COALESCE(SUM(oi.quantity) FILTER (WHERE NOT ${POS}), 0)::int AS web_units,
                COALESCE(SUM(oi.total_price), 0)::float AS revenue,
                COALESCE(SUM(COALESCE((oi.metadata->>'line_markup_amount')::numeric, 0)), 0)::float AS affiliate_markup,
                p.quantity::int AS stock_left,
                COALESCE(pc.cost_price, p.cost_per_item)::float AS unit_cost
           FROM order_items oi
           JOIN orders o ON o.id = oi.order_id
           LEFT JOIN products p ON p.id = oi.product_id
           LEFT JOIN product_costs pc ON pc.product_id = oi.product_id
          WHERE o.created_at BETWEEN $1 AND $2
            AND o.payment_status = 'paid' AND o.status <> 'cancelled'
          GROUP BY oi.product_id, COALESCE(p.name, oi.product_name, 'Unknown item'), p.quantity, pc.cost_price, p.cost_per_item
          ORDER BY revenue DESC
          LIMIT ${MAX_ITEMS}`,
        range
      ),
      query<OrderRow>(
        `SELECT o.id, o.order_number, o.total::float AS total, o.payment_status, o.payment_method,
                o.status, o.created_at,
                CASE WHEN ${POS} THEN 'POS' ELSE 'Website' END AS channel,
                TRIM(COALESCE(o.metadata->>'first_name', o.shipping_address->>'firstName', '') || ' ' ||
                     COALESCE(o.metadata->>'last_name', o.shipping_address->>'lastName', '')) AS customer,
                NULLIF(o.metadata->'reseller'->>'affiliate_code', '') AS affiliate_code
           FROM orders o
          WHERE o.created_at BETWEEN $1 AND $2
          ORDER BY o.created_at DESC
          LIMIT ${MAX_ORDERS}`,
        range
      ),
      query<PriorDay>(
        `SELECT COALESCE(SUM(total) FILTER (WHERE created_at >= ($1::date - 1) AND created_at < $1::date), 0)::float AS yesterday,
                COALESCE(SUM(total) FILTER (WHERE created_at >= ($1::date - 7) AND created_at < ($1::date - 6)), 0)::float AS last_week
           FROM orders
          WHERE payment_status = 'paid' AND created_at >= ($1::date - 7) AND created_at < $1::date`,
        [day]
      ),
    ]);

    const t = totals.rows[0] ?? EMPTY_TOTALS;
    const prior = previous.rows[0] ?? { yesterday: 0, last_week: 0 };

    const items = products.rows.map((p) => {
      const unitCost = p.unit_cost == null ? null : Number(p.unit_cost);
      const revenue = Number(p.revenue) || 0;
      const affiliateMarkup = Number(p.affiliate_markup) || 0;
      return {
        productId: p.product_id,
        name: p.name,
        units: Number(p.units) || 0,
        posUnits: Number(p.pos_units) || 0,
        webUnits: Number(p.web_units) || 0,
        revenue,
        affiliateMarkup,
        stockLeft: p.stock_left == null ? null : Number(p.stock_left),
        // Profit = what the customer paid − what the affiliate keeps − what the stock cost.
        profit: unitCost == null ? null : round2(revenue - affiliateMarkup - unitCost * (Number(p.units) || 0)),
      };
    });
    const costed = items.filter((i) => i.profit != null);
    const unitsSold = items.reduce((s, i) => s + i.units, 0);
    const revenue = Number(t.revenue) || 0;
    const affiliateOwed = Number(t.affiliate_owed) || 0;

    return NextResponse.json({
      day,
      canSeeProfit,
      summary: {
        paidOrders: Number(t.paid_orders) || 0,
        unpaidOrders: Number(t.unpaid_orders) || 0,
        cancelledOrders: Number(t.cancelled_orders) || 0,
        posOrders: Number(t.pos_orders) || 0,
        webOrders: Number(t.web_orders) || 0,
        affiliateOrders: Number(t.affiliate_orders) || 0,
        revenue,
        posRevenue: Number(t.pos_revenue) || 0,
        webRevenue: Number(t.web_revenue) || 0,
        netRevenue: round2(revenue - affiliateOwed),
        discounts: Number(t.discounts) || 0,
        affiliateOwed,
        toFulfil: Number(t.to_fulfil) || 0,
        unitsSold,
        averageOrder: Number(t.paid_orders) ? round2(revenue / Number(t.paid_orders)) : 0,
        profit: canSeeProfit && costed.length ? round2(costed.reduce((s, i) => s + (i.profit || 0), 0)) : null,
        profitCoverage: items.length ? costed.length / items.length : 0,
      },
      comparison: {
        yesterday: Number(prior.yesterday) || 0,
        lastWeek: Number(prior.last_week) || 0,
      },
      payments: payments.rows.map((p) => ({
        method: p.method,
        channel: p.channel,
        orders: Number(p.orders) || 0,
        revenue: Number(p.revenue) || 0,
      })),
      items: items.map((i) => (canSeeProfit ? i : { ...i, profit: null })),
      lowStock: items
        .filter((i) => i.stockLeft != null && i.stockLeft <= LOW_STOCK_AT)
        .map((i) => ({ name: i.name, stockLeft: i.stockLeft })),
      orders: orders.rows.map((o) => ({
        id: o.id,
        order_number: o.order_number,
        total: Number(o.total) || 0,
        payment_status: o.payment_status,
        payment_method: o.payment_method,
        status: o.status,
        created_at: o.created_at,
        channel: o.channel,
        customer: o.customer,
        affiliate_code: o.affiliate_code,
      })),
    });
  } catch (err) {
    console.error('[end-of-day]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Could not build the end of day report.' }, { status: 500 });
  }
}
