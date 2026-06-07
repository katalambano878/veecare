import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { escapeHtml } from '@/lib/sanitize';
import { APP_TITLE, EMAIL_FROM_DEFAULT, ADMIN_EMAIL_DEFAULT, CONTACT_PHONE, SUPPORT_EMAIL } from '@/lib/brand';

const resend = new Resend(process.env.RESEND_API_KEY || 'missing_api_key');

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

function addRecipient(emails: Set<string>, raw?: string | null) {
    const email = raw?.trim().toLowerCase();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emails.add(email);
    }
}

/** Admin inboxes that receive new-order, contact, and support alerts. */
export function getAdminRecipients(): string[] {
    const emails = new Set<string>();
    const rawList = process.env.ADMIN_EMAIL || ADMIN_EMAIL_DEFAULT;
    for (const part of rawList.split(/[,;]/)) {
        addRecipient(emails, part);
    }
    addRecipient(emails, process.env.MOOLRE_MERCHANT_EMAIL);
    addRecipient(emails, process.env.HUBTEL_MERCHANT_EMAIL);
    addRecipient(emails, SUPPORT_EMAIL);
    return [...emails];
}

type AdminEmailResult = {
    success: boolean;
    sent: number;
    failed: number;
    recipients: string[];
    errors: string[];
};

/** Send the same alert to every admin inbox individually so one bad address cannot block the rest. */
export async function sendEmailToAdmins({
    subject,
    html,
}: {
    subject: string;
    html: string;
}): Promise<AdminEmailResult> {
    const recipients = getAdminRecipients();
    if (recipients.length === 0) {
        console.warn('[Email] No admin recipients configured');
        return { success: false, sent: 0, failed: 0, recipients: [], errors: ['No admin recipients configured'] };
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const to of recipients) {
        const result = await sendEmail({ to, subject, html });
        if (result?.error) {
            failed++;
            const msg = result.error.message || JSON.stringify(result.error);
            errors.push(`${maskEmail(to)}: ${msg}`);
            console.error('[Email] Admin alert failed for', maskEmail(to), '|', msg);
        } else {
            sent++;
        }
    }

    if (sent > 0) {
        console.log('[Email] Admin alert sent to', sent, 'of', recipients.length, 'inboxes');
    }

    return { success: failed === 0 && sent > 0, sent, failed, recipients, errors };
}

async function markOrderNotificationSent(orderId: string, field: 'customer_email_sent_at' | 'admin_email_sent_at') {
    const { data: order } = await supabaseAdmin
        .from('orders')
        .select('metadata')
        .eq('id', orderId)
        .single();

    const metadata = {
        ...(order?.metadata as Record<string, unknown> | null ?? {}),
        [field]: new Date().toISOString(),
    };

    await supabaseAdmin
        .from('orders')
        .update({ metadata })
        .eq('id', orderId);
}

/** Retry order emails when payment succeeded but a prior notification attempt failed. */
export async function retryOrderNotificationsIfNeeded(orderRef: string) {
    const { data: order, error } = await supabaseAdmin
        .from('orders')
        .select('id, order_number, payment_status, metadata')
        .eq('order_number', orderRef)
        .single();

    if (error || !order) {
        console.warn('[Notification] Cannot retry notifications — order not found:', orderRef);
        return;
    }

    if (order.payment_status !== 'paid') {
        return;
    }

    const metadata = (order.metadata ?? {}) as Record<string, unknown>;
    if (metadata.admin_email_sent_at) {
        return;
    }

    console.log('[Notification] Retrying missed order emails for:', order.order_number);
    await sendOrderConfirmation(order);
}

function maskEmail(email: string): string {
    const [user, domain] = email.split('@');
    if (!domain) return '***';
    return `${user.slice(0, 2)}***@${domain}`;
}
const BRAND = {
    name: APP_TITLE,
    color: '#2563eb',
    colorLight: '#eff6ff',
    colorDark: '#064e3b',
    url: (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, ''),
    phone: CONTACT_PHONE,
};

// Reusable branded email layout
export function emailLayout(body: string, preheader?: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${BRAND.name}</title>
${preheader ? `<span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>` : ''}
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,${BRAND.color},${BRAND.colorDark});padding:32px 40px;text-align:center;">
<h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">${BRAND.name}</h1>
<p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">Feminine Care &amp; Wellness</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:40px 40px 32px;">
${body}
</td></tr>

<!-- Footer -->
<tr><td style="background-color:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="text-align:center;">
<p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Need help? Contact us at <a href="tel:${BRAND.phone}" style="color:${BRAND.color};text-decoration:none;">${BRAND.phone}</a></p>
<p style="margin:0 0 12px;color:#6b7280;font-size:13px;"><a href="${BRAND.url}" style="color:${BRAND.color};text-decoration:none;">Visit our store</a> &nbsp;·&nbsp; <a href="${BRAND.url}/order-tracking" style="color:${BRAND.color};text-decoration:none;">Track order</a></p>
<p style="margin:0;color:#9ca3af;font-size:11px;">&copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.</p>
</td></tr>
</table>
</td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

