# CC Tobacco Tracker

Shared shipment + settlement tracker for Clanny (Sender, DC) and Clenny (Receiver). Runs as a static web app; both partners see each other's changes because everything is backed by Supabase.

## Live app

Once GitHub Pages is enabled on this repo, the app is at:

**https://algocraftclen.github.io/tobacco-cc/**

Open it on either phone (or a laptop). No install, no login. The sync dot in the top-left header shows connection state:

| Dot | Meaning |
|-----|---------|
| Green | Connected, changes are being saved live |
| Blue (pulsing) | Saving right now |
| Yellow (pulsing) | Connecting |
| Red | Offline / DB unreachable |

## One-time database setup

The Supabase project needs the migrations under `supabase/migrations/` applied before writes work. If saves fail with "One-time database setup needed," this is why.

1. Open the SQL Editor: <https://supabase.com/dashboard/project/njpkqemgpbstrbsaxpbz/sql>
2. For each `.sql` file in [`supabase/migrations/`](supabase/migrations/), in filename order, paste its contents and click **Run**. As of now that's:
   - [`20260628_excel_formulas.sql`](supabase/migrations/20260628_excel_formulas.sql) — base `shipments_v2` schema and Excel-aligned columns
   - [`20260705_prototype_sync.sql`](supabase/migrations/20260705_prototype_sync.sql) — Supabase schema for the prototype
   - [`20260706_shipment_short_seq.sql`](supabase/migrations/20260706_shipment_short_seq.sql) — permanent `SHP #N` numbers per shipment
   - [`20260707_fk_cascade_and_publication_guards.sql`](supabase/migrations/20260707_fk_cascade_and_publication_guards.sql) — FK cascade on shipment delete + idempotent realtime publication adds
   - [`20260713_expense_kind.sql`](supabase/migrations/20260713_expense_kind.sql) — `expenses.kind` column distinguishing business expenses from personal withdrawals
   - [`20260715_expense_funding_source.sql`](supabase/migrations/20260715_expense_funding_source.sql) — distinguishes personally paid operations from operations paid out of sales cash

Safe to re-run — every statement is idempotent.

## Local development

The whole app is a single [`index.html`](index.html) — no build step.

```
# From this folder:
npx serve . -l 3000
# then open http://localhost:3000
```

Or just double-click `index.html` (works offline for the read-only prototype view).

## Data model

Prototype writes to these Supabase tables:

- `shipments_v2` — one row per shipment (SHP-002, SHP-003, …)
- `expenses` — Operations Ledger rows (owner, category, amount, included?)
- `sales` — Sales Ledger rows (date, quantity, price, cash collector)

Each shipment has a flexible load sheet: add as many Grizzly or Copenhagen lines as needed and enter full boxes, cases, rolls, or loose cans. Product lines are persisted inside the shipment notes metadata, so this feature does not require an additional Supabase migration and older single-product shipments remain compatible.

All settlement math is client-side. The current agreement described below is authoritative; [`clenny_clanny_shipment_tracker.xlsx`](clenny_clanny_shipment_tracker.xlsx) is retained as a historical reference to the earlier formula model.

The current settlement agreement supersedes the workbook's old operations-as-contribution rule: product investments alone set the profit percentages. Every approved operation reduces profit; personally paid operations are reimbursed, while sales-funded operations are not reimbursed twice. Personal withdrawals reduce only the withdrawing partner's payout.

## iPhone app

An Expo/React Native version lives on the [`expo-archive`](../../tree/expo-archive) branch. It'll be revived when the Apple Developer Program enrollment is sorted; the prototype stays the working app in the meantime.

## License

© 2026 Clenny Minor. All rights reserved.
