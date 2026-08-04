# Database Performance and Lock Report — Vee Care

See also `DATABASE_PERFORMANCE_REPORT.md` (2026-08-02 audit).

## Pool

- Shared `pg.Pool` (`lib/db/pool.ts`)
- `statement_timeout=30s`, `connectionTimeoutMillis=10s`
- `PG_POOL_MAX` default 10

## This pass

- No new lock contention found for product upload (single-row inserts).
- Image files all present on disk; missing-image UI was frontend opacity bug, not SQL.
- Hot-path indexes from prior audit remain in place.

## Recommendation

Paginate `admin/orders` and large admin lists next to reduce long client queries under load.
