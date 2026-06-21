/* Business logic — CC Tobacco OS
   Unit ladder (SPEC — never alter):
     1 Box  = 6 Cases = 108 Rolls = 540 Cans
     1 Case = 18 Rolls = 90 Cans
     1 Roll = 5 Cans
*/

export const SENDER = 'Clanny';
export const RECEIVER = 'Clenny';

export const ROLES = {
  Clanny: { name: 'Clanny', role: 'Sender', av: 'av-3', greetingRole: 'Sender' },
  Clenny: { name: 'Clenny', role: 'Receiver', av: 'av-1', greetingRole: 'Receiver' },
} as const;

export type RoleName = 'Clanny' | 'Clenny';
export type Role = typeof ROLES[RoleName];

export const roleOf = (name: string): Role | null =>
  ROLES[name as RoleName] || null;

export const BRANDS = ['Grizzly', 'Cope'] as const;
export type Brand = typeof BRANDS[number];

export const UNITS = ['Box', 'Case', 'Roll', 'Can'] as const;
export const TO_CANS = { Box: 540, Case: 90, Roll: 5, Can: 1 };
export const BOX_TO = { Case: 6, Roll: 108, Can: 540 };
export const CASE_TO = { Roll: 18, Can: 90 };
export const ROLL_TO = { Can: 5 };

export function boxesToUnits(boxes: number) {
  const b = Number(boxes) || 0;
  return { boxes: b, cases: b * BOX_TO.Case, rolls: b * BOX_TO.Roll, cans: b * BOX_TO.Can };
}

export function priceLadder(canPrice: number | string) {
  const c = Number(canPrice) || 0;
  return {
    perCan: c,
    perRoll: c * ROLL_TO.Can,
    perCase: c * TO_CANS.Case,
    perBox: c * TO_CANS.Box,
  };
}

export const PARTNERS: RoleName[] = [SENDER, RECEIVER];
export const PRODUCT_FUNDING_CATEGORY = 'Product funding';

export const EXPENSE_KINDS = {
  PRODUCT: 'product_funding',
  SHIPMENT: 'shipment_cost',
  DISTRIBUTION: 'distribution_cost',
  GENERAL: 'general_expense',
} as const;

export type ExpenseKind = typeof EXPENSE_KINDS[keyof typeof EXPENSE_KINDS];

export interface Shipment {
  id: string;
  brand: string;
  boxes: number;
  cases: number;
  rolls: number;
  cans: number;
  pricePerCan: number;
  subtotal: number;
  miscCost: number;
  miscDesc: string;
  grandTotal: number;
  sender: string;
  receiver: string;
  status: 'pending' | 'received' | 'disputed';
  notes: string;
  createdAt: string | null;
  receivedAt: string | null;
  saleTotal: number;
  salePricePerCan: number;
  soldAt: string | null;
}

export interface Purchase {
  id: string;
  partner: string;
  brand: string;
  cans: number;
  pricePerCan: number;
  total: number;
  createdAt: string | null;
}

export interface Expense {
  id: string;
  partner: string;
  amount: number;
  category: string;
  description: string;
  shipmentId: string | null;
  createdAt: string | null;
}

export interface Contribution {
  id: string;
  partner: string;
  amount: number;
  description: string;
  createdAt: string | null;
}

export interface SaleEntry {
  id: string;
  saleNo: number;
  quantityCases: number;
  cans: number;
  pricePerCan: number;
  revenue: number;
  createdAt: string;
}

const num = (v: unknown) => Number(v) || 0;
const cleanPartner = (partner: string): RoleName =>
  PARTNERS.includes(partner as RoleName) ? (partner as RoleName) : SENDER;

const emptyPartners = () => ({ Clanny: 0, Clenny: 0 });
const emptyFunding = () => ({
  Clanny: { amount: 0, cans: 0, rolls: 0 },
  Clenny: { amount: 0, cans: 0, rolls: 0 },
});

