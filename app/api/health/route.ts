import { NextResponse } from 'next/server';
import { isPlainPostgres } from '@/lib/db/mode';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const REQUIRED_TABLES = [
  'orders',
  'order_items',
  'products',
  'product_images',
  'profiles',
  'customers',
  'payment_events',
  'sms_messages',
  'schema_migrations',
] as const;

/**
 * Public health check — no secrets, hosts, or row data exposed.
 */
export async function GET() {
  const checks: Record<string, string> = {
    app: 'ok',
    mode: isPlainPostgres() ? 'plain_postgres' : 'supabase_hosted',
    database: 'unknown',
    schema: 'unknown',
    payment_moolre: process.env.MOOLRE_API_USER && process.env.MOOLRE_API_PUBKEY && process.env.MOOLRE_ACCOUNT_NUMBER
      ? 'configured'
      : 'missing',
    payment_paystack: process.env.PAYSTACK_SECRET_KEY ? 'configured' : 'absent',
    sms_moolre: process.env.MOOLRE_SMS_API_KEY || process.env.MOOLRE_API_KEY ? 'configured' : 'missing',
    callback_secret: process.env.MOOLRE_CALLBACK_SECRET ? 'configured' : 'missing',
    auth_jwt: process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET
      ? 'configured'
      : 'missing',
    email: process.env.RESEND_API_KEY ? 'configured' : 'missing',
  };

  if (isPlainPostgres()) {
    try {
      const { query } = await import('@/lib/db/pool');
      await query('SELECT 1 AS ok');
      checks.database = 'ok';

      const missingNames: string[] = [];
      for (const table of REQUIRED_TABLES) {
        const { rows } = await query<{ ok: string | null }>(
          `SELECT to_regclass($1) AS ok`,
          [`public.${table}`]
        );
        if (!rows[0]?.ok) missingNames.push(table);
      }
      checks.schema = missingNames.length ? `missing:${missingNames.join(',')}` : 'ok';
    } catch {
      checks.database = 'error';
      checks.schema = 'error';
    }
  } else {
    checks.database = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'supabase_url_set' : 'missing';
    checks.schema = 'n/a';
  }

  const healthy =
    checks.app === 'ok' &&
    checks.database === 'ok' &&
    (checks.schema === 'ok' || checks.schema === 'n/a');

  const degraded =
    healthy &&
    (checks.payment_moolre === 'missing' ||
      checks.sms_moolre === 'missing' ||
      checks.email === 'missing' ||
      checks.auth_jwt === 'missing');

  return NextResponse.json(
    {
      ok: healthy,
      status: !healthy ? 'unhealthy' : degraded ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: healthy ? 200 : 503 }
  );
}
