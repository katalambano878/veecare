import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request) {
    const auth = await verifyAuth(req, { requireAdmin: true });
    if (!auth.authenticated) {
        return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { data } = await supabaseAdmin
        .from('store_settings')
        .select('value, updated_at')
        .eq('key', 'store_wide_sale')
        .maybeSingle();

    const sale = data?.value as { active?: boolean; percent?: number; applied_at?: string } | null;

    return NextResponse.json({
        active: sale?.active === true,
        percent: sale?.percent ?? null,
        appliedAt: sale?.applied_at ?? data?.updated_at ?? null,
    });
}

export async function POST(req: Request) {
    const auth = await verifyAuth(req, { requireAdmin: true });
    if (!auth.authenticated) {
        return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const action = String(body.action || '');

        if (action === 'clear') {
            const { data, error } = await supabaseAdmin.rpc('clear_store_wide_discount');
            if (error) {
                console.error('[Sales] Clear error:', error.message);
                return NextResponse.json({ success: false, message: error.message }, { status: 500 });
            }
            return NextResponse.json({ success: true, ...data });
        }

        if (action === 'apply') {
            const percent = Number(body.percent);
            if (!percent || percent <= 0 || percent >= 100) {
                return NextResponse.json(
                    { success: false, message: 'Enter a discount between 1 and 99 percent.' },
                    { status: 400 }
                );
            }

            const { data, error } = await supabaseAdmin.rpc('apply_store_wide_discount', {
                p_percent: percent,
            });
            if (error) {
                console.error('[Sales] Apply error:', error.message);
                return NextResponse.json({ success: false, message: error.message }, { status: 500 });
            }
            return NextResponse.json({ success: true, ...data });
        }

        return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    } catch (err: unknown) {
        console.error('[Sales] Bulk discount error:', err);
        return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
    }
}
