# CC Tobacco OS — Project Notes

Portable project context (mirrored from local agent memory; email redacted for the public repo).
Last updated: 2026-06-18.

**Owner:** Clenny Minor (GitHub: CM-Procurement, email: [redacted])
**Repo:** https://github.com/AlgoCraftClen/tobacco-cc.git
**Live:** Cloudflare Pages https://cc-tobacco.pages.dev (primary) · GitHub Pages https://algocraftclen.github.io/tobacco-cc/
**Greeting:** "Iakwe" (Marshallese hello), shown on role select + Dashboard.

---

## What it is
A **mobile-first** two-person tobacco business app. Clanny sends shipments → Clenny receives & sells them; both log purchases, expenses, and capital contributions; the Dashboard nets out the 50/50 partnership economics. No build step — React 18 (UMD) + @babel/standalone + Supabase. Open `index.html` directly.

## Roles
- **Clanny = Sender** · **Clenny = Receiver** (`DATA.SENDER`/`DATA.RECEIVER`, `DATA.ROLES`).
- Chosen on first launch ("Who are you?"), persisted in `localStorage["cc_role"]`, switchable via header chip / sidebar / ⌘K.

## Navigation (5 fixed tabs — do NOT add more)
**Dashboard · Shipments · Receive · Purchases · History** (bottom tabs on phones, collapsible sidebar on tablet/desktop). Non-tab `newshipment` (4-step send) highlights Shipments. **FAB = a menu**: New Shipment / Log Purchase / Log Expense / Add Contribution (global slide-up sheets in `app.jsx`).

## File map
```
index.html            entry; loads data, supabase, ui, 5 screens, app; favicon + PWA meta
styles.css            design system + MOBILE section (tabs, FAB, sheets, stepper, role select, skeletons)
data.jsx              window.DATA: ROLES, BRANDS, unit ladder (boxesToUnits/priceLadder), computePartnership()
supabase.jsx          window.DB.shipments/purchases/expenses/contributions (+ DB.clearAll)
ui.jsx                Icon set, Avatar, Badge, charts, money/fmt; Sheet, Skeleton, Progress, MetricCard, fmtDate, relTime
screens-dashboard.jsx Dashboard (segmented Overview/Partnership/Activity) + shared ShipStatus/SHIP_V2/buildActivity/boxWord/ActivityRow
screens-shipment.jsx  Shipments list + ShipmentCard (pending→receive/report, received→record sale, sold→profit) + 4-step NewShipment + RecordSaleSheet + ExpenseLines
screens-receive.jsx   Receive tab (pending list, Confirm Received / Report Issue)
screens-purchases.jsx Purchases list (All/Clanny/Clenny) + AddPurchaseSheet
screens-history.jsx   History (grouped by day; All/Shipments/Finance filter) + "Clear all" (DB.clearAll, confirm sheet)
app.jsx               shell: RoleSelect, Sidebar, Topbar, MobileHeader, BottomTabs, FAB menu, CommandPalette(⌘K), App (owns data+refresh, router); PartnerPick + AddExpenseSheet + AddContributionSheet
favicon.svg, apple-touch-icon.png, icon-192/512.png, manifest.webmanifest   branding / installable PWA
docs/PROJECT-NOTES.md, docs/superpowers/specs/2026-06-17-partner-stake-settlement-design.md
extracted/            READ-ONLY archive (do NOT modify)
```

## App data flow
`app.jsx` owns `{shipments, purchases, expenses, contributions, loading}`, loads all via `Promise.all` on mount, exposes `refresh()`. Every screen gets the same `ctx` props. Screens write via `DB.*` then call `refresh()`.

## Unit ladder — CRITICAL (do not revert)
**Box > Case > Roll > Can**: 1 Box = 6 Cases = 108 Rolls = **540 Cans**; 1 Case = 90 Cans. Constants in `data.jsx`. (Old desktop app used the opposite — wrong for this rebuild.)

## Partnership accounting (`DATA.computePartnership`)
- **Revenue** = resale (shipment `sale_total`).
- **Expenses (per partner)** = logged expenses + purchases + shipment cost-of-goods (sender funds shipments). *(Purchases count as a business expense; COGS is included — both per user decision 2026-06-18.)*
- **Net Profit** = revenue − expenses; split 50/50.
- **Net Position** (per partner) = contributions + expenses paid + profit share (their claim on the business; does NOT subtract collected sales cash, per spec).
- Shown in **Dashboard → Partnership** segment (expandable per-partner cards). Activity feed (Dashboard → Activity, and History) includes sends/receipts/sales/purchases/expenses/contributions.

## Supabase (project `njpkqemgpbstrbsaxpbz`, "tobacco-cc")
Anon key embedded in `supabase.jsx` (intentional; RLS permissive for anon/authenticated — private app).
- `shipments_v2`: id, brand, boxes, cases, rolls, cans, price_per_can, subtotal, misc_cost, misc_desc, grand_total, sender, receiver, status('pending'|'received'|'disputed'), notes, created_at, received_at, sale_total, sale_price_per_can, sold_at
- `purchases`: id, partner, brand, cans, price_per_can, total, created_at
- `contributions`: id, partner, amount, description, created_at
- `expenses`: id, partner, amount, category, description, shipment_id, created_at
- Old tables (products/customers/shipments/invoices) exist but are UNUSED.

## Workflows
- **Send (Clanny):** brand+boxes → price/can → optional misc + optional operating expenses (billed to Clanny) → review → insert (pending).
- **Receive:** Confirm Received (status=received) or Report Issue (disputed + note). Available on the Receive tab AND inline on pending cards in the Shipments list.
- **Record sale (received shipment):** sale price/can → sale_total + sold_at; optional distribution expenses (billed to Clenny); profit = sale_total − grand_total.
- **Purchases / Log Expense / Add Contribution:** via FAB menu (partner + amount + …).
- **Clear all:** History tab → "Clear all" → confirm → `DB.clearAll()` wipes all 4 tables (manual reset; not auto-on-launch; no undo).

## Deployment
- **GitHub Pages:** auto-deploys from `main`.
- **Cloudflare Pages:** MANUAL direct upload (not git-connected). Wrangler already logged in. Redeploy after changes:
  ```
  mkdir -p dist && cp -f index.html styles.css favicon.svg *.png manifest.webmanifest *.jsx dist/ \
    && npx wrangler pages deploy dist --project-name=cc-tobacco --branch=main --commit-dirty=true
  ```
  `dist/` and `.wrangler/` are gitignored.

## Gotchas / lessons
- **fadeIn must animate OPACITY ONLY.** Any non-`none` transform on `.page.fade-in` (including a retained `translateY(0)`/identity matrix from `animation-fill-mode: both`) makes it a containing block for `position: fixed`, trapping every bottom-sheet overlay inside the page (sheet collapses mid-page, header off-screen, dead space below). Fixed 2026-06-18.
- Screen-level sheets (`Sheet` component) render inside `.page`; they rely on no transformed ancestor. RoleSelect + CommandPalette render at app level (safe).

## Open items to revisit
1. Net Position doesn't subtract collected sales cash (spec's formula) — change in `computePartnership` if a true cash position is wanted.
2. Negative money renders `$-X` not `-$X` (cosmetic; `money()` in ui.jsx).
3. Receive buttons on shipment cards show for any role (not just Clenny) — one-line guard if role-gating is wanted.

## Dev notes
- Edit root files; open `index.html` to test (Supabase works from `file://`). `extracted/` is read-only.
- GateGuard hook fires a "Fact-Forcing Gate" on first write/edit per file + first Bash; state facts then retry. `ECC_GATEGUARD=off` disables it.
