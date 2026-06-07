import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { normalizeAffiliateCode } from '@/lib/affiliate';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(req: Request) {
    try {
        const clientId = getClientIdentifier(req);
        const rateLimit = checkRateLimit(`affiliate-dash:${clientId}`, RATE_LIMITS.notification);
        if (!rateLimit.success) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        const { code, email } = await req.json();
        const normalizedCode = normalizeAffiliateCode(String(code || ''));
        const normalizedEmail = String(email || '').trim().toLowerCase();

        if (!normalizedCode || !normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return NextResponse.json({ error: 'Valid affiliate code and email required' }, { status: 400 });
        }

        const { data: affiliate, error } = await supabaseAdmin
            .from('affiliates')
            .select('id, code, name, email, commission_rate, status, total_orders, total_earned, total_paid, created_at')
            .eq('code', normalizedCode)
            .eq('email', normalizedEmail)
            .maybeSingle();

        if (error) {
            console.error('[Affiliate] Dashboard lookup error:', error.message);
            return NextResponse.json({ error: 'Could not load affiliate data' }, { status: 500 });
        }

        if (!affiliate) {
            return NextResponse.json({ error: 'No affiliate found with that code and email' }, { status: 404 });
        }

        const { data: commissions } = await supabaseAdmin
            .from('affiliate_commissions')
            .select('id, order_number, order_total, commission_amount, status, created_at')
            .eq('affiliate_id', affiliate.id)
            .order('created_at', { ascending: false })
            .limit(25);

        const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://veecare.shop').replace(/\/+$/, '');

        return NextResponse.json({
            affiliate: {
                ...affiliate,
                referralLink: `${siteUrl}/?ref=${affiliate.code}`,
                pendingBalance: Number(affiliate.total_earned) - Number(affiliate.total_paid),
            },
            commissions: commissions || [],
        });
    } catch (err: unknown) {
        console.error('[Affiliate] Dashboard error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
