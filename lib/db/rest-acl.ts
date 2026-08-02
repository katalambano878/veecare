// Application-level ACL for /rest/v1 — replaces Supabase RLS for the HTTP shim.

import type { RestActor } from "./rest-auth";

export type RestMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type AclDecision =
  | { allow: true; forceEq?: Record<string, string> }
  | { allow: false; status: number; message: string };

/** Catalog / CMS tables readable by anyone with the anon client. */
const PUBLIC_READ = new Set([
  "products",
  "categories",
  "product_images",
  "product_variants",
  "banners",
  "store_modules",
  "cms_content",
  "site_settings",
  "reviews",
  "review_images",
  "blog_posts",
  "coupons",
  "pages",
  "navigation_menus",
  "navigation_items",
  "store_settings",
  "support_knowledge_base",
]);

/** Tables guests may INSERT during checkout / contact / reviews / returns. */
const PUBLIC_INSERT = new Set([
  "orders",
  "order_items",
  "reviews",
  "return_requests",
  "return_items",
  "support_tickets",
  "support_messages",
  "contact_submissions",
  "affiliates",
]);

/** Authenticated GET: table → column forced to actor.userId. */
const USER_SCOPED_GET: Record<string, string> = {
  profiles: "id",
  orders: "user_id",
  support_tickets: "user_id",
  addresses: "user_id",
  wishlist_items: "user_id",
  cart_items: "user_id",
  notifications: "user_id",
  return_requests: "user_id",
  affiliates: "user_id",
};

/** RPCs callable without staff privileges (storefront / checkout). */
const PUBLIC_RPC = new Set([
  "upsert_customer_from_order",
  "resolve_affiliate_code",
  "can_insert_order_item",
]);

/** RPCs reserved for admin/staff/service_role. */
const STAFF_RPC = new Set([
  "mark_order_paid",
  "update_customer_stats",
  "reduce_stock_on_order",
  "get_all_customer_emails",
  "get_all_customer_phones",
  "is_admin_or_staff",
  "apply_store_wide_discount",
  "clear_store_wide_discount",
  "credit_affiliate_commission",
  "upsert_chat_conversation",
  "get_ai_memories",
  "upsert_customer_insight",
]);

function deny(message: string, status = 403): AclDecision {
  return { allow: false, status, message };
}

function allow(forceEq?: Record<string, string>): AclDecision {
  return forceEq ? { allow: true, forceEq } : { allow: true };
}

export function authorizeRestTable(
  actor: RestActor,
  table: string,
  method: RestMethod
): AclDecision {
  const t = table.toLowerCase();

  if (actor.isServiceRole || actor.isStaff) {
    return allow();
  }

  if (method === "GET") {
    if (PUBLIC_READ.has(t)) return allow();

    const scopeCol = USER_SCOPED_GET[t];
    if (scopeCol) {
      if (!actor.userId) return deny("Authentication required");
      return allow({ [scopeCol]: actor.userId });
    }

    if (
      t === "customers" ||
      t === "contact_submissions" ||
      t === "audit_logs" ||
      t === "payment_events" ||
      t === "sms_messages" ||
      t === "schema_migrations"
    ) {
      return deny("Admin access required");
    }

    if (t === "order_items" || t === "affiliate_commissions") {
      return deny(`Direct ${t} access is restricted`);
    }

    return deny(`Access to table '${t}' is restricted`);
  }

  if (method === "POST") {
    if (PUBLIC_INSERT.has(t)) return allow();
    if (t === "profiles" && actor.userId) return allow();
    return deny(`Insert on '${t}' is not allowed`);
  }

  if (method === "PATCH" || method === "PUT") {
    if (t === "profiles" && actor.userId) {
      return allow({ id: actor.userId });
    }
    if (t === "orders" && actor.userId) {
      return deny("Order updates require admin access");
    }
    if (t === "support_tickets" && actor.userId) {
      return allow({ user_id: actor.userId });
    }
    return deny(`Update on '${t}' is not allowed`);
  }

  if (method === "DELETE") {
    return deny(`Delete on '${t}' is not allowed`);
  }

  return deny("Method not allowed", 405);
}

export function authorizeRpc(actor: RestActor, fn: string): AclDecision {
  const name = fn.toLowerCase();
  if (actor.isServiceRole || actor.isStaff) return allow();
  if (PUBLIC_RPC.has(name)) return allow();
  if (STAFF_RPC.has(name)) return deny(`RPC '${name}' requires admin access`);
  return deny(`RPC '${name}' is not allowed`);
}

export function authorizeStorageWrite(actor: RestActor): AclDecision {
  if (actor.isServiceRole || actor.isStaff) return allow();
  return deny("Storage uploads require admin access");
}
