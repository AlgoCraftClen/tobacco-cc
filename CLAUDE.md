# Context for Claude Code sessions on this repo

Read this before making changes. Portable state so any workstation can pick up where the last session left off.

## What this is

A shared shipment + settlement tracker for **Clenny** (Receiver) and **Clanny** (Sender), used to reconcile who put in what and who gets paid what after each tobacco shipment.

- **Live app:** https://algocraftclen.github.io/tobacco-cc/
- **Repo:** https://github.com/AlgoCraftClen/tobacco-cc (public, GitHub Pages deploys on push to `main`)
- **Backend:** Supabase project `njpkqemgpbstrbsaxpbz`
  - Dashboard: https://supabase.com/dashboard/project/njpkqemgpbstrbsaxpbz
  - SQL Editor: https://supabase.com/dashboard/project/njpkqemgpbstrbsaxpbz/sql
- **Historical workbook reference:** [clenny_clanny_shipment_tracker.xlsx](clenny_clanny_shipment_tracker.xlsx)

## Architecture in one paragraph

Single-file HTML app (`index.html`, ~1250 lines) — no build step. Loads Supabase config inline, uses PostgREST for reads/writes and a 15-second poll for cross-partner sync. Tables: `shipments_v2`, `expenses`, `sales`. Settlement math is client-side and lives in `calcShipment` + `calcSettlement`. The current agreement documented below is authoritative; the Excel workbook remains a historical reference.

## Design decisions locked in

**Do not re-litigate these without the user explicitly reopening them.**

