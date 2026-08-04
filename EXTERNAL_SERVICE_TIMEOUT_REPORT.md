# External Service Timeout Report — Vee Care

| Service | Timeout | Blocks UI? | Notes |
|---------|---------|------------|-------|
| Moolre payment status | 15s | Callback/verify only | Not on admin dashboard load |
| Moolre SMS | 15s | After paid (notifications) | Audited in `sms_messages` |
| Resend email | SDK default | After paid | Admin alerts to `ADMIN_EMAIL` |
| Storefront revalidate | **8s** (added) | Product/category save | AbortController |
| Storage upload | Browser/network | Product form upload | Requires admin JWT |
| Hubtel | N/A | — | Not implemented |
| Paystack | Present in code | Not configured on prod | |

Dashboard load does **not** call payment gateways.
