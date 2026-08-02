# Database Performance Report — Vee Care

## Connection pool

| Setting | Value |
|---------|--------|
| Client | `pg.Pool` in `lib/db/pool.ts` |
| Max | `PG_POOL_MAX` or **10** |
| Idle timeout | 30s |
| Connect timeout | 10s (added) |
| Statement timeout | 30s per connection (added) |
| SSL | Only if `PGSSL=require` |

App and DB share a private Docker network → low latency (~ms for indexed queries).

## Indexes added (2026-08-02)

Hot paths from FK embed + admin filters:

- `order_items(product_id)`, `order_items(variant_id)`  
- `product_images(product_id)`, `product_variants(product_id)`  
- `orders(payment_status, created_at DESC)`  
- `orders(lower(email))`  
- cart/wishlist/reviews/returns/support message FK indexes  
- `payment_events` / `sms_messages` partial/status indexes  

## Known slow paths (application, not SQL alone)

| Path | Issue | Mitigation |
|------|-------|------------|
| Product images via Next | Traefik + Node streaming | Compressed JPEGs, SW cache-first, buffer &lt;512KB |
| Nested REST embeds | Multiple round-trips | Batched `resolveEmbeds` (fixed parent table) |
| Admin orders list | Full table select | Index on payment_status+created_at |

## N+1

REST embed resolver batches by IN-lists (not per-row queries). Monitor admin pages that `.map` + individual fetches in React — outside SQL layer.

## Before / after (index migration)

- Pre: 24 unindexed FK columns (heuristic).  
- Post: critical order/product FKs indexed; admin payment filter indexed.  
- Exact `EXPLAIN ANALYZE` timings not captured under load; re-run during staging load test.
