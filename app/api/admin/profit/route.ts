import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/pool';
import { verifyAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_COST_GHS = 1_000_000;
const MAX_SUPPLIER_LEN = 120;
const MAX_NOTES_LEN = 500;

type ProductRow = {
  id: string;
  name: string;
  sku: string | null;
  status: string;
  price: number;
  compare_at_price: number | null;
  quantity: number | null;
  category: string | null;
  image: string | null;
  min_variant_price: number | null;
  cost_price: number | null;
  fallback_cost: number | null;
  supplier_name: string | null;
  notes: string | null;
  cost_updated_at: string | null;
  units_sold_30d: number;
  affiliate_markup_rate: number | null;
};

/** Supplier costs are admin-only. Staff never see margins. */
async function requireAdminOnly(request: NextRequest) {
  const auth = await verifyAuth(request, { requireAdmin: true });
  if (!auth.authenticated) {
    return { error: NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 }), user: null };
  }
  if (auth.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Only admins can view supplier costs.' }, { status: 403 }), user: null };
  }
  return { error: null, user: auth.user as { id: string } };
}

export async function GET(request: NextRequest) {
  const gate = await requireAdminOnly(request);
  if (gate.error) return gate.error;

  try {
    const { rows } = await query<ProductRow>(
      `SELECT p.id, p.name, p.sku, p.status::text AS status, p.price::float AS price,
              p.compare_at_price::float AS compare_at_price, p.quantity, c.name AS category,
              (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY position NULLS LAST LIMIT 1) AS image,
              (SELECT MIN(v.price)::float FROM product_variants v WHERE v.product_id = p.id) AS min_variant_price,
              pc.cost_price::float AS cost_price,
              p.cost_per_item::float AS fallback_cost,
              pc.supplier_name, pc.notes, pc.updated_at AS cost_updated_at,
              COALESCE(sold.units, 0)::int AS units_sold_30d,
              NULLIF(p.metadata->>'affiliate_markup_rate', '')::float AS affiliate_markup_rate
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         LEFT JOIN product_costs pc ON pc.product_id = p.id
         LEFT JOIN (
           SELECT oi.product_id, SUM(oi.quantity) AS units
             FROM order_items oi JOIN orders o ON o.id = oi.order_id
            WHERE o.payment_status = 'paid' AND o.created_at > now() - interval '30 days'
            GROUP BY oi.product_id
         ) sold ON sold.product_id = p.id
        WHERE p.status <> 'archived'
        ORDER BY p.name`
    );

    const products = rows.map((p) => {
      const sellingPrice = Number(p.min_variant_price ?? p.price) || 0;
      const regularPrice = Number(p.compare_at_price) > sellingPrice ? Number(p.compare_at_price) : sellingPrice;
      const costPrice = p.cost_price ?? p.fallback_cost;
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        status: p.status,
        category: p.category,
        image: p.image,
        stock: p.quantity == null ? null : Number(p.quantity),
        regularPrice,
        sellingPrice,
        onPromotion: sellingPrice < regularPrice - 0.005,
        costPrice: costPrice == null ? null : Number(costPrice),
        costSource: p.cost_price != null ? 'supplier' : p.fallback_cost != null ? 'product' : null,
        supplierName: p.supplier_name,
        notes: p.notes,
        costUpdatedAt: p.cost_updated_at,
        unitsSold30d: Number(p.units_sold_30d) || 0,
        affiliateMarkupRate: p.affiliate_markup_rate,
      };
    });

    return NextResponse.json({ products });
  } catch (err) {
    console.error('[profit] load failed', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Could not load products.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const gate = await requireAdminOnly(request);
  if (gate.error) return gate.error;

  const body = await request.json().catch(() => ({}));
  const productId = typeof body?.productId === 'string' ? body.productId : '';
  if (!UUID.test(productId)) return NextResponse.json({ error: 'Pick a product.' }, { status: 400 });

  const supplierName = typeof body.supplierName === 'string' ? body.supplierName.trim().slice(0, MAX_SUPPLIER_LEN) : '';
  const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, MAX_NOTES_LEN) : '';

  try {
    if (body.costPrice === null || body.costPrice === '') {
      const { rowCount } = await query(`DELETE FROM product_costs WHERE product_id = $1`, [productId]);
      await logCostChange(gate.user!.id, productId, 'product_cost_cleared', { cleared: rowCount > 0 });
      return NextResponse.json({ message: 'Cost cleared.' });
    }

    const cost = Number(body.costPrice);
    if (!Number.isFinite(cost) || cost < 0 || cost > MAX_COST_GHS) {
      return NextResponse.json({ error: 'Enter what you paid the supplier, in cedis.' }, { status: 400 });
    }

    const { rows } = await query<{ name: string }>(
      `WITH saved AS (
         INSERT INTO product_costs (product_id, supplier_name, cost_price, notes, updated_by, updated_at)
         VALUES ($1, NULLIF($2, ''), $3, NULLIF($4, ''), $5, now())
         ON CONFLICT (product_id) DO UPDATE
           SET supplier_name = EXCLUDED.supplier_name, cost_price = EXCLUDED.cost_price,
               notes = EXCLUDED.notes, updated_by = EXCLUDED.updated_by, updated_at = now()
         RETURNING product_id
       )
       SELECT p.name FROM products p JOIN saved s ON s.product_id = p.id`,
      [productId, supplierName, Math.round(cost * 100) / 100, notes, gate.user!.id]
    );
    if (!rows[0]) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

    await logCostChange(gate.user!.id, productId, 'product_cost_updated', {
      label: rows[0].name,
      cost_price: Math.round(cost * 100) / 100,
      supplier_name: supplierName || null,
    });
    return NextResponse.json({ message: `Saved cost for ${rows[0].name}.` });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/foreign key|violates/i.test(message)) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }
    console.error('[profit] save failed', message);
    return NextResponse.json({ error: 'Could not save the cost.' }, { status: 500 });
  }
}

async function logCostChange(userId: string, productId: string, action: string, details: Record<string, unknown>) {
  try {
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action,
      entity_type: 'product_costs',
      entity_id: productId,
      details,
    });
  } catch (err) {
    console.warn('[profit] audit log skipped', err instanceof Error ? err.message : err);
  }
}
