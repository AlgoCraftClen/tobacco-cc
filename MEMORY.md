# CC Tobacco Tracker Memory

This file contains durable project decisions for future editing sessions. Treat these rules as authoritative unless the owner explicitly changes them.

## Identity and Roles

- **Clenny** is spelled C-L-E-N-N-Y. Clenny is the receiver and seller who records sales and physically collects sales cash.
- **Clanny** is spelled C-L-A-N-N-Y. Clanny purchases and sends the product.
- Clenny and Clanny are different people. Never merge, interchange, or autocorrect their names.
- Do not use `Clinty` or other name variants.

## Inventory Rules

- A shipment can contain Grizzly, Copenhagen, or both.
- A mixed shipment must support separate product lines at the same time.
- Both products use the same inventory structure: 6 cases per box, 18 rolls per case, and 5 cans per roll.
- Therefore, one case contains 90 cans and one box contains 540 cans.
- Grizzly costs $497 per case and $2,982 per box.
- Copenhagen costs $608 per case and $3,648 per box.
- Grizzly defaults to a target sale price of $11 per can.
- Copenhagen defaults to a target sale price of $12 per can.
- Product cost and target sale price remain separate for each product, including mixed shipments.
- Quantity entry supports boxes, cases, rolls, or loose cans, and equivalent fields must remain synchronized.

## Shipment Rules

- Every new shipment is a clean accounting and inventory period.
- Previous shipment inventory, remaining cans, sales, operations, projected revenue, and dashboard totals must not carry into a new shipment.
- The new shipment projection is calculated from its own quantities and each product line's target sale price.
- Saving Shipment Setup must close the setup form and return to the dashboard.
- Unsaved Shipment Setup values must survive background synchronization while the user is editing.

## Partnership Investment Rules

- Product investment alone determines each partner's profit percentage.
- Operations do not increase either partner's ownership percentage.
- Clenny's prior shipment payout/reinvestment amount migrates into the next shipment as Clenny's product investment.
- Clanny contributes the remainder required to make total partner investment equal the new shipment's total product cost.
- As Clenny's reinvested amount grows, the ownership percentages naturally move toward 50/50. They become exactly 50/50 only when both product investments are equal.
- Never force a 50/50 split when the actual product investments are unequal.

## Operations and Cash Rules

- Funding source and the person performing an operation are separate facts.
- Clenny uses money directly from collected sales cash to pay operations.
- Clanny normally pays operations with Clanny's own personal money.
- An approved operation always reduces business profit.
- A personally funded operation is reimbursed separately to the person who paid it.
- An operation paid from sales or shared business funds must not be reimbursed a second time.
- Personal withdrawals reduce only the withdrawing partner's payout and do not change the profit split.
- Cash custody never changes ownership percentages.

## Cash on Hand

- `Clenny Cash on Hand Before Transfer` means the physical sales cash currently held by Clenny before transferring or settling it.
- It is based on paid sales cash collected by Clenny, less operations that were actually paid from that sales cash and relevant cash already transferred or withdrawn.
- Personally funded Clanny operations do not reduce the physical cash held by Clenny.
- `Net Company Reinvestment Capital` is a different number. Do not substitute it for physical cash on hand.
- Avoid double-counting an operation as both a reduction of sales cash and a reimbursement.

## Technical Contract

- The correct project is the GitHub repository at `AlgoCraftClen/tobacco-cc` and the matching folder `C:\Users\WorkStation\Desktop\tobacco-cc`.
- The live app is `https://algocraftclen.github.io/tobacco-cc/`.
- The app is actively used; preserve production data and backward compatibility.
- `index.html` is the main app and settlement math is calculated client-side.
- Supabase is the shared source of data across devices.
- The 15-second poll must not overwrite dirty Shipment Setup fields. See commit `f7a1403`.
- Do not alter accounting formulas merely to make a displayed number look expected. Trace the source records and funding classification first.

## Working Preferences

- Discuss and confirm financial logic before coding whenever the owner asks to talk first.
- Use Computer Use with Google Chrome or BrowserOS for UI validation.
- Never use Playwright or Microsoft Edge for this project.
- Verify the real live application after deployment.
- Do not save test shipments, sales, operations, or settlement data without explicit approval.
- Keep changes scoped, audit the math, and commit and push completed work appropriately.
