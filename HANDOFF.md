# CC Tobacco Tracker Handoff

Updated: 2026-09-02

## SHARED SECURITY AND SYNCHRONIZATION COMPLETED

The approved cross-app blocker repair was deployed on 2026-09-02.

- Tracker commit `23be950` and Workstation commit `1d04a18` require the same authorized Clenny Supabase session for protected data.
- Anonymous REST access is blocked by RLS; all four shared tables allow CRUD only to the authorized authenticated Clenny account.
- Both applications subscribe to Supabase Realtime for `shipments_v2`, `expenses`, `sales`, and `capital_adjustments`, with manual refresh and bounded polling as recovery paths.
- Migration `20260902_shared_sync_security.sql` is applied in project `njpkqemgpbstrbsaxpbz`.
- The Shipment #4 to #5 difference is now one shared `capital_adjustments` row for `$50.63`, temporarily allocated to `Business`, with status `pending_partner_decision`.
- That classification changes neither cash custody nor partner ownership: `affects_cash = false` and `affects_ownership = false`.
- No historical shipment, expense, or sale row was changed. The verified baseline remains 5 shipments, 46 operations, 20 sales, and 1,620 cans remaining in SHP #5.

Fresh production sign-out screens and read security were verified in the Codex built-in browser with no console errors. Authenticated production mutations were deliberately not created; do not add test transactions without explicit approval at action time.

## WORKSTATION DESIGN PASS COMPLETED

The approved Clenny Workstation responsive and usability corrections were completed on 2026-09-01 using this Tracker repository as the accounting and shared-data authority.

The Workstation now prioritizes current withdrawal and meeting decisions, contains wide tables without page-level overflow, persists only the local meeting draft/preferences/session, describes Supabase storage accurately, disables replacement imports, explains integrity failures by shipment and delta, and exposes session/sign-out controls. The Tracker application, migrations, production records, and settlement formulas were not changed.

Verified data remained: 5 shipments, 46 operations, 20 sales, and 1,620 cans remaining in SHP #5. The Workstation's clearer integrity panel surfaces the pre-existing SHP #1 investment-basis difference rather than concealing it behind contradictory green checks.

## NEXT SESSION

Sign in with the authorized Clenny account and verify the normal authenticated read flow in both deployed apps. Then Clenny and Clanny can decide whether the pending `$50.63` Business reserve should remain with the business or be finalized to Clenny or Clanny. Change the shared adjustment only after that decision; do not change historical shipment, expense, or sale rows to force the result.

Do not repeat the completed audit unless a later change affects calculations, shared data, security, or synchronization. Preserve Tracker-entered records and verify every affected cross-app workflow after approved changes.

### Goal

Prove that CC Tobacco Tracker and Clenny Workstation are synchronized, mathematically consistent, secure, visually correct, and functionally correct end to end.

### Completed audit scope — reference

Audit both repositories and live apps:

- Tracker: `AlgoCraftClen/tobacco-cc` — `https://algocraftclen.github.io/tobacco-cc/`
- Workstation: `AlgoCraftClen/clenny-workstation` — `https://algocraftclen.github.io/clenny-workstation/`
- Every directory, file, and line of source, configuration, documentation, migration, workflow, and asset—no sampling.
- GitHub Pages/Actions, deployed commit parity, and cache/version behavior.
- Supabase schema, tables, constraints, Row Level Security, authentication, session refresh, queries, mutations, and mappings.
- Every page, tab, panel, modal, form, table, card, button, link, dropdown, filter, import/export control, and navigation path.
- Loading, empty, error, validation, success, signed-in/out, expired-session, mobile, tablet, and desktop states.
- Every shipment, operation, sale, settlement, ownership, inventory, reimbursement, withdrawal, rollover, projection, and company-reserve calculation.
- Cross-app synchronization and agreement with authoritative Supabase records.

### Safeguards retained for design work