// Reusable styled button
function emailButton(text: string, href: string, color?: string): string {
    const bg = color || BRAND.color;
    return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;"><tr>
<td style="background-color:${bg};border-radius:8px;"><a href="${href}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">${text}</a></td>
</tr></table>`;
}

// Reusable info row
function emailInfoRow(label: string, value: string): string {
    return `<tr>
<td style="padding:10px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6;width:40%;">${label}</td>
<td style="padding:10px 16px;color:#111827;font-size:14px;font-weight:600;border-bottom:1px solid #f3f4f6;">${value}</td>
</tr>`;
}

// Shipping notes block
function emailShippingNotes(notes: string[]): string {
    if (notes.length === 0) return '';
    return `<div style="background-color:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:14px 16px;margin:20px 0;">
<p style="font-weight:600;color:#92400e;margin:0 0 6px;font-size:13px;">&#9200; Shipping Notes</p>
${notes.map((n) => `<p style="color:#78350f;margin:3px 0;font-size:13px;">${escapeHtml(n)}</p>`).join('')}
</div>`;
}

type OrderItemRow = {
    id: string;
    product_name: string;
    variant_name: string | null;
    sku: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    metadata?: { image?: string; slug?: string; preorder_shipping?: string | null };
    products?: { product_images?: { url: string; position?: number }[] } | null;
};

function formatMoney(amount: number): string {
    return `GH\u20B5${Number(amount).toFixed(2)}`;
}

function getCustomerName(order: Record<string, unknown>, shippingAddress?: Record<string, unknown> | null): string {
    const addr = shippingAddress ?? (order.shipping_address as Record<string, unknown> | null);
    if (addr?.full_name) return String(addr.full_name);
    if (addr?.fullName) return String(addr.fullName);
    if (addr?.firstName) {
        return addr.lastName ? `${addr.firstName} ${addr.lastName}` : String(addr.firstName);
    }
    const meta = order.metadata as Record<string, unknown> | undefined;
    if (meta?.first_name) {
        return meta.last_name ? `${meta.first_name} ${meta.last_name}` : String(meta.first_name);
    }
    return 'Customer';
}

function getItemImage(item: OrderItemRow): string {
    if (item.metadata?.image) return item.metadata.image;
    const images = item.products?.product_images ?? [];
    const sorted = [...images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    return sorted[0]?.url || 'https://via.placeholder.com/128?text=Product';
}

function emailSectionTitle(title: string): string {
    return `<h3 style="margin:28px 0 12px;color:#111827;font-size:16px;font-weight:700;border-bottom:2px solid #e5e7eb;padding-bottom:8px;">${escapeHtml(title)}</h3>`;
}

function formatShippingAddressBlock(addr: Record<string, unknown> | null | undefined): string {
    if (!addr) {
        return '<p style="color:#6b7280;font-size:14px;margin:0;">No shipping address provided.</p>';
    }

    const lines: string[] = [];
    const name = [addr.firstName, addr.lastName].filter(Boolean).join(' ')
        || (addr.full_name as string)
        || (addr.fullName as string);
    if (name) lines.push(String(name));
    if (addr.address || addr.address1) lines.push(String(addr.address || addr.address1));
    if (addr.address2) lines.push(String(addr.address2));
    const cityRegion = [addr.city, addr.region || addr.state].filter(Boolean).join(', ');
    if (cityRegion) lines.push(cityRegion);
    if (addr.country) lines.push(String(addr.country));
    if (addr.phone) lines.push(`Phone: ${addr.phone}`);
    if (addr.email) lines.push(`Email: ${addr.email}`);

    return lines
        .map((line) => `<p style="margin:0 0 4px;color:#374151;font-size:14px;line-height:1.5;">${escapeHtml(line)}</p>`)
        .join('');
}

function emailOrderItemsHtml(items: OrderItemRow[]): string {
    if (!items.length) {
        return '<p style="color:#6b7280;font-size:14px;margin:0;">No items found.</p>';
    }

    const rows = items.map((item) => {
        const image = escapeHtml(getItemImage(item));
        const name = escapeHtml(item.product_name);
        const variant = item.variant_name ? escapeHtml(item.variant_name) : '';
        const sku = item.sku ? escapeHtml(item.sku) : '';
        const preorder = item.metadata?.preorder_shipping
            ? escapeHtml(String(item.metadata.preorder_shipping))
            : '';
        const unitPrice = formatMoney(Number(item.unit_price));

        return `
<tr>
  <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;vertical-align:top;width:72px;">
    <img src="${image}" alt="${name}" width="64" height="64" style="display:block;width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb;background:#f9fafb;" />
  </td>
  <td style="padding:12px 8px;border-bottom:1px solid #f3f4f6;vertical-align:top;">
    <p style="margin:0 0 4px;color:#111827;font-size:14px;font-weight:600;">${name}</p>
    <p style="margin:0 0 2px;color:#6b7280;font-size:12px;">${unitPrice} each</p>
    ${variant ? `<p style="margin:0 0 2px;color:#6b7280;font-size:12px;">Variant: ${variant}</p>` : ''}
    ${sku ? `<p style="margin:0 0 2px;color:#6b7280;font-size:12px;">SKU: ${sku}</p>` : ''}
    ${preorder ? `<p style="margin:6px 0 0;color:#92400e;font-size:11px;background:#fffbeb;padding:4px 8px;border-radius:4px;display:inline-block;">&#9200; ${preorder}</p>` : ''}
  </td>
  <td style="padding:12px 4px;border-bottom:1px solid #f3f4f6;vertical-align:top;text-align:center;color:#374151;font-size:13px;white-space:nowrap;">&times;${item.quantity}</td>
  <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;vertical-align:top;text-align:right;color:#111827;font-size:14px;font-weight:600;white-space:nowrap;">${formatMoney(Number(item.total_price))}</td>
</tr>`;
    }).join('');

    return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0;">
  <thead>
    <tr>
      <td colspan="2" style="padding:0 0 8px;color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Product</td>
      <td style="padding:0 0 8px;color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">Qty</td>
      <td style="padding:0 0 8px;color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;text-align:right;">Total</td>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>`;
}

