import { NextResponse } from 'next/server';
import { isPlainPostgres } from '@/lib/db/mode';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Public health check — no secrets exposed.
 */
export async function GET() {
  const checks: Record<string, string> = {
    app: 'ok',
    mode: isPlainPostgres() ? 'plain_postgres' : 'supabase_hosted',
    database: 'unknown',
    payment_moolre: process.env.MOOLRE_API_USER && process.env.MOOLRE_API_PUBKEY && process.env.MOOLRE_ACCOUNT_NUMBER
      ? 'configured'
      : 'missing',
    sms_moolre: process.env.MOOLRE_SMS_API_KEY || process.env.MOOLRE_API_KEY ? 'configured' : 'missing',
    callback_secret: process.env.MOOLRE_CALLBACK_SECRET ? 'configured' : 'missing',
    auth_jwt: process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET
      ? 'configured'
      : 'missing',
  };

  if (isPlainPostgres()) {
    try {
      const { query } = await import('@/lib/db/pool');
      await query('SELECT 1 AS ok');
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }
  } else {
    checks.database = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'supabase_url_set' : 'missing';
  }

  const healthy = checks.app === 'ok' && checks.database !== 'error';
  return NextResponse.json(
    {
      ok: healthy,
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: healthy ? 200 : 503 }
  );
}