export function parseExpenseMeta(expense: Expense | null): Record<string, unknown> | null {
  const text = String((expense && expense.description) || '').trim();
  if (!text || text[0] !== '{') return null;
  try { return JSON.parse(text); } catch { return null; }
}

export function makeExpenseDescription(kind: ExpenseKind, data?: Record<string, unknown>) {
  return JSON.stringify({ kind, ...(data || {}) });
}

export function expenseKind(expense: Expense): ExpenseKind {
  const meta = parseExpenseMeta(expense);
  if (meta && meta.kind) return meta.kind as ExpenseKind;
  const cat = String((expense && expense.category) || '').toLowerCase();
  if (cat === PRODUCT_FUNDING_CATEGORY.toLowerCase()) return EXPENSE_KINDS.PRODUCT;
  if (cat.indexOf('distribution') === 0) return EXPENSE_KINDS.DISTRIBUTION;
  if (expense && expense.shipmentId) return EXPENSE_KINDS.SHIPMENT;
  return EXPENSE_KINDS.GENERAL;
}

export const isProductFunding = (expense: Expense) =>
  expenseKind(expense) === EXPENSE_KINDS.PRODUCT;

export function displayExpenseCategory(expense: Expense) {
  const meta = parseExpenseMeta(expense);
  return (meta && meta.category as string) || expense.category || expense.description || 'Cost';
}

export const expensesForShipment = (expenses: Expense[], shipmentId: string | null) =>
  (expenses || []).filter(e => shipmentId && e.shipmentId === shipmentId);

export function productFundingForShipment(shipment: Shipment, expenses: Expense[]) {
  const funding = emptyFunding();
  const rows = expensesForShipment(expenses, shipment && shipment.id).filter(isProductFunding);
  rows.forEach(row => {
    const partner = cleanPartner(row.partner);
    const meta = parseExpenseMeta(row) || {};
    const amount = num(row.amount);
    const cans = num(meta.cans) || (num(shipment && shipment.pricePerCan) > 0 ? amount / num(shipment.pricePerCan) : 0);
    funding[partner].amount += amount;
    funding[partner].cans += cans;
    funding[partner].rolls += num(meta.rolls) || (cans / TO_CANS.Roll);
  });

  const fallbackTotal = num(shipment && shipment.subtotal) || num(shipment && shipment.grandTotal);
  if (!rows.length && fallbackTotal > 0) {
    funding[SENDER].amount = fallbackTotal;
    funding[SENDER].cans = num(shipment && shipment.cans);
    funding[SENDER].rolls = funding[SENDER].cans / TO_CANS.Roll;
  }

  const totalAmount = funding.Clanny.amount + funding.Clenny.amount;
  const totalCans = funding.Clanny.cans + funding.Clenny.cans;
  return { rows, funding, totalAmount, totalCans };
}

export function shipmentFinance(shipment: Shipment, expenses: Expense[]) {
  const product = productFundingForShipment(shipment, expenses);
  const related = expensesForShipment(expenses, shipment && shipment.id);
  const costRows = related.filter(e => !isProductFunding(e));
  const costsPaid = emptyPartners();
  const shipmentCostsPaid = emptyPartners();
  const distributionCostsPaid = emptyPartners();
  costRows.forEach(row => {
    const partner = cleanPartner(row.partner);
    const amount = num(row.amount);
    const kind = expenseKind(row);
    costsPaid[partner] += amount;
    if (kind === EXPENSE_KINDS.DISTRIBUTION) distributionCostsPaid[partner] += amount;
    else shipmentCostsPaid[partner] += amount;
  });

  const revenue = num(shipment && shipment.saleTotal);
  const productTotal = product.totalAmount || num(shipment && shipment.subtotal) || num(shipment && shipment.grandTotal);
  const fundedCans = product.totalCans || num(shipment && shipment.cans);
  const revenueShare = emptyPartners();
  const productProfit = emptyPartners();
  const netGain = emptyPartners();
  PARTNERS.forEach(partner => {
    const ratio = fundedCans > 0
      ? (product.funding[partner].cans / fundedCans)
      : (productTotal > 0 ? product.funding[partner].amount / productTotal : 0);
    revenueShare[partner] = revenue * ratio;
    productProfit[partner] = revenueShare[partner] - product.funding[partner].amount;
    netGain[partner] = productProfit[partner] - costsPaid[partner];
  });

  const extraCosts = costsPaid.Clanny + costsPaid.Clenny;
  const shipmentCosts = shipmentCostsPaid.Clanny + shipmentCostsPaid.Clenny;
  const distributionCosts = distributionCostsPaid.Clanny + distributionCostsPaid.Clenny;
  return {
    productRows: product.rows,
    costRows,
    funding: product.funding,
    productTotal,
    fundedCans,
    extraCosts,
    shipmentCosts,
    distributionCosts,
    costsPaid,
    shipmentCostsPaid,
    distributionCostsPaid,
    allInTotal: productTotal + extraCosts,
    revenue,
    revenueShare,
    productProfit,
    netGain,
    grossProfit: revenue - productTotal,
    netProfit: revenue - productTotal - extraCosts,
  };
}

