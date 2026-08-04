# Performance Changelog — 2026-08-04

## Files

- `components/LazyImage.tsx` — cached image visibility fix
- `app/admin/layout.tsx` — auth loading forever fix + timeout
- `components/admin/ProductForm.tsx` — upload/session/URL/save integrity
- `lib/revalidate-storefront.ts` — 8s timeout
- `lib/sms/record-sms.ts` — ignore duplicate SMS audit rows
- Docs: `FREEZING_AND_LOADING_AUDIT.md`, `ADMIN_DASHBOARD_STABILITY_REPORT.md`, `EXTERNAL_SERVICE_TIMEOUT_REPORT.md`, `DATABASE_PERFORMANCE_AND_LOCK_REPORT.md`, `WEBSITE_STABILITY_CHECKLIST.md`

## Measurements

| Check | Result |
|-------|--------|
| Product image files on disk | 48/48 OK |
| Public image HTTP | 200 |
| Admin storage upload (JWT) | 200 |
| Admin product_images insert | 201 |
