import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
    DEFAULT_COMMISSION_RATE,
    isValidAffiliateCode,
    normalizeAffiliateCode,
    suggestAffiliateCode,
} from '@/lib/affiliate';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';

async function generateUniqueCode(name: string, preferred?: string): Promise<string | null> {
    const candidates: string[] = [];
    if (preferred && isValidAffiliateCode(preferred)) {
        candidates.push(normalizeAffiliateCode(preferred));
    }
    for (let i = 0; i < 8; i++) {
        candidates.push(suggestAffiliateCode(name));
    }

    for (const code of candidates) {
        const { data } = await supabaseAdmin
            .from('affiliates')
            .select('id')
            .eq('code', code)
            .maybeSingle();
        if (!data) return code;
    }
    return null;
}

export async function POST(req: Request) {
    try {
        const clientId = getClientIdentifier(req);
        const rateLimit = checkRateLimit(`affiliate-register:${clientId}`, {
            maxRequests: 5,
            windowSeconds: 3600,
        });
        if (!rateLimit.success) {
            return NextResponse.json({ error: 'Too many registration attempts. Try again later.' }, { status: 429 });
        }

        const body = await req.json();
        const name = String(body.name || '').trim();
        const email = String(body.email || '').trim().toLowerCase();
        const phone = String(body.phone || '').trim() || null;
        const preferredCode = body.code ? normalizeAffiliateCode(String(body.code)) : '';

        if (!name || name.length < 2) {
            return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 });
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
        }
        if (body.code && !isValidAffiliateCode(preferredCode)) {
            return NextResponse.json(
                { error: 'Referral code must be 3–20 letters or numbers.' },
                { status: 400 }
            );
        }

        const { data: existingByEmail } = await supabaseAdmin
            .from('affiliates')
            .select('id, status, code')
            .eq('email', email)
            .maybeSingle();

        if (existingByEmail) {
            if (existingByEmail.status === 'pending') {
                return NextResponse.json(
                    {
                        error: 'You already applied. We are reviewing your application.',
                        code: existingByEmail.code,
                    },
                    { status: 409 }
                );
            }
            if (existingByEmail.status === 'active') {
                return NextResponse.json(
                    { error: 'This email is already registered. Sign in to your dashboard.' },
                    { status: 409 }
                );
            }
            return NextResponse.json(
                { error: 'This email cannot be used. Please contact support.' },
                { status: 409 }
            );
        }

        const code = await generateUniqueCode(name, preferredCode || undefined);
        if (!code) {
            return NextResponse.json(
                { error: 'Could not create a referral code. Try a different code.' },
                { status: 409 }
            );
        }

        const { data: affiliate, error } = await supabaseAdmin
            .from('affiliates')
            .insert({
                code,
                name,
                email,
                phone,
                commission_rate: DEFAULT_COMMISSION_RATE,
                status: 'pending',
            })
            .select('id, code, name, email, status, commission_rate')
            .single();

        if (error) {
            if (error.message.includes('affiliates_code_key')) {
                return NextResponse.json({ error: 'That referral code is already taken.' }, { status: 409 });
            }
            console.error('[Affiliate] Register error:', error.message);
            return NextResponse.json({ error: 'Could not submit application.' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Application submitted! An admin will review and approve your account.',
            affiliate,
        });
    } catch (err: unknown) {
        console.error('[Affiliate] Register error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
