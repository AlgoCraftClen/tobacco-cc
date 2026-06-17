# CC Tobacco OS — Project Notes

Portable project context (mirrored from local agent memory; email redacted for the public repo).
Last updated: 2026-06-17.

**Owner:** Clenny Minor (GitHub: CM-Procurement, email: [redacted])
**Repo:** https://github.com/AlgoCraftClen/tobacco-cc.git
**Live:** Cloudflare Pages https://cc-tobacco.pages.dev (primary) · GitHub Pages https://algocraftclen.github.io/tobacco-cc/
**Greeting:** "Iakwe" (Marshallese hello), shown on role select + Dashboard.

---

## What it is
A **mobile-first** two-person tobacco shipment tracker. Clanny sends shipments → Clenny receives them; both log personal purchases; a Stake view nets out the 50/50 partnership economics. No build step — runs in the browser via React 18 (UMD) + @babel/standalone + Supabase. Open `index.html` directly.

## Roles (consistent everywhere)
- **Clanny = Sender** · **Clenny = Receiver** (`DATA.SENDER`/`DATA.RECEIVER`, `DATA.ROLES`).
- Chosen on first launch ("Who are you?"), persisted in `localStorage["cc_role"]`, switchable via header chip / sidebar / ⌘K.

## File map
```
index.html            entry; loads data, supabase, ui, then 5 screens, then app
styles.css            desktop design system + appended MOBILE section (tabs, FAB, sheets, stepper, role select, skeletons)
data.jsx              window.DATA: ROLES, BRANDS(["Grizzly","Cope"]), unit ladder, boxesToUnits(), priceLadder(), computeStake()
supabase.jsx          window.DB.shipments.* (list/insert/update/receive/dispute/recordSale/delete) + window.DB.purchases.*
ui.jsx                Icon set, Avatar, Badge, charts, money/fmt; Sheet, Skeleton, Progress, MetricCard, fmtDate, relTime
screens-dashboard.jsx Dashboard + shared ShipStatus/SHIP_V2/buildActivity (loaded first)
screens-shipment.jsx  Shipments list + ShipmentCard + 4-step NewShipment + RecordSaleSheet
screens-receive.jsx   Receive (pending list, Confirm Received / Report Issue)
screens-purchases.jsx Purchases list + AddPurchaseSheet + Stake tab (StakeView)
screens-history.jsx   History (chronological, grouped by day)
app.jsx               shell: RoleSelect, Sidebar, Topbar, MobileHeader, BottomTabs, FAB, CommandPalette(⌘K), App (owns data + refresh, router)
favicon.svg, apple-touch-icon.png, icon-192/512.png, manifest.webmanifest   branding / installable PWA
docs/superpowers/specs/2026-06-17-partner-stake-settlement-design.md        Stake feature design spec
extracted/            READ-ONLY archive (do NOT modify)
```

## App data flow
`app.jsx` owns `{shipments, purchases, loading}`, loads both via `Promise.all` on mount, exposes `refresh()`. Every screen gets the same `ctx`: `{ go, screen, params, role, showToast, refresh, shipments, purchases, loading }`. Screens write via `DB` then call `refresh()`. Pull-to-refresh wired on `.content`.

## Navigation
Tabs: **Dashboard · Shipments · Receive · Purchases · History** (bottom bar on phones, collapsible sidebar on tablet/desktop). Non-tab `newshipment` (4-step send) highlights the Shipments tab. FAB = new shipment (or add purchase on the Purchases tab).

## Unit ladder — CRITICAL (do not revert)
Hierarchy **Box > Case > Roll > Can** (Box is largest):

| Unit | Contains | In Cans |
|------|----------|---------|
| Box  | 6 Cases  | 540 |
| Case | 18 Rolls | 90  |
| Roll | 5 Cans   | 5   |
| Can  | —        | 1   |

Derived: 1 Box = 6 Cases = 108 Rolls = **540 Cans**; 1 Case = 90 Cans. Constants live in `data.jsx` (`TO_CANS`, `BOX_TO`, `CASE_TO`, `ROLL_TO`, `boxesToUnits`, `priceLadder`). The OLD desktop app used the opposite ladder (Case largest, 300 cans/case) — that is WRONG for this rebuild.

## Supabase (project `njpkqemgpbstrbsaxpbz`, "tobacco-cc")
Anon key embedded in `supabase.jsx` (intentional; RLS permissive for anon/authenticated — private two-person app).
- `shipments_v2`: id, brand, boxes, cases, rolls, cans, price_per_can, subtotal, misc_cost, misc_desc, grand_total, sender(def Clanny), receiver(def Clenny), status('pending'|'received'|'disputed'), notes, created_at, received_at, **sale_total, sale_price_per_can, sold_at**.
- `purchases`: id, partner('Clanny'|'Clenny'), brand, cans, price_per_can, total, created_at.
- Old tables (`products`, `customers`, `shipments`, `invoices`) still exist but are UNUSED by the rebuild.

## Workflows
- **Send (Clanny):** brand + boxes (auto cases/rolls/cans) → price/can (auto per roll/case/box + subtotal) → optional misc cost → review → insert status=pending.
- **Receive (Clenny):** Confirm Received → status=received + received_at; Report Issue → status=disputed + notes.
- **Purchases:** partner + brand + cans + price → total = cans × price.
- **Record sale (per shipment):** on a received shipment, enter sale price/can → `sale_total`, `sold_at`; profit = sale_total − grand_total.

## Partner Stake feature
`DATA.computeStake(shipments, purchases)`: cost = shipments (by sender) + purchases (by partner); revenue = sold shipments (by receiver); profit = revenue − cost; split 50/50; settlement = who-owes-whom to equalize. Shown in **Purchases → Stake tab** (`StakeView`). Spec: `docs/superpowers/specs/2026-06-17-partner-stake-settlement-design.md`.

## Deployment
- **GitHub Pages:** auto-deploys from `main`.
- **Cloudflare Pages:** MANUAL direct upload (not git-connected). Redeploy after changes:
  ```
  mkdir -p dist && cp -f index.html styles.css favicon.svg *.png manifest.webmanifest *.jsx dist/ \
    && npx wrangler pages deploy dist --project-name=cc-tobacco --branch=main --commit-dirty=true
  ```
  `dist/` and `.wrangler/` are gitignored. (Optionally connect the repo in Cloudflare for push-to-deploy.)

## Open items to revisit
1. Purchases are pooled as shared cost with no resale counterpart, so they read as a loss until shipment sales are recorded (chosen behaviour; switchable to personal/excluded).
2. Negative money renders as `$-X` rather than `-$X` (cosmetic; in `money()`).
3. Sale revenue is attributed to the receiver (Clenny); no standalone non-shipment sales.

## Dev notes
- Edit root files; open `index.html` to test (Supabase works from `file://`). `extracted/` is the read-only archive.
- Commits: `0bee672` (mobile rebuild + icons + manifest), `1e2b271` (Stake feature).