export function computePartnership(
  shipments: Shipment[],
  purchases: Purchase[],
  expenses: Expense[],
  contributions: Contribution[],
) {
  const contributed = emptyPartners();
  const productFunded = emptyPartners();
  const costsPaid = emptyPartners();
  const shipmentCostsPaid = emptyPartners();
  const distributionCostsPaid = emptyPartners();
  const revenueShare = emptyPartners();
  const productProfit = emptyPartners();
  const netGain = emptyPartners();
  let revenue = 0, productTotal = 0, extraCosts = 0, shipmentCosts = 0, distributionCosts = 0, manualPurchases = 0;

  (contributions || []).forEach(c => {
    const partner = cleanPartner(c.partner);
    contributed[partner] += num(c.amount);
  });

  (purchases || []).forEach(p => {
    const partner = cleanPartner(p.partner);
    const amount = num(p.total);
    manualPurchases += amount;
    productFunded[partner] += amount;
    netGain[partner] -= amount;
  });

  (shipments || []).forEach(s => {
    const f = shipmentFinance(s, expenses);
    revenue += f.revenue;
    productTotal += f.productTotal;
    extraCosts += f.extraCosts;
    shipmentCosts += f.shipmentCosts;
    distributionCosts += f.distributionCosts;
    PARTNERS.forEach(partner => {
      productFunded[partner] += f.funding[partner].amount;
      costsPaid[partner] += f.costsPaid[partner];
      shipmentCostsPaid[partner] += f.shipmentCostsPaid[partner];
      distributionCostsPaid[partner] += f.distributionCostsPaid[partner];
      revenueShare[partner] += f.revenueShare[partner];
      productProfit[partner] += f.productProfit[partner];
      netGain[partner] += f.netGain[partner];
    });
  });

  const generalExpenses = (expenses || [])
    .filter(e => !e.shipmentId && !isProductFunding(e))
    .reduce((sum, e) => {
      const partner = cleanPartner(e.partner);
      const amount = num(e.amount);
      costsPaid[partner] += amount;
      netGain[partner] -= amount;
      return sum + amount;
    }, 0);
  extraCosts += generalExpenses;

  const totalExpenses = productTotal + manualPurchases + extraCosts;
  const totalContributions = contributed.Clanny + contributed.Clenny;
  const netProfit = revenue - totalExpenses;

  return {
    revenue, productTotal, manualPurchases, extraCosts, shipmentCosts, distributionCosts,
    totalExpenses, totalContributions, netProfit, contributed,
    productFunded, costsPaid, shipmentCostsPaid, distributionCostsPaid,
    revenueShare, productProfit, netGain,
    netPosition: { Clanny: netGain.Clanny, Clenny: netGain.Clenny },
  };
}

/* ---- Helpers ---- */
export const fmt = (n: number | string) => Number(n).toLocaleString('en-US');
export const money = (n: number | string, dec = 0) =>
  '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
export const moneyAbs = (n: number) => money(Math.abs(n));

