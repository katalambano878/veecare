'use server';

import { verifyAdminToken } from '@/lib/auth';
import { getAdminRecipients, sendEmail } from '@/lib/notifications';
import { APP_TITLE, EMAIL_FROM_DEFAULT } from '@/lib/brand';

function resolveEmailFrom(): string {
    const raw = (
        process.env.EMAIL_FROM ||
        process.env.RESEND_FROM_EMAIL ||
        EMAIL_FROM_DEFAULT
    ).trim();
    if (!raw) return EMAIL_FROM_DEFAULT;
    if (raw.includes('<') && raw.includes('>')) return raw;
    return `${APP_TITLE} <${raw}>`;
}

export async function testEmailAction(to: string, subject: string, message: string, authToken: string) {
    const auth = await verifyAdminToken(authToken);
    if (!auth.authenticated) {
        return {
            success: false,
            error: 'Unauthorized: ' + (auth.error || 'Admin access required'),
        };
    }

    if (!process.env.RESEND_API_KEY) {
        return {
            success: false,
            error: 'Missing RESEND_API_KEY environment variable',
        };
    }

    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) {
        return { success: false, error: 'Invalid email address' };
    }

    if (!subject?.trim() || !message?.trim()) {
        return { success: false, error: 'Subject and message are required' };
    }

    const from = resolveEmailFrom();
    const adminRecipients = getAdminRecipients();

    const result = await sendEmail({
        to: to.trim(),
        subject: subject.trim(),
        html: `<p>${message.trim().replace(/\n/g, '<br>')}</p><p style="color:#6b7280;font-size:12px;">Test email from ${APP_TITLE} admin.</p>`,
    });

    if (result?.error) {
        const errMsg = result.error.message || JSON.stringify(result.error);
        const domainHint = errMsg.toLowerCase().includes('domain') || errMsg.toLowerCase().includes('verify')
            ? ' Verify your sending domain in the Resend dashboard and set EMAIL_FROM to an address on that domain.'
            : '';
        return {
            success: false,
            from,
            adminRecipients,
            result: result.error,
            error: `Resend rejected the email: ${errMsg}.${domainHint}`,
        };
    }

    return {
        success: true,
        from,
        adminRecipients,
        result: result.data,
        message: `Test email sent to ${to.trim()}`,
    };
}