- **No login, no auth, no user accounts.** The user's explicit stance (2026-07-06): "This is just a tracking app. No real money or assets. I want to keep it as simple as possible for the users. I don't want any login capabilities or constraints."
- **Consequence: the Supabase anon key is public and RLS is not used for meaningful protection.** Anyone who finds the GitHub Pages URL can read/write the shared tables. Accepted risk because there's no money, PII, or assets in the app.
- **APP_SECRET removed.** It was client-visible, so it was theater. Do not re-add "secret headers" as a security measure — they're not.
- **Shipment IDs are UUIDs client-generated at create time.** Display labels are `SHP #<short_seq>`, where the **client** assigns `short_seq` = (highest existing + 1) at create time and writes it explicitly. The DB column still has a `nextval` default + UNIQUE constraint as a backstop, but the app no longer relies on the DB counter (it drifts when rows are deleted and can't be reset with the anon key). Concurrent-create collisions are caught and retried with a fresh max. Never expose the UUID in the UI or ask the user to type one.
- **Shipments use flexible product lines.** Each load-sheet line chooses Grizzly or Copenhagen and accepts boxes, cases, rolls, and loose cans plus its own cost/case and target/can. Lines are stored in the hidden `CC_SHIPMENT_LINES` note marker so the static app works without a schema migration; the old `CC_PRODUCT_MIX` marker is still decoded for backward compatibility. Sales must identify a specific product so remaining inventory stays accurate by brand. Adding a brand = edit the `BRANDS` array in `index.html`.
- **Whole cans set partner entitlement; rounding belongs to the company.** Apply each partner's original shipment investment percentage to each product and round down to whole cans. Every can left after rounding, its inventory value, and its sale revenue belong to the company for future operations or investment. Divide approved operations by the partners' original investment percentages and deduct each share once from that partner's next-run capital. Operations never increase entitlement. Personally paid operations are reimbursed; shared-funded operations are not reimbursed again. Personal withdrawals remain separate. Legacy expenses infer Clanny as personally funded and Clenny as shared-funded.
- **Single-file HTML, no build step.** Do not introduce npm/webpack/bundlers. Every change is a direct edit to `index.html`.
- **Mobile-first, iOS Safari.** The two partners use this on their phones. Design and test accordingly.

## To reverse "no login" (if the user asks)

Rough scope, in order:
1. Enable Supabase Auth (email link is simplest; no username/password)
2. Add a `partnerships` table + a `partnership_id` column to `shipments_v2`, `expenses`, `sales`
3. Add RLS policies gating on `auth.uid()` → `partnerships.members`
4. Add a minimal login screen to `index.html`
5. Rewrite `sbFetch` to send the user's JWT rather than the shared anon key
6. Remove the shared anon-key config

Do not do this speculatively. Only if the user explicitly says the risk profile has changed.

## Repo layout

```
index.html                        the entire app (~1250 lines)
clenny_clanny_shipment_tracker.xlsx   Historical settlement reference
supabase/migrations/              applied via Supabase SQL Editor, filename order
  20260628_excel_formulas.sql
  20260705_prototype_sync.sql
  20260706_shipment_short_seq.sql
  20260707_fk_cascade_and_publication_guards.sql
README.md                         user-facing setup instructions
CLAUDE.md                         this file
```

## How to apply migrations (Supabase side)

1. Open the SQL Editor: https://supabase.com/dashboard/project/njpkqemgpbstrbsaxpbz/sql
2. Paste the contents of each new `.sql` file under `supabase/migrations/` in filename order
3. Click **Run**. All migrations are idempotent post-2026-07-07 — safe to re-run
4. As of 2026-07-06: all four migrations have been applied

## How to deploy client changes

Push to `main`. GitHub Pages redeploys within ~60 seconds. Hard-refresh Safari on the phone (pull-to-refresh) — it caches HTML aggressively.

## Local dev

```
cd tobacco-cc
npx serve . -l 3000
# then open http://localhost:3000
```

Or double-click `index.html` for a read-only view (Supabase sync requires the origin to match CORS, so live sync only works via `serve` or GitHub Pages).

## Recent audit + resolution (2026-07-06)

A full audit ran on 2026-07-06. All 16 findings closed. Full history preserved in commits `fb515e0`, `844883e`, `f505c94`, `ed2ff62`.

### Fixed (in code)

| # | What |
|---|---|
| 2 | Stored XSS via `.innerHTML` — added `escapeHtml`, applied everywhere; header dropdown moved to DOM API; ship-card `onclick` JS-string replaced with `data-ship-id` + delegated listener |
| 3 | `isUserBusy` modal selector fixed (`.modal.active` never matched) |
| 4 | New migration adds `ON DELETE CASCADE` FKs on `expenses.shipment_id` + `sales.shipment_id`, plus cleans up orphans first |
| 5 | `saveSetup` builds a candidate object, saves it, only merges into in-memory state on success |
| 6 | User-typed shipment IDs removed; `crypto.randomUUID()` at create time; display is `SHP #<short_seq>` |
| 7 | Publication membership ADDs are now guarded — 20260705 is finally re-runnable |
| 8 | Shipment-delete confirm uses `SHP #N`, not the raw UUID |
| 9 | Every number input carries `min="0" inputmode="decimal"` |
| 10 | Health-check dots print the actual $ delta when things don't reconcile |
| 12 | Setup "Shipment ID" is a plain label, not a fake readonly input |
| 13 | Dead `save()` shim removed |
| 15 | `aria-label` on sync dot and `+` button |

### Accepted (deliberate no-fix)

| # | What |
|---|---|
| 1 | RLS on Supabase tables — see "Design decisions" above; no auth by design |
| 14 | `APP_SECRET` — removed as dead code; see "Design decisions" above |

### Deferred UX polish

| # | What |
|---|---|
| 11 | Line-item op/sale deletes still use native `confirm()`. Fine for single line items. Only revisit if accidental taps become a real problem. |
| 16 | 12px `metric-label` on `--text-2` is borderline contrast. Note only. |

## Notes on the sync model

- 15-second poll from every visible tab, plus a re-poll on `visibilitychange` (returning to the app)
- Poll pauses while a modal is open OR while an input/textarea/select is focused, so it can't clobber typing
- Writes are optimistic — the client mutates local state and pushes to Supabase in the same transaction. If push fails, the client shows an alert and the next poll will sync the local state back to reality
- No conflict resolution; last writer wins. Fine for a two-partner tracker where the same shipment is rarely edited by both at the same moment
- Realtime publication is set up on all three tables via the guarded migration, but the client currently uses polling only. Switching to realtime subscriptions is a possible future improvement (would drop the 15s latency), but not needed for the current use case

## Things the user commonly asks for

Kept here so Claude doesn't have to re-derive on every session:

- "Make the shipment ID shorter" — done. `SHP #N` display via `shortShipmentId(id)` helper. Never revert to raw UUIDs in UI.
- "Add a confirmation before Clear All Data" — done. Typed-DELETE modal (`#clearDataModal`). If the user wants the same friction elsewhere, extend the same pattern rather than adding a new modal shape.
- "The dash is scrolling sideways / plus button hidden" — was a flex `min-width: auto` issue on `.header-select` and `.card-value`. Both fixed. If similar symptoms come back, first suspect a new flex child without `min-width: 0`.

## Conventions

- Commit messages: short imperative present tense, no scope prefix. See recent commits for style.
- Comments: only when the *why* is non-obvious. Don't narrate what the code does.
- No new files unless needed. Prefer editing `index.html` in place.
- New migrations: filename pattern `YYYYMMDD_short_description.sql`, must be idempotent, must be added to the README's migrations list.