export function fmtDate(iso: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', opts || { month: 'short', day: 'numeric', year: 'numeric' });
}

export function relTime(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  const dd = Math.floor(h / 24);
  if (dd < 7) return dd + 'd ago';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function dayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export const boxWord = (n: number) => n + ' ' + (Number(n) === 1 ? 'box' : 'boxes');
export const avOf = (partner: string) => partner === 'Clanny' ? 'av-3' : 'av-1';

export interface ActivityEvent {
  kind: string;
  who: string;
  act: string;
  obj: string;
  amount: number | null;
  time: string;
  pip: string;
  av: string;
}

export function buildActivity(
  shipments: Shipment[],
  purchases: Purchase[],
  expenses: Expense[],
  contributions: Contribution[],
): ActivityEvent[] {
  const ev: ActivityEvent[] = [];
  const shipmentById = new Map((shipments || []).map(s => [s.id, s]));

  (shipments || []).forEach(s => {
    const f = shipmentFinance(s, expenses);
    ev.push({ kind: 'sent', who: s.sender, act: 'sent a shipment',
      obj: `${boxWord(s.boxes)} · ${s.brand}`, amount: f.productTotal, time: s.createdAt!, pip: 'pip-sent', av: 'av-3' });
    if (s.status === 'received' && s.receivedAt)
      ev.push({ kind: 'received', who: s.receiver, act: 'received', obj: `${s.brand} shipment`,
        amount: f.productTotal, time: s.receivedAt, pip: 'pip-received', av: 'av-1' });
    if (s.status === 'disputed' && s.receivedAt)
      ev.push({ kind: 'disputed', who: s.receiver, act: 'reported an issue on', obj: `${s.brand} shipment`,
        amount: null, time: s.receivedAt, pip: 'pip-disputed', av: 'av-1' });
    if ((Number(s.saleTotal) || 0) > 0 && s.soldAt)
      ev.push({ kind: 'sold', who: s.receiver, act: 'recorded sales for', obj: `${s.brand} shipment`,
        amount: s.saleTotal, time: s.soldAt, pip: 'pip-received', av: 'av-1' });
  });

  (purchases || []).forEach(p => {
    ev.push({ kind: 'purchase', who: p.partner, act: 'logged an older purchase',
      obj: `${p.cans} cans · ${p.brand}`, amount: p.total, time: p.createdAt!, pip: 'pip-purchase', av: avOf(p.partner) });
  });

  (expenses || []).forEach(e => {
    const kind = expenseKind(e);
    const meta = parseExpenseMeta(e) || {};
    const s = shipmentById.get(e.shipmentId!);
    if (kind === EXPENSE_KINDS.PRODUCT) {
      ev.push({ kind: 'funding', who: e.partner, act: 'funded product',
        obj: s ? `${s.brand} · ${fmt(meta.rolls as number || 0)} rolls` : `${fmt(meta.cans as number || 0)} cans`,
        amount: e.amount, time: e.createdAt!, pip: 'pip-purchase', av: avOf(e.partner) });
    } else if (kind === EXPENSE_KINDS.DISTRIBUTION) {
      ev.push({ kind: 'distribution', who: e.partner, act: 'paid distribution cost',
        obj: `${displayExpenseCategory(e)}${s ? ` · ${s.brand}` : ''}`, amount: e.amount, time: e.createdAt!, pip: 'pip-disputed', av: avOf(e.partner) });
    } else {
      ev.push({ kind: 'expense', who: e.partner, act: e.shipmentId ? 'paid shipment cost' : 'logged an expense',
        obj: `${displayExpenseCategory(e)}${s ? ` · ${s.brand}` : ''}`, amount: e.amount, time: e.createdAt!, pip: 'pip-disputed', av: avOf(e.partner) });
    }
  });

  (contributions || []).forEach(c => {
    ev.push({ kind: 'contribution', who: c.partner, act: 'added capital',
      obj: c.description || 'business cash', amount: c.amount, time: c.createdAt!, pip: 'pip-received', av: avOf(c.partner) });
  });

  return ev.filter(e => e.time).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}
