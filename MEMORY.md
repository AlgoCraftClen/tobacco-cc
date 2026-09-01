# CC Tobacco Tracker Memory

Updated: 2026-09-01

Treat these durable rules as authoritative unless Clenny explicitly changes them.

## Next Session

The full read-only audit of both repositories, deployed apps, and the shared Supabase backend was completed on 2026-09-01. Begin the next session with design flaws in Clenny Workstation while treating Tracker records and calculations as authoritative reference material.

Prioritize responsive layout, nested horizontal scrolling, information hierarchy, meeting usability, misleading privacy/import copy, integrity-status clarity, and authentication/session controls. Explain proposed changes before coding, preserve production records, and re-audit every affected cross-app workflow after approved changes.

## People

- Clenny and Clanny are different people; preserve both spellings exactly.
- Clenny is the workstation owner/bookkeeper, receiver, seller, and collector of sales cash.
- Clanny purchases and sends product.

## Source of Truth

- Tracker-entered production records are authoritative and must not be changed or lost.
- Shared data is in Supabase project `njpkqemgpbstrbsaxpbz`, primarily `shipments_v2`, `expenses`, and `sales`.
- The workstation derives displays/calculations from shared data. A mismatch is not permission to rewrite tracker records.
- Expected audit baseline: 5 shipments, 46 operations, 20 sales; SHP #1–#4 have 0 remaining cans and SHP #5 has 1,620.
- Trace source records, classifications, mappings, cache, and formulas before correcting any displayed number.

## Inventory

- Both products use 6 cases per box, 18 rolls per case, and 5 cans per roll: 90 cans per case and 540 per box.
- Grizzly defaults: $497/case, $2,982/box, $11 target sale price per can.
- Copenhagen defaults: $608/case, $3,648/box, $12 target sale price per can.
- Mixed shipments retain separate product costs and prices.
- Every shipment is its own accounting/inventory period. Prior activity must not leak into a new shipment.

## Accounting Law

### Verified 2026-09-01 bottom line

- SHP #5 current safe withdrawal is $0.00 for Clenny and $0.00 for Clanny because no sales are recorded.
- Projected rolled capital is $5,714.57 for Clenny and $11,578.43 for Clanny; company reserve is $12.00.
- Projected reinvestment capital is $5,714.57 for Clenny and $11,578.43 for Clanny. Excess remains pending until the next three product boxes are chosen together.
- The meeting planner accepts adjustable whole-case quantities for each partner and product; six cases equal one box. Reserve is the actual cost of each partner's selected Grizzly and Copenhagen cases, allowing either partner's box count to increase and mixed shipments such as 15 Grizzly + 3 Copenhagen cases.
- SHP #4 must use actual recorded product sale prices: $2,905.22 / $13,785.96 / $23.81 company. The difference to SHP #5's Clenny basis is $50.63 of additional capital.

- Product cost is separate from shipping, fuel, salaries, handling, and other operations.
- Each shipment uses its own original product-investment percentages.
- Apply percentages per product and round partner entitlements down to whole cans.
- Remainder cans belong to the company; their revenue remains company reserve.
- Clenny’s share grows as capital rolls forward. Never use a fixed historical one-third or forced 50/50 share.
- Approved operations are allocated by that shipment’s investment percentages and reduce next-run capital once.
- Personally funded business operations are reimbursed to the payer.
- Shared/sales-funded operations are not reimbursed twice.
- Personal withdrawals reduce only the withdrawing partner’s capital.
- Payout/rolled capital = product revenue − operations responsibility + personal reimbursement − personal withdrawal.
- Clenny’s rolled amount becomes Clenny’s next product investment; Clanny funds the remainder.
- Cash custody never changes ownership.
- The workstation must show separate, traceable “Clenny can withdraw $X” and “Clanny can withdraw $X” amounts.
- Current withdrawal uses realized recorded sales after costs and prior withdrawals. Unsold-inventory results must be labeled projected and reserve the next shipment obligation and company inventory.

## Working Contract

- Tracker: `https://algocraftclen.github.io/tobacco-cc/`
- Workstation: `https://algocraftclen.github.io/clenny-workstation/`
- Supabase is the shared source across devices.
- Preserve production data and backward compatibility.
- Verify real deployed behavior after every approved change.
- Do not save test shipments, sales, operations, settlements, or imports without explicit approval.

## Durable Synchronization Rule

- CC Tracker and Clenny Workstation are two interfaces over one authoritative Supabase ledger.
- Any business record entered in either app must become visible in the other automatically.
- Shared record types include shipments, sales, operations, withdrawals, reimbursements, and capital adjustments.
- Business facts must not exist only in application code, local browser storage, or a workstation-only calculation.
- The Shipment #4 → #5 $50.63 Clenny additional-capital classification must become a first-class shared capital-adjustment record; preserve all tracker source data.
- Prefer secure Supabase real-time subscriptions, retaining manual refresh and bounded polling as recovery fallbacks.
- Every synchronization change requires RLS/auth/session, validation, duplication, conflict, offline/error, and deployed-version verification in both directions.

