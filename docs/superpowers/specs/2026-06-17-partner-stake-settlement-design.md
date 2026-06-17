# Partner Stake & Settlement — Design

**Date:** 2026-06-17 · **App:** CC Tobacco OS (mobile shipment tracker)

## Goal
Add a **Stake** view (4th tab inside Purchases, alongside All / Clanny / Clenny) that shows the 50/50 partnership economics: total cost, resale revenue, profit/loss, each partner's contributed capital + profit share, and the single balancing payment to settle to an even split. Requires recording resale revenue, which the app does not track yet.

## Decisions (from brainstorming)
1. **Profit = resale revenue − cost.**
2. **Sales = per-shipment sell-through:** mark a *received* shipment as sold for a price/can (→ sale total). Revenue is collected by the shipment's receiver (Clenny).
3. **Purchases are shared business cost** (pooled, split 50/50) — not personal.
4. **"Profited or lost" = settlement:** each partner is entitled to 50% of profit; account for what each actually paid vs collected, then show who's up/down and the one balancing payment.

## Attribution rules
- **Contributed (capital in):** shipments → `sender` (always Clanny); purchases → `partner`.
- **Collected (revenue in):** a sold shipment's `sale_total` → `receiver` (always Clenny).

## Computation — `DATA.computeStake(shipments, purchases)`
```
contributed[p] = Σ shipments(sender=p).grandTotal + Σ purchases(partner=p).total
collected[p]   = Σ shipments(receiver=p, saleTotal>0).saleTotal
cost     = contributed.Clanny + contributed.Clenny
revenue  = collected.Clanny + collected.Clenny
profit   = revenue − cost
sharePer = profit / 2                      // each partner's entitlement
net[p]   = collected[p] − contributed[p]   // current cash position; Σ net = profit
adjClanny = sharePer − net.Clanny          // >0 ⇒ Clanny should receive
settlement = adjClanny>0 ? {from:'Clenny', to:'Clanny', amount: adjClanny}
           : adjClanny<0 ? {from:'Clanny', to:'Clenny', amount:-adjClanny}
           : null
```
Worked example: Clanny funds 1 shipment $5,832; Clenny sells it for $8,000. cost 5,832, revenue 8,000, **profit 2,168**, share 1,084 each. net Clanny −5,832, Clenny +8,000 → **Clenny owes Clanny $6,916**; both end at +1,084. Loss case (profit<0): shares/settlement go negative; label "Loss".

## Data model
Add to `shipments_v2` (migration applied): `sale_total numeric default 0`, `sale_price_per_can numeric default 0`, `sold_at timestamptz`. A shipment is "sold" when `sale_total > 0`.

## UI / components
- **supabase.jsx:** map `saleTotal`/`salePricePerCan`/`soldAt`; add `DB.shipments.recordSale(id, {salePricePerCan, saleTotal})` (sets `sold_at = now`).
- **screens-shipment.jsx:**
  - `ShipmentCard` gains an `onSell` prop. Received + unsold shipment shows a **Record sale** action; sold shipment shows sale total + **profit** (`saleTotal − grandTotal`).
  - `RecordSaleSheet` (price/can → auto sale total) at the Shipments-screen level; on save → `recordSale` + `refresh`.
- **screens-purchases.jsx:** segmented control → 4 cols, add **Stake**. When selected, render `StakeView` (cost/revenue/profit headline, two partner cards with contributed + collected + profit share, settlement banner) instead of the purchases list. Empty-revenue state nudges recording a sale.

Reuses existing classes (metric, card, kv, review-row); no new CSS expected.

## Edge cases & notes
- No sales yet ⇒ revenue 0, profit = −cost (a loss); StakeView shows a "record a sale" hint.
- Purchases add cost without a matching revenue line (only shipments are resold), so logging purchases lowers shared profit — expected given decision #3; revisit if it feels wrong.
- Disputed shipments are excluded from "Record sale" (only `received` shipments are sellable).

## Out of scope
Standalone (non-shipment) sales; partial sell-through; non-50/50 splits; dashboard profit widgets.
