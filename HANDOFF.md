# CC Tobacco Tracker Handoff

Updated: 2026-09-01

## NEXT SESSION — MANDATORY FULL AUDIT

The next session begins with a full audit before any coding, data correction, or production write.

### Goal

Prove that CC Tobacco Tracker and Clenny Workstation are synchronized, mathematically consistent, secure, visually correct, and functionally correct end to end.

### Scope: “Everything”

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

### Required method

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
- Tables: `shipments_v2`, `expenses`, `sales`
- Expected counts: 5 shipments, 46 operations, 20 sales
- Remaining inventory: SHP #1–#4 = 0; SHP #5 = 1,620 cans
- SHP #5: Clenny 33.04% / 535 cans; Clanny 66.96% / 1,084 cans; company 1 can
- SHP #5 has no recorded sales, so current safe withdrawal is $0 for both partners.
- Current safe withdrawal: Clenny $0.00; Clanny $0.00.
- SHP #5 projected rolled capital: Clenny $5,714.57; Clanny $11,578.43; company $12.00.
- Next equal-shipment reserve uses SHP #5's exact investment basis: Clenny $2,955.85; Clanny $5,990.15.
- Correct projected excess after that reserve: Clenny $2,758.72; Clanny $5,588.28. The superseded $2,732.57 / $5,614.43 figures used a forbidden fixed one-third/two-thirds reserve.
- SHP #4 actual-price settlement: Clenny $2,905.22; Clanny $13,785.96; company $23.81. SHP #5 therefore includes $50.63 of additional Clenny capital.
- Recent workstation commits: `5d2ae43` and `13d95f4`.

## Project Reference

- Branch: `main`
- Live tracker: `https://algocraftclen.github.io/tobacco-cc/`
- Primary tracker file: `index.html`
- Backend: Supabase `njpkqemgpbstrbsaxpbz`
- Source tables: `shipments_v2`, `expenses`, `sales`
- Product lines are stored in shipment notes metadata for backward compatibility.
- Database migrations are under `supabase/migrations/` and must be applied in filename order.

## Next Session Priority — Bidirectional Shared-Database Synchronization

The mobile CC Tracker and Clenny Workstation are two interfaces over one authoritative Supabase ledger. The next session must audit first, then design and implement complete bidirectional synchronization:

- Mobile entries must update the workstation automatically.
- Workstation entries must update the mobile tracker automatically.
- Shipments, sales, operations, withdrawals, reimbursements, and capital adjustments must be first-class shared database records—not hard-coded in one app or stored only in browser preferences.
- Replace the workstation-only Shipment #4 → #5 $50.63 classification with a shared, auditable capital-adjustment record while preserving all existing tracker-entered data.
- Add secure real-time subscriptions for both apps, with manual refresh and bounded polling as recovery fallbacks.
- Audit RLS, authentication, session refresh, validation, duplicate prevention, conflict behavior, offline/error states, and deployed-version parity.
- Test read-only first. Do not create production test transactions or alter authoritative records without Clenny’s explicit approval at action time.
- Prove both directions end to end: mobile → database → workstation and workstation → database → mobile.

