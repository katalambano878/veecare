# Admin Dashboard Stability Report — Vee Care

## Auth shell

| Item | Status |
|------|--------|
| Endless “Loading admin…” | **Fixed** — loading cleared on redirect/error/timeout (15s) |
| Role check | `profiles.role` must be `admin` or `staff` |
| Login account | `admin@veecare.shop` |

## Product admin

| Section | Behavior after fix |
|---------|-------------------|
| Image upload | Session required; 5MB/type checks; relative storage URLs; clear errors |
| Save images | Delete/insert errors surface to admin (no silent wipe) |
| Revalidate | Timed out at 8s so save cannot hang forever |

## Dashboard sections (baseline)

| Section | Notes |
|---------|-------|
| Orders list | Still loads full table client-side — future pagination recommended |
| Products list | Embeds `product_images`; placeholder if missing |
| Optional modules | `store_modules` fetch failures are non-blocking |

## Isolation

Auth shell no longer blocks forever on failed profile fetch. Product form save uses try/catch/finally. Broader per-card Suspense isolation for main `/admin` dashboard remains a follow-up.
