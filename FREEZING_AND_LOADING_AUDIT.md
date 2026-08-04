# Freezing and Loading Audit — Vee Care (2026-08-04)

## Scope focused this pass

Primary user reports: **admin product upload failing**, **some product images not showing**, plus system-wide loading/freeze risks from the audit prompt.

Connected DB: `store_veecare` (production `veecare.shop`).

## Confirmed root causes

| Issue | Root cause | Fix |
|-------|------------|-----|
| Images appear missing / stuck loading | `LazyImage` used `opacity-0` until `onLoad`; cached images often skip `onLoad` | Check `img.complete` / `naturalWidth` on mount |
| Admin shell can spin forever | `app/admin/layout.tsx` redirected on auth failure **without** `setIsLoading(false)` | Clear loading on every exit + 15s timeout |
| Product image save can “succeed” with no images | `product_images` insert/delete errors ignored | Throw on delete/insert errors |
| Upload UX / session | No session check; weak filenames; absolute URLs | Session gate, safer names, relative `/storage/...` URLs |
| Save hang risk | `revalidateStorefront` fetch had no timeout | 8s abort |
| SMS audit noise | Duplicate `sms_messages` unique constraint logged as error | Ignore duplicate key |

## Verified healthy (not the cause)

- Disk vs DB: **48/48** product image files present; public GET **200**
- Storage upload with admin JWT: **200**
- `product_images` REST insert as admin: **201**
- Category images: all files present under `products/`

## Upload path (working when session valid)

`ProductForm` → `supabase.storage.from('products').upload` → `POST /storage/v1/object/products/...` (staff JWT required) → relative URL in `product_images`.

## Remaining risks / manual

1. Hard-refresh admin after deploy (stale Server Action IDs seen in logs after prior deploys).
2. If upload still fails, admin must re-login so JWT includes `app_metadata.role=admin`.
3. Broader dashboard section isolation / pagination still recommended for future passes (orders list loads all rows).

## Related docs

- `DATABASE_PERFORMANCE_REPORT.md`
- `ADMIN_DASHBOARD_STABILITY_REPORT.md` (this session)
- `WEBSITE_STABILITY_CHECKLIST.md` (this session)