function emailOrderTotalsHtml(order: Record<string, unknown>): string {
    const subtotal = Number(order.subtotal ?? 0);
    const shipping = Number(order.shipping_total ?? 0);
    const tax = Number(order.tax_total ?? 0);
    const discount = Number(order.discount_total ?? 0);
    const total = Number(order.total ?? 0);

    const rows: [string, number][] = [['Subtotal', subtotal]];
    if (shipping > 0) rows.push(['Shipping', shipping]);
    if (tax > 0) rows.push(['Tax', tax]);
    if (discount > 0) rows.push(['Discount', -discount]);

    const body = rows.map(([label, val]) => `
<tr>
  <td style="padding:6px 0;color:#6b7280;font-size:13px;">${label}</td>
  <td style="padding:6px 0;text-align:right;color:#374151;font-size:13px;">${val < 0 ? '-' : ''}${formatMoney(Math.abs(val))}</td>
</tr>`).join('');

    return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;border-top:2px solid #e5e7eb;padding-top:8px;">
  ${body}
  <tr>
    <td style="padding:10px 0 0;color:#111827;font-size:15px;font-weight:700;">Order Total</td>
    <td style="padding:10px 0 0;text-align:right;color:#111827;font-size:18px;font-weight:700;">${formatMoney(total)}</td>
  </tr>
</table>`;
}

async function fetchOrderEmailDetails(orderId: string) {
    const { data: fullOrder, error: orderError } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (orderError || !fullOrder) {
        console.warn('[Notification] Could not refetch order:', orderError?.message);
        return { fullOrder: null, items: [] as OrderItemRow[] };
    }

    const { data: items, error: itemsError } = await supabaseAdmin
        .from('order_items')
        .select(`
            id,
            product_name,
            variant_name,
            sku,
            quantity,
            unit_price,
            total_price,
            metadata,
            products(product_images(url, position))
        `)
        .eq('order_id', orderId);

    if (itemsError) {
        console.warn('[Notification] Could not fetch order items:', itemsError.message);
    }

    return {
        fullOrder,
        items: (items ?? []) as OrderItemRow[],
    };
}

// Helper to mask sensitive data in logs
function maskPhone(phone: string): string {
    if (!phone || phone.length < 6) return '***';
    return phone.slice(0, 4) + '****' + phone.slice(-2);
}

export async function sendEmail({
    to,
    subject,
    html,
}: {
    to: string | string[];
    subject: string;
    html: string;
}) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[Email] RESEND_API_KEY not configured — skipping send');
        return { error: { message: 'RESEND_API_KEY not configured' } };
    }

    const recipients = (Array.isArray(to) ? to : [to]).map((e) => e.trim()).filter(Boolean);
    if (recipients.length === 0) {
        console.warn('[Email] No recipients provided');
        return { error: { message: 'No recipients provided' } };
    }

    const from = resolveEmailFrom();

    try {
        const { data, error } = await resend.emails.send({
            from,
            to: recipients,
            subject,
            html,
        });

        if (error) {
            console.error(
                '[Email] Resend rejected send:',
                error.message || JSON.stringify(error),
                '| from:',
                from,
                '| to:',
                recipients.map(maskEmail).join(', '),
            );
            return { error };
        }

        console.log(
            '[Email] Sent id:',
            data?.id,
            '| from:',
            from,
            '| to:',
            recipients.map(maskEmail).join(', '),
        );
        return { data };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown email error';
        console.error('[Email] Exception:', message);
        return { error: { message } };
    }
}

// Helper to format phone number for SMS (Ghana specific for now)
// Helper to format phone number for SMS (Ghana specific for now)
function formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters (including + for now)
    let cleaned = phone.replace(/\D/g, '');

    // If starts with 0 (e.g. 024...), replace 0 with 233
    if (cleaned.startsWith('0')) {
        cleaned = '233' + cleaned.substring(1);
    }

    // If length is 9 (e.g. 24...), prepend 233
    if (cleaned.length === 9) {
        cleaned = '233' + cleaned;
    }

    // Ensure it starts with correct country code before prepending +
    if (!cleaned.startsWith('233') && cleaned.length === 12) {
        // Assuming it's some other format, but if it starts with 233, it's fine.
    }

    // Return with + prefix as per E.164
    return '+' + cleaned;
}

export async function sendSMS({ to, message }: { to: string; message: string }) {
    // Moolre SMS API only requires X-API-VASKEY header for authentication
    // See: https://docs.moolre.com/#/send-sms
    // Allow MOOLRE_SMS_API_KEY or fall back to MOOLRE_API_KEY
    const smsVasKey = process.env.MOOLRE_SMS_API_KEY || process.env.MOOLRE_API_KEY;

    if (!smsVasKey) {
        console.warn('[SMS] Missing MOOLRE_SMS_API_KEY or MOOLRE_API_KEY');
        return null;
    }

    const recipient = formatPhoneNumber(to);

    try {
        console.log(`[SMS] Sending to ${maskPhone(recipient)}`);
        const response = await fetch('https://api.moolre.com/open/sms/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-VASKEY': smsVasKey
            },
            body: JSON.stringify({
                type: 1,
                senderid: process.env.MOOLRE_SMS_SENDER_ID || 'VEECARE',
                messages: [
                    {
                        recipient: recipient,
                        message: message
                    }
                ]
            })
        });

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            const text = await response.text();
            console.error('[SMS] Non-JSON response:', text.slice(0, 200));
            return { status: 0, error: text.slice(0, 200) };
        }

        const result = await response.json();
        console.log('[SMS] Result:', result.status === 1 ? 'Success' : 'Failed', '| Code:', result.code);
        if (result.status !== 1) {
            console.log('[SMS] Full Response:', JSON.stringify(result, null, 2));
        }
        return result;
    } catch (error: any) {
        console.error('[SMS] Error:', error.message);
        return null;
    }
}

export async function sendOrderConfirmation(order: any) {
    const orderId = order.id;
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');

    const { fullOrder, items } = orderId
        ? await fetchOrderEmailDetails(orderId)
        : { fullOrder: null, items: [] as OrderItemRow[] };

    const o = (fullOrder ?? order) as Record<string, unknown>;
    const email = String(o.email ?? order.email ?? '');
    const orderNumber = String(o.order_number ?? order.order_number ?? orderId);
    const createdAt = String(o.created_at ?? order.created_at ?? new Date().toISOString());
    const shippingAddress = (o.shipping_address ?? order.shipping_address) as Record<string, unknown> | null;
    const metadata = (o.metadata ?? order.metadata) as Record<string, unknown> | undefined;
    const name = getCustomerName(o, shippingAddress);
    const phone = String(o.phone ?? order.phone ?? shippingAddress?.phone ?? '');
    const trackingNumber = String(metadata?.tracking_number ?? '');
    const trackingUrl = `${baseUrl}/order-tracking?order=${orderNumber}`;
    const orderDate = new Date(createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const shippingNotes: string[] = [];
    for (const item of items) {
        const preorder = item.metadata?.preorder_shipping;
        if (preorder) shippingNotes.push(`${item.product_name}: ${preorder}`);
    }
    const shippingNotesSms = shippingNotes.length > 0
        ? ` Note: ${shippingNotes.join('; ')}.`
        : '';

    const paymentMethod = String(o.payment_method ?? metadata?.payment_method ?? 'Online');
    const paymentStatus = String(o.payment_status ?? 'paid');
    const shippingMethod = String(o.shipping_method ?? 'Standard delivery');
    const orderStatus = String(o.status ?? 'processing');
    const orderNotes = o.notes ? String(o.notes) : '';

    console.log(
        `[Notification] Preparing for Order #${orderNumber} | Items: ${items.length} | Phone: ${phone ? 'Present' : 'Missing'}`,
    );

    const itemsHtml = emailOrderItemsHtml(items);
    const totalsHtml = emailOrderTotalsHtml(o);
    const shippingHtml = formatShippingAddressBlock(shippingAddress);
    const notificationMeta = (metadata ?? {}) as Record<string, unknown>;
    const customerAlreadySent = Boolean(notificationMeta.customer_email_sent_at);
    const adminAlreadySent = Boolean(notificationMeta.admin_email_sent_at);

    // 1. Email to Customer
    const customerEmailHtml = emailLayout(`
<div style="text-align:center;margin-bottom:24px;">
  <div style="width:64px;height:64px;background-color:${BRAND.colorLight};border-radius:50%;margin:0 auto 16px;line-height:64px;font-size:28px;">&#10003;</div>
  <h2 style="margin:0 0 4px;color:#111827;font-size:24px;">Order Confirmed!</h2>
  <p style="margin:0;color:#6b7280;font-size:15px;">Thank you for your purchase, ${escapeHtml(name)}.</p>
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:12px;overflow:hidden;margin:20px 0;">
  ${emailInfoRow('Order Number', `#${escapeHtml(orderNumber)}`)}
  ${emailInfoRow('Order Date', escapeHtml(orderDate))}
  ${trackingNumber ? emailInfoRow('Tracking', escapeHtml(trackingNumber)) : ''}
  ${emailInfoRow('Payment', escapeHtml(`${paymentMethod} (${paymentStatus})`))}
</table>

${emailSectionTitle('Your Items')}
${itemsHtml}
${totalsHtml}

${emailSectionTitle('Delivery Details')}
${shippingHtml}
<p style="margin:8px 0 0;color:#6b7280;font-size:13px;">Delivery method: <strong>${escapeHtml(shippingMethod)}</strong></p>

${emailShippingNotes(shippingNotes)}

<p style="color:#374151;font-size:14px;line-height:1.6;margin:16px 0;">We're getting your order ready. You'll receive updates as it's processed and packaged.</p>

${emailButton('Track Your Order', trackingUrl)}

<p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">Or copy this link: <a href="${trackingUrl}" style="color:${BRAND.color};">${trackingUrl}</a></p>
`, `Your order #${orderNumber} is confirmed!`);

    if (email && !customerAlreadySent) {
        const customerEmailResult = await sendEmail({
            to: email,
            subject: `Order Confirmed! #${orderNumber}`,
            html: customerEmailHtml,
        });
        if (customerEmailResult?.error) {
            console.error('[Notification] Customer confirmation email failed for order', orderNumber);
        } else if (orderId) {
            await markOrderNotificationSent(orderId, 'customer_email_sent_at');
        }
    }

    // 2. Email to Admin — full order breakdown
    const adminEmailHtml = emailLayout(`
<h2 style="margin:0 0 8px;color:#111827;font-size:22px;">&#128230; New Order Received</h2>
<p style="margin:0 0 20px;color:#6b7280;font-size:14px;">A customer has paid and this order is ready to fulfil.</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:12px;overflow:hidden;margin:0 0 8px;">
  ${emailInfoRow('Order', `#${escapeHtml(orderNumber)}`)}
  ${emailInfoRow('Date', escapeHtml(orderDate))}
  ${emailInfoRow('Status', escapeHtml(orderStatus))}
  ${emailInfoRow('Payment', escapeHtml(`${paymentMethod} — ${paymentStatus}`))}
  ${trackingNumber ? emailInfoRow('Tracking', escapeHtml(trackingNumber)) : ''}
</table>

${emailSectionTitle('Customer')}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:12px;overflow:hidden;margin:0 0 8px;">
  ${emailInfoRow('Name', escapeHtml(name))}
  ${emailInfoRow('Email', `<a href="mailto:${escapeHtml(email)}" style="color:${BRAND.color};text-decoration:none;">${escapeHtml(email)}</a>`)}
  ${phone ? emailInfoRow('Phone', `<a href="tel:${escapeHtml(phone.replace(/\s/g, ''))}" style="color:${BRAND.color};text-decoration:none;">${escapeHtml(phone)}</a>`) : ''}
</table>

${emailSectionTitle('Shipping Address')}
<div style="background-color:#f9fafb;border-radius:12px;padding:16px;margin-bottom:8px;">
  ${shippingHtml}
  <p style="margin:10px 0 0;color:#6b7280;font-size:13px;">Method: <strong>${escapeHtml(shippingMethod)}</strong></p>
</div>

${emailSectionTitle('Order Items')}
${itemsHtml}
${totalsHtml}

${orderNotes ? `${emailSectionTitle('Customer Notes')}<p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">${escapeHtml(orderNotes)}</p>` : ''}

${emailShippingNotes(shippingNotes)}

${emailButton('View &amp; Manage Order', `${baseUrl}/admin/orders/${orderId}`)}
`, `New order #${orderNumber} from ${name} — ${formatMoney(Number(o.total ?? 0))}`);

    if (!adminAlreadySent) {
        const adminEmailResult = await sendEmailToAdmins({
            subject: `New Order #${orderNumber} — ${formatMoney(Number(o.total ?? 0))}`,
            html: adminEmailHtml,
        });
        if (!adminEmailResult.success) {
            console.error(
                '[Notification] Admin order email failed for order',
                orderNumber,
                '| sent:',
                adminEmailResult.sent,
                '| failed:',
                adminEmailResult.failed,
                adminEmailResult.errors.join('; ') || '',
            );
        } else if (orderId) {
            await markOrderNotificationSent(orderId, 'admin_email_sent_at');
        }
    }

    // 3. SMS to Customer (if phone exists)
    if (phone) {
        const smsMessage = trackingNumber
            ? `Hi ${name}, your order #${orderNumber} is confirmed! Tracking: ${trackingNumber}. Track here: ${trackingUrl}${shippingNotesSms}`
            : `Hi ${name}, your order #${orderNumber} at ${APP_TITLE} is confirmed! Track here: ${trackingUrl}${shippingNotesSms}`;

        await sendSMS({
            to: phone,
            message: smsMessage,
        });
    }
}

export async function sendOrderStatusUpdate(order: any, newStatus: string) {
    const { id, email, phone: orderPhone, shipping_address, order_number, metadata } = order;

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');

    // Build customer name from available sources
    const getName = () => {
        if (shipping_address?.full_name) return shipping_address.full_name;
        if (shipping_address?.firstName) {
            return shipping_address.lastName
                ? `${shipping_address.firstName} ${shipping_address.lastName}`
                : shipping_address.firstName;
        }
        if (metadata?.first_name) {
            return metadata.last_name
                ? `${metadata.first_name} ${metadata.last_name}`
                : metadata.first_name;
        }
        return 'Customer';
    };
    const name = getName();
    const phone = orderPhone || shipping_address?.phone;
    const trackingNumber = metadata?.tracking_number || '';
    const trackingUrl = `${baseUrl}/order-tracking?order=${order_number || id}`;

    console.log(`[Notification] Status update for Order #${order_number} to ${newStatus} | Tracking: ${trackingNumber}`);

    const subject = `Order Update #${order_number || id}`;
    let message = `Your order #${order_number || id} status has been updated to ${newStatus}.`;
    let smsMessage = message;

    if (newStatus === 'shipped') {
        message = `Good news! Your order #${order_number || id} has been packaged and is ready.`;
        smsMessage = trackingNumber
            ? `Good news ${name}! Order #${order_number || id} has been packaged. Tracking: ${trackingNumber}. Track: ${trackingUrl}`
            : `Good news ${name}! Order #${order_number || id} has been packaged. Track: ${trackingUrl}`;
    } else if (newStatus === 'delivered') {
        message = `Your order #${order_number || id} has been delivered. Enjoy!`;
        smsMessage = `Hi ${name}, your order #${order_number || id} has been delivered. Enjoy your purchase!`;
    } else if (newStatus === 'processing') {
        smsMessage = trackingNumber
            ? `Hi ${name}, your order #${order_number || id} is being processed. Tracking: ${trackingNumber}. Track: ${trackingUrl}`
            : `Hi ${name}, your order #${order_number || id} is being processed. Track: ${trackingUrl}`;
    } else {
        smsMessage = `Hi ${name}, order #${order_number || id} status: ${newStatus}. Track: ${trackingUrl}`;
    }

    // Status icons/colors
    const statusConfig: Record<string, { icon: string; color: string; bg: string }> = {
        processing: { icon: '&#9881;', color: '#2563eb', bg: '#eff6ff' },
        shipped: { icon: '&#128666;', color: '#2563eb', bg: '#eff6ff' },
        delivered: { icon: '&#127881;', color: '#16a34a', bg: '#f0fdf4' },
        cancelled: { icon: '&#10060;', color: '#dc2626', bg: '#fef2f2' },
    };
    const sc = statusConfig[newStatus] || { icon: '&#128276;', color: '#6b7280', bg: '#f9fafb' };

    await sendEmail({
        to: email,
        subject: subject,
        html: emailLayout(`
<div style="text-align:center;margin-bottom:24px;">
  <div style="width:64px;height:64px;background-color:${sc.bg};border-radius:50%;margin:0 auto 16px;line-height:64px;font-size:28px;">${sc.icon}</div>
  <h2 style="margin:0 0 4px;color:#111827;font-size:22px;">Order Update</h2>
  <p style="margin:0;color:#6b7280;font-size:14px;">Hi ${name}, here's an update on your order.</p>
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:12px;overflow:hidden;margin:20px 0;">
  ${emailInfoRow('Order Number', `#${order_number || id}`)}
  ${emailInfoRow('New Status', `<span style="display:inline-block;background-color:${sc.bg};color:${sc.color};padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;">${newStatus}</span>`)}
  ${trackingNumber ? emailInfoRow('Tracking Number', trackingNumber) : ''}
</table>

<p style="color:#374151;font-size:14px;line-height:1.6;margin:16px 0;">${message}</p>

${emailButton('Track Your Order', trackingUrl)}
`, `Your order #${order_number} is now ${newStatus}`)
    });

    // SMS
    if (phone) {
        await sendSMS({
            to: phone,
            message: smsMessage
        });
    }
}

export async function sendWelcomeMessage(user: { email: string, firstName: string, phone?: string }) {
    const { email, firstName, phone } = user;

    // Email
    await sendEmail({
        to: email,
        subject: `Welcome to ${BRAND.name}!`,
        html: emailLayout(`
<div style="text-align:center;margin-bottom:24px;">
  <div style="width:64px;height:64px;background-color:${BRAND.colorLight};border-radius:50%;margin:0 auto 16px;line-height:64px;font-size:28px;">&#128075;</div>
  <h2 style="margin:0 0 4px;color:#111827;font-size:24px;">Welcome, ${firstName}!</h2>
  <p style="margin:0;color:#6b7280;font-size:15px;">We're so glad you're here.</p>
</div>

<p style="color:#374151;font-size:14px;line-height:1.7;margin:16px 0;">Thank you for joining the ${BRAND.name} family. Feminine care, hygiene, and wellness — made for everyday women across Ghana.</p>

<div style="background-color:#f9fafb;border-radius:12px;padding:20px;margin:20px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="text-align:center;padding:8px;width:33%;">
        <p style="font-size:20px;margin:0 0 4px;">&#128666;</p>
        <p style="color:#374151;font-size:12px;font-weight:600;margin:0;">Free Pickup</p>
        <p style="color:#9ca3af;font-size:11px;margin:2px 0 0;">Available in store</p>
      </td>
      <td style="text-align:center;padding:8px;width:33%;">
        <p style="font-size:20px;margin:0 0 4px;">&#9989;</p>
        <p style="color:#374151;font-size:12px;font-weight:600;margin:0;">Verified Quality</p>
        <p style="color:#9ca3af;font-size:11px;margin:2px 0 0;">Hand-inspected</p>
      </td>
      <td style="text-align:center;padding:8px;width:33%;">
        <p style="font-size:20px;margin:0 0 4px;">&#128176;</p>
        <p style="color:#374151;font-size:12px;font-weight:600;margin:0;">Best Prices</p>
        <p style="color:#9ca3af;font-size:11px;margin:2px 0 0;">Unbeatable value</p>
      </td>
    </tr>
  </table>
</div>

${emailButton('Start Shopping', `${BRAND.url}/shop`)}
`, `Welcome to ${BRAND.name}, ${firstName}!`)
    });

    // SMS
    if (phone) {
        await sendSMS({
            to: phone,
            message: `Welcome ${firstName}! Thanks for joining ${APP_TITLE}.`
        });
    }
}

export async function sendPaymentLink(order: any) {
    const { id, email, phone: orderPhone, shipping_address, total, order_number, metadata } = order;

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const paymentUrl = `${baseUrl}/pay/${id}`;

    // Build customer name from available sources
    const getName = () => {
        if (shipping_address?.full_name) return shipping_address.full_name;
        if (shipping_address?.firstName) {
            return shipping_address.lastName
                ? `${shipping_address.firstName} ${shipping_address.lastName}`
                : shipping_address.firstName;
        }
        if (metadata?.first_name) {
            return metadata.last_name
                ? `${metadata.first_name} ${metadata.last_name}`
                : metadata.first_name;
        }
        return 'Customer';
    };
    const name = getName();
    const phone = orderPhone || shipping_address?.phone;

    console.log(`[Notification] Sending payment link for Order #${order_number} | Phone: ${phone ? 'Present' : 'Missing'}`);

    // Email with payment link
    await sendEmail({
        to: email,
        subject: `Complete Your Order #${order_number}`,
        html: emailLayout(`
<div style="text-align:center;margin-bottom:24px;">
  <div style="width:64px;height:64px;background-color:#fef3c7;border-radius:50%;margin:0 auto 16px;line-height:64px;font-size:28px;">&#128179;</div>
  <h2 style="margin:0 0 4px;color:#111827;font-size:22px;">Complete Your Order</h2>
  <p style="margin:0;color:#6b7280;font-size:14px;">Hi ${name}, your order is waiting for payment.</p>
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:12px;overflow:hidden;margin:20px 0;">
  ${emailInfoRow('Order Number', `#${order_number}`)}
  ${emailInfoRow('Amount Due', `<span style="color:${BRAND.color};font-size:18px;font-weight:700;">GH₵${Number(total).toFixed(2)}</span>`)}
</table>

<p style="color:#374151;font-size:14px;line-height:1.6;margin:16px 0;">Click the button below to securely complete your payment. This link will remain active until your order is completed or cancelled.</p>

${emailButton('Pay Now: GH₵' + Number(total).toFixed(2), paymentUrl, '#d97706')}

<p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">Or copy this link: <a href="${paymentUrl}" style="color:${BRAND.color};">${paymentUrl}</a></p>
`, `Complete payment for order #${order_number}`)
    });

    // SMS with payment link
    if (phone) {
        const smsMessage = `Hi ${name}, complete your order #${order_number} (GH₵${Number(total).toFixed(2)}) here: ${paymentUrl}`;

        await sendSMS({
            to: phone,
            message: smsMessage
        });
    }
}

export async function sendContactMessage(data: {
    name: string;
    email?: string;
    phone?: string;
    subject: string;
    message: string;
}) {
    const { name, email, phone, subject, message } = data;

    const safeName = escapeHtml(name);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message);
    const safeEmail = email ? escapeHtml(email) : '';
    const safePhone = phone ? escapeHtml(phone) : '';

    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        await sendEmail({
            to: email,
            subject: `We received your message: ${subject}`,
            html: emailLayout(`
<div style="text-align:center;margin-bottom:24px;">
  <div style="width:64px;height:64px;background-color:${BRAND.colorLight};border-radius:50%;margin:0 auto 16px;line-height:64px;font-size:28px;">&#128172;</div>
  <h2 style="margin:0 0 4px;color:#111827;font-size:22px;">Message Received</h2>
  <p style="margin:0;color:#6b7280;font-size:14px;">We'll get back to you soon.</p>
</div>

<p style="color:#374151;font-size:14px;line-height:1.7;margin:16px 0;">Hi ${safeName},</p>
<p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px;">Thank you for reaching out to ${BRAND.name}. We've received your message regarding <strong>"${safeSubject}"</strong> and our team will respond as soon as possible.</p>

<div style="background-color:#f9fafb;border-left:4px solid ${BRAND.color};border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;">
  <p style="color:#6b7280;font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.5px;">Your message</p>
  <p style="color:#374151;font-size:14px;margin:0;line-height:1.6;">${safeMessage}</p>
</div>

<p style="color:#6b7280;font-size:13px;margin:16px 0 0;">We typically respond within 24 hours.</p>
`, `Thanks for contacting us, ${safeName}`)
        });
    }

    const contactRows = [
        emailInfoRow('From', safeName),
        ...(safePhone ? [emailInfoRow('Phone', safePhone)] : []),
        ...(safeEmail ? [emailInfoRow('Email', `<a href="mailto:${safeEmail}" style="color:${BRAND.color};">${safeEmail}</a>`)] : []),
        emailInfoRow('Subject', safeSubject),
    ].join('');

    const adminRecipients = getAdminRecipients();
    const replyHref = safeEmail
        ? `mailto:${safeEmail}?subject=Re: ${encodeURIComponent(subject)}`
        : phone
          ? `https://wa.me/233${phone.replace(/\D/g, '').replace(/^0/, '')}`
          : `mailto:${adminRecipients[0] || ADMIN_EMAIL_DEFAULT}`;

    const adminResult = await sendEmailToAdmins({
        subject: `Contact: ${subject}`,
        html: emailLayout(`
<h2 style="margin:0 0 16px;color:#111827;font-size:20px;">&#128233; New Contact Message</h2>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:12px;overflow:hidden;margin:16px 0;">
  ${contactRows}
</table>

<div style="background-color:#f9fafb;border-left:4px solid ${BRAND.color};border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;">
  <p style="color:#6b7280;font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
  <p style="color:#374151;font-size:14px;margin:0;line-height:1.6;">${safeMessage}</p>
</div>

${emailButton('Reply to ' + safeName, replyHref)}
`, `New contact from ${safeName}: ${safeSubject}`),
    });

    if (!adminResult.success) {
        throw new Error(adminResult.errors.join('; ') || 'Failed to notify admin inboxes');
    }
}

export async function sendSupportTicketAlert(data: {
    name: string;
    email: string;
    orderNumber?: string;
    category: string;
    priority: string;
    subject: string;
    description: string;
}) {
    const { name, email, orderNumber, category, priority, subject, description } = data;
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeDescription = escapeHtml(description);

    await sendEmail({
        to: email,
        subject: `Support ticket received: ${subject}`,
        html: emailLayout(`
<h2 style="margin:0 0 8px;color:#111827;font-size:22px;">Support Ticket Received</h2>
<p style="margin:0 0 16px;color:#6b7280;font-size:14px;">Hi ${safeName}, we have your request and will reply within 24 hours.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:12px;overflow:hidden;margin:16px 0;">
  ${emailInfoRow('Subject', safeSubject)}
  ${emailInfoRow('Category', escapeHtml(category))}
  ${emailInfoRow('Priority', escapeHtml(priority))}
  ${orderNumber ? emailInfoRow('Order', escapeHtml(orderNumber)) : ''}
</table>
<p style="color:#374151;font-size:14px;line-height:1.6;margin:0;">${safeDescription}</p>
`, `We received your support ticket: ${safeSubject}`),
    });

    const adminResult = await sendEmailToAdmins({
        subject: `[Support] ${subject}`,
        html: emailLayout(`
<h2 style="margin:0 0 16px;color:#111827;font-size:20px;">&#127915; New Support Ticket</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:12px;overflow:hidden;margin:16px 0;">
  ${emailInfoRow('From', safeName)}
  ${emailInfoRow('Email', `<a href="mailto:${safeEmail}" style="color:${BRAND.color};text-decoration:none;">${safeEmail}</a>`)}
  ${orderNumber ? emailInfoRow('Order', escapeHtml(orderNumber)) : ''}
  ${emailInfoRow('Category', escapeHtml(category))}
  ${emailInfoRow('Priority', escapeHtml(priority))}
  ${emailInfoRow('Subject', safeSubject)}
</table>
<div style="background-color:#f9fafb;border-left:4px solid ${BRAND.color};border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;">
  <p style="color:#6b7280;font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.5px;">Description</p>
  <p style="color:#374151;font-size:14px;margin:0;line-height:1.6;">${safeDescription}</p>
</div>
${emailButton('Reply to ' + safeName, `mailto:${safeEmail}?subject=Re: ${encodeURIComponent(subject)}`)}
`, `New support ticket from ${safeName}`),
    });

    if (!adminResult.success) {
        throw new Error(adminResult.errors.join('; ') || 'Failed to notify admin inboxes');
    }
}

export async function sendReturnRequestAlert(data: {
    email: string;
    orderNumber: string;
    returnType: string;
    items: { name: string; reason: string; price?: number }[];
}) {
    const { email, orderNumber, returnType, items } = data;
    const safeEmail = escapeHtml(email);
    const safeOrder = escapeHtml(orderNumber);
    const itemsHtml = items.map((item) => `
<li style="margin:0 0 8px;color:#374151;font-size:14px;">
  <strong>${escapeHtml(item.name)}</strong> — ${escapeHtml(item.reason)}
  ${item.price != null ? ` (${formatMoney(item.price)})` : ''}
</li>`).join('');

    await sendEmail({
        to: email,
        subject: `Return request received — ${orderNumber}`,
        html: emailLayout(`
<h2 style="margin:0 0 8px;color:#111827;font-size:22px;">Return Request Received</h2>
<p style="margin:0 0 16px;color:#6b7280;font-size:14px;">We received your ${escapeHtml(returnType)} request for order #${safeOrder}. Our team will review it against our refund policy and contact you shortly.</p>
<ul style="margin:0;padding-left:20px;">${itemsHtml}</ul>
`, `Return request received for order ${orderNumber}`),
    });

    const adminResult = await sendEmailToAdmins({
        subject: `Return request — ${orderNumber}`,
        html: emailLayout(`
<h2 style="margin:0 0 16px;color:#111827;font-size:20px;">&#128230; New Return Request</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:12px;overflow:hidden;margin:16px 0;">
  ${emailInfoRow('Order', `#${safeOrder}`)}
  ${emailInfoRow('Customer Email', `<a href="mailto:${safeEmail}" style="color:${BRAND.color};text-decoration:none;">${safeEmail}</a>`)}
  ${emailInfoRow('Type', escapeHtml(returnType))}
</table>
<ul style="margin:0;padding-left:20px;">${itemsHtml}</ul>
${emailButton('Reply to Customer', `mailto:${safeEmail}?subject=Re: Return ${encodeURIComponent(orderNumber)}`)}
`, `Return request for order ${orderNumber}`),
    });

    if (!adminResult.success) {
        throw new Error(adminResult.errors.join('; ') || 'Failed to notify admin inboxes');
    }
}
