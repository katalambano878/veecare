# Database Schema Reference — Vee Care (`store_veecare`)

Active schemas: `public`, `auth`, `storage` (stub), `extensions`.

## Auth

| Table | Purpose | PK |
|-------|---------|-----|
| `auth.users` | Credentials, metadata | `id` uuid |
| `public.profiles` | App role (`admin`/`staff`/`customer`) | `id` → auth.users |

## Catalog

| Table | Purpose |
|-------|---------|
| `categories` | Product categories |
| `products` | Catalog |
| `product_images` | Image URLs under `/storage/v1/object/public/…` |
| `product_variants` | Size/color variants |
| `coupons` | Discounts |
| `banners`, `pages`, `cms_content`, `blog_posts` | Content |
| `store_modules`, `store_settings`, `site_settings` | Config |
| `navigation_menus`, `navigation_items` | Nav |

## Commerce

| Table | Purpose |
|-------|---------|
| `orders` | Order + payment status + metadata |
| `order_items` | Line items |
| `order_status_history` | Status audit |
| `customers` | CRM rollup |
| `cart_items`, `wishlist_items`, `addresses` | Account |
| `reviews`, `review_images` | Reviews |
| `return_requests`, `return_items` | Returns |
| `affiliates`, `affiliate_commissions` | Affiliate |

## Payments / messaging (audit)

| Table | Purpose |
|-------|---------|
| `payment_events` | Gateway callback/verify audit + dedupe |
| `sms_messages` | SMS send audit (masked recipient) |

## Support / AI

| Table | Purpose |
|-------|---------|
| `support_tickets`, `support_messages`, `support_knowledge_base` | Support |
| `chat_conversations`, `ai_memory` | AI chat |
| `contact_submissions`, `notifications`, `audit_logs` | Misc |

## Tracking

| Table | Purpose |
|-------|---------|
| `schema_migrations` | Applied migration versions |

## Key RPCs

- `mark_order_paid(order_ref, moolre_ref)`  
- `update_customer_stats(...)`  
- `upsert_customer_from_order(...)`  
- `reduce_stock_on_order(...)`  
- `can_insert_order_item(...)`  

## Enums (selected)

`order_status`, `payment_status`, `product_status`, `user_role`, `review_status`, `return_status`, `ticket_status`, `ticket_priority`.

For full column lists, introspect:

```sql
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema='public' ORDER BY 1,2;
```
