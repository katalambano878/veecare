/**
 * One-off / ops: email every active affiliate their approval + referral link.
 * Run inside the app container so RESEND_API_KEY and DATABASE_URL are already set.
 */
import pg from 'pg';
import { Resend } from 'resend';

const SITE = (process.env.NEXT_PUBLIC_APP_URL || 'https://veecare.shop').replace(/\/$/, '');
const FROM =
  process.env.EMAIL_FROM ||
  process.env.RESEND_FROM_EMAIL ||
  'Vee Care Hera <info@veecare.shop>';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function maskEmail(email) {
  const [user, domain] = String(email).split('@');
  if (!domain) return '***';
  return `${user.slice(0, 2)}***@${domain}`;
}

function buildHtml(affiliate) {
  const name = escapeHtml(affiliate.name || 'there');
  const code = escapeHtml(String(affiliate.code || '').toUpperCase());
  const rate = Number(affiliate.commission_rate);
  const rateLabel = Number.isFinite(rate) ? `${rate}%` : 'your agreed';
  const referralLink = `${SITE}/?ref=${encodeURIComponent(String(affiliate.code || '').toUpperCase())}`;
  const portalUrl = `${SITE}/affiliate`;

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#2563eb,#064e3b);padding:32px 40px;text-align:center;">
<h1 style="margin:0;color:#ffffff;font-size:22px;">Vee Care Hera</h1>
<p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">Feminine Care &amp; Wellness</p>
</td></tr>
<tr><td style="padding:40px;">
<div style="text-align:center;margin-bottom:24px;">
  <h2 style="margin:0 0 4px;color:#111827;font-size:22px;">You're in, ${name}!</h2>
  <p style="margin:0;color:#6b7280;font-size:15px;">Your affiliate account is approved and active.</p>
</div>
<p style="color:#374151;font-size:14px;line-height:1.6;">
  Share your referral link and earn ${escapeHtml(rateLabel)} commission on every paid order from people you send to Vee Care Hera.
</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:12px;margin:20px 0;">
<tr><td style="padding:10px 16px;color:#6b7280;font-size:13px;">Your code</td><td style="padding:10px 16px;font-weight:600;">${code}</td></tr>
<tr><td style="padding:10px 16px;color:#6b7280;font-size:13px;">Commission</td><td style="padding:10px 16px;font-weight:600;">${escapeHtml(rateLabel)}</td></tr>
<tr><td style="padding:10px 16px;color:#6b7280;font-size:13px;">Referral link</td>
<td style="padding:10px 16px;"><a href="${escapeHtml(referralLink)}" style="color:#2563eb;word-break:break-all;">${escapeHtml(referralLink)}</a></td></tr>
</table>
<p style="color:#374151;font-size:14px;">Sign in at the affiliate page with this email and your code to track orders and earnings.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;"><tr>
<td style="background-color:#2563eb;border-radius:8px;">
<a href="${portalUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-weight:600;text-decoration:none;">Open Affiliate Dashboard</a>
</td></tr></table>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

if (!process.env.RESEND_API_KEY) {
  console.error('RESEND_API_KEY is missing');
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
const resend = new Resend(process.env.RESEND_API_KEY);

await client.connect();
const { rows } = await client.query(
  `SELECT id, name, email, code, commission_rate
   FROM affiliates
   WHERE status = 'active' AND email IS NOT NULL AND email <> ''
   ORDER BY name`
);
await client.end();

console.log(`Active affiliates to email: ${rows.length}`);

let sent = 0;
let failed = 0;
for (const affiliate of rows) {
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: affiliate.email,
      subject: "You're approved — start sharing your Vee Care Hera referral link",
      html: buildHtml(affiliate),
    });
    if (error) {
      failed += 1;
      console.error('FAILED', affiliate.code, error.message || 'send error');
    } else {
      sent += 1;
      console.log('SENT', affiliate.code, maskEmail(affiliate.email));
    }
  } catch (error) {
    failed += 1;
    console.error('FAILED', affiliate.code, error instanceof Error ? error.message : 'unknown');
  }
}

console.log(`Done. sent=${sent} failed=${failed} total=${rows.length}`);
if (failed) process.exit(2);
