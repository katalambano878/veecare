# Database migrations

SQL migrations for your Supabase project.

## Migration order

| # | File | Purpose |
|---|------|---------|
| 1–4 | `scripts/.chunk1.sql` … `.chunk4.sql` | Core schema (extensions, tables, functions, indexes, RLS) |
| 5 | `20260218000000_allow_null_order_items_product_fks.sql` | Nullable product FKs on order items |
| 6 | `20260219000000_contact_submissions.sql` | Contact form submissions table |
| 7 | `20260528180000_ai_chat_memory_and_kb.sql` | **AI chatbot** — memory, transcripts, KB, RPCs |

## AI chat migration (step 7)

`20260528180000_ai_chat_memory_and_kb.sql` adds the four tables and three RPCs
that power the in-app AI chat (`/api/chat`):

| Object | Role |
|--------|------|
| `chat_conversations` | Rolling per-session transcript + sentiment/category/intent |
| `ai_memory` | Durable facts the AI remembers across chats |
| `customer_insights` | Aggregate signals (total chats, last seen) per customer |
| `support_knowledge_base` | Admin-curated FAQ articles surfaced in AI answers |
| `upsert_chat_conversation` | Saves each turn of the chat |
| `get_ai_memories` | Loads customer memories for LLM context |
| `upsert_customer_insight` | Bumps total_chats / last seen |

The chat assistant degrades gracefully if this migration hasn't been applied yet.

## Push via MCP

Generate all MCP payloads:

```bash
node scripts/run-all-migrations.mjs
```

This writes `scripts/_mcp_<name>.json` for each step. Then apply step 7 (or all steps) through your Supabase MCP `apply_migration` tool.

Print a single step for MCP:

```bash
node scripts/apply-migrations-mcp.mjs 7
```

Print all steps as JSON lines:

```bash
node scripts/mcp-apply-all.mjs
```

## Push via Supabase CLI

```bash
npm run supabase:link
npm run supabase:push
```

## Push via direct Postgres

Requires `DATABASE_URL` in `.env.local`:

```bash
node scripts/apply-migrations-pg.mjs
```