1. Read both repositories’ HANDOFF, MEMORY, README, and repository instructions completely.
2. Inventory both repositories and read every line of every text/code file.
3. Audit the database and live records read-only first.
4. Use the Computer Use plugin for visual and interactive checks in Chrome or BrowserOS. Do not use Microsoft Edge or Playwright for this project.
5. Open every page and click every safe button/control, comparing the visible state before and after.
6. For Delete or other destructive controls, inspect only to the confirmation boundary and cancel. Never confirm deletion during an audit.
7. Do not submit test shipments, operations, sales, settlements, imports, or any live write without Clenny’s explicit approval at the time.
8. Compare repository source, deployed source, rendered behavior, and database source-of-truth values.
9. Produce an evidence-backed findings report: severity, affected app/file, reproduction, expected result, actual result, and proposed correction.
10. Explain proposed corrections before coding. Implement only after approval, then re-audit both applications.

“Everything” means exhaustive inspection. It does not authorize deleting records, changing authoritative data, exposing secrets, or submitting test data.

### Data protection and accounting law

- Tracker-entered records are authoritative. Never change, replace, normalize, or delete them to make the workstation agree.
- If the apps disagree, trace the calculation, mapping, cache, or display defect.
- Each shipment uses its own original product-investment percentages.
- Whole-can ownership is calculated per shipment and per product; remainder cans belong to the company.
- Business operations are distinct from product cost and allocated by that shipment’s investment percentages.
- Personally funded business operations are reimbursed; shared/sales-funded operations are not reimbursed twice.
- Personal withdrawals reduce only that partner’s capital.
- Payout/rolled capital = product revenue − operations responsibility + personal reimbursement − personal withdrawal.
- Clenny’s rolled capital becomes Clenny’s next shipment product investment; Clanny funds the remainder.
- Clenny’s capital grows shipment by shipment. Never apply a fixed historical one-third share.
- The workstation must show separate, traceable amounts for “Clenny can withdraw” and “Clanny can withdraw.”

### Verified baseline entering the audit

- Supabase project: `njpkqemgpbstrbsaxpbz`
- Tables: `shipments_v2`, `expenses`, `sales`, `capital_adjustments`
- Expected counts: 5 shipments, 46 operations, 20 sales
- Remaining inventory: SHP #1–#4 = 0; SHP #5 = 1,620 cans
- SHP #5: Clenny 33.04% / 535 cans; Clanny 66.96% / 1,084 cans; company 1 can
- SHP #5 has no recorded sales, so current safe withdrawal is $0 for both partners.
- Current safe withdrawal: Clenny $0.00; Clanny $0.00.
- SHP #5 projected rolled capital: Clenny $5,714.57; Clanny $11,578.43; company $12.00.
- Projected reinvestment capital is $5,714.57 for Clenny and $11,578.43 for Clanny. Excess is not final until both partners choose the next shipment's three product boxes in a meeting.
- Meeting planning uses adjustable whole-case quantities for each partner and product; six cases equal one box. Reserve is the actual cost of each partner's selected Grizzly and Copenhagen cases, so partner box counts may increase and shipments may mix products (for example, 15 Grizzly cases plus 3 Copenhagen cases = 3 boxes). Excess remains pending until both partners enter a case mix.
- SHP #4 actual-price settlement: Clenny $2,905.22; Clanny $13,785.96; company $23.81. SHP #5 therefore includes $50.63 of additional Clenny capital.
- Recent workstation commits: `7ffd242` (adaptable case-mix planner), `72f6526` (initial whole-box planner), and `be9e8e3` (settlement math and live-entry safeguards).

## Project Reference

- Branch: `main`
- Live tracker: `https://algocraftclen.github.io/tobacco-cc/`
- Primary tracker file: `index.html`
- Backend: Supabase `njpkqemgpbstrbsaxpbz`
- Source tables: `shipments_v2`, `expenses`, `sales`, `capital_adjustments`
- Product lines are stored in shipment notes metadata for backward compatibility.
- Database migrations are under `supabase/migrations/` and must be applied in filename order.

## Remaining Administrative Hardening

Supabase's security advisor still reports leaked-password protection as disabled. Enabling that account-level Auth setting requires signing into the Supabase dashboard. It is recommended hardening, but it does not reopen anonymous ledger access or block the deployed applications.

