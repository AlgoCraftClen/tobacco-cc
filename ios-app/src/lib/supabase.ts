import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Shipment, Purchase, Expense, Contribution, SaleEntry } from './data';

const SUPABASE_URL = 'https://njpkqemgpbstrbsaxpbz.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qcGtxZW1ncGJzdHJic2F4cGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMjc3NDYsImV4cCI6MjA5NjcwMzc0Nn0.IKEqP0XW7hcVi-p65hUTyS2pApv7gZLt2dlMiwKbuX8';

export const SB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
  global: {
    headers: {
      'x-cc-app-secret': 'CC_TOBACCO_SECRET_2026',
    },
  },
});

/* ---- Row mappers ---- */
function rowToShipment(r: Record<string, unknown>): Shipment {
  return {
    id: r.id as string,
    brand: (r.brand as string) || 'Grizzly',
    boxes: Number(r.boxes) || 0,
    cases: Number(r.cases) || 0,
    rolls: Number(r.rolls) || 0,
    cans: Number(r.cans) || 0,
    pricePerCan: Number(r.price_per_can) || 0,
    subtotal: Number(r.subtotal) || 0,
    miscCost: Number(r.misc_cost) || 0,
    miscDesc: (r.misc_desc as string) || '',
    grandTotal: Number(r.grand_total) || 0,
    sender: (r.sender as string) || 'Clanny',
    receiver: (r.receiver as string) || 'Clenny',
    status: (r.status as Shipment['status']) || 'pending',
    notes: (r.notes as string) || '',
    createdAt: (r.created_at as string) || null,
    receivedAt: (r.received_at as string) || null,
    saleTotal: Number(r.sale_total) || 0,
    salePricePerCan: Number(r.sale_price_per_can) || 0,
    soldAt: (r.sold_at as string) || null,
  };
}

function shipmentToRow(s: Partial<Shipment>) {
  return {
    brand: s.brand || 'Grizzly',
    boxes: s.boxes || 0,
    cases: s.cases || 0,
    rolls: s.rolls || 0,
    cans: s.cans || 0,
    price_per_can: s.pricePerCan || 0,
    subtotal: s.subtotal || 0,
    misc_cost: s.miscCost || 0,
    misc_desc: s.miscDesc || '',
    grand_total: s.grandTotal || 0,
    sender: s.sender || 'Clanny',
    receiver: s.receiver || 'Clenny',
    status: s.status || 'pending',
    notes: s.notes || '',
  };
}

function rowToPurchase(r: Record<string, unknown>): Purchase {
  return {
    id: r.id as string,
    partner: (r.partner as string) || 'Clanny',
    brand: (r.brand as string) || 'Grizzly',
    cans: Number(r.cans) || 0,
    pricePerCan: Number(r.price_per_can) || 0,
    total: Number(r.total) || 0,
    createdAt: (r.created_at as string) || null,
  };
}

function purchaseToRow(p: Partial<Purchase>) {
  return {
    partner: p.partner || 'Clanny',
    brand: p.brand || 'Grizzly',
    cans: p.cans || 0,
    price_per_can: p.pricePerCan || 0,
    total: p.total || 0,
  };
}

function rowToContribution(r: Record<string, unknown>): Contribution {
  return {
    id: r.id as string,
    partner: (r.partner as string) || 'Clanny',
    amount: Number(r.amount) || 0,
    description: (r.description as string) || '',
    createdAt: (r.created_at as string) || null,
  };
}

function contributionToRow(c: Partial<Contribution>) {
  return { partner: c.partner || 'Clanny', amount: c.amount || 0, description: c.description || '' };
}

function rowToExpense(r: Record<string, unknown>): Expense {
  return {
    id: r.id as string,
    partner: (r.partner as string) || 'Clanny',
    amount: Number(r.amount) || 0,
    category: (r.category as string) || '',
    description: (r.description as string) || '',
    shipmentId: (r.shipment_id as string) || null,
    createdAt: (r.created_at as string) || null,
  };
}

function expenseToRow(e: Partial<Expense>) {
  return {
    partner: e.partner || 'Clanny',
    amount: e.amount || 0,
    category: e.category || '',
    description: e.description || '',
    shipment_id: e.shipmentId || null,
  };
}

/* ---- Sales (device-local via AsyncStorage) ---- */
const SALES_KEY = 'cc_running_sales';

async function readSales(): Promise<SaleEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(SALES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

async function writeSales(sales: SaleEntry[]) {
  await AsyncStorage.setItem(SALES_KEY, JSON.stringify(sales || []));
}

/* ---- Public DB API ---- */
export const DB = {
  shipments: {
    list: async (): Promise<Shipment[]> => {
      const { data, error } = await SB.from('shipments_v2').select('*').order('created_at', { ascending: false });
      if (error) { console.error('shipments.list:', error); return []; }
      return (data || []).map(rowToShipment);
    },
    insert: async (s: Partial<Shipment>): Promise<Shipment> => {
      const { data, error } = await SB.from('shipments_v2').insert(shipmentToRow(s)).select().single();
      if (error) { console.error('shipments.insert:', error); throw error; }
      return rowToShipment(data);
    },
    update: async (id: string, fields: Record<string, unknown>) => {
      const { error } = await SB.from('shipments_v2').update(fields).eq('id', id);
      if (error) { console.error('shipments.update:', error); throw error; }
    },
    receive: async (id: string) => {
      const { error } = await SB.from('shipments_v2')
        .update({ status: 'received', received_at: new Date().toISOString() }).eq('id', id);
      if (error) { console.error('shipments.receive:', error); throw error; }
    },
    dispute: async (id: string, note: string) => {
      const { error } = await SB.from('shipments_v2')
        .update({ status: 'disputed', notes: note || '', received_at: new Date().toISOString() }).eq('id', id);
      if (error) { console.error('shipments.dispute:', error); throw error; }
    },
    recordSale: async (id: string, { salePricePerCan, saleTotal }: { salePricePerCan: number; saleTotal: number }) => {
      const { error } = await SB.from('shipments_v2')
        .update({ sale_price_per_can: salePricePerCan || 0, sale_total: saleTotal || 0, sold_at: new Date().toISOString() })
        .eq('id', id);
      if (error) { console.error('shipments.recordSale:', error); throw error; }
    },
    delete: async (id: string) => {
      const { error } = await SB.from('shipments_v2').delete().eq('id', id);
      if (error) { console.error('shipments.delete:', error); throw error; }
    },
  },
  purchases: {
    list: async (): Promise<Purchase[]> => {
      const { data, error } = await SB.from('purchases').select('*').order('created_at', { ascending: false });
      if (error) { console.error('purchases.list:', error); return []; }
      return (data || []).map(rowToPurchase);
    },
    insert: async (p: Partial<Purchase>): Promise<Purchase> => {
      const { data, error } = await SB.from('purchases').insert(purchaseToRow(p)).select().single();
      if (error) { console.error('purchases.insert:', error); throw error; }
      return rowToPurchase(data);
    },
    delete: async (id: string) => {
      const { error } = await SB.from('purchases').delete().eq('id', id);
      if (error) { console.error('purchases.delete:', error); throw error; }
    },
  },
  contributions: {
    list: async (): Promise<Contribution[]> => {
      const { data, error } = await SB.from('contributions').select('*').order('created_at', { ascending: false });
      if (error) { console.error('contributions.list:', error); return []; }
      return (data || []).map(rowToContribution);
    },
    insert: async (c: Partial<Contribution>): Promise<Contribution> => {
      const { data, error } = await SB.from('contributions').insert(contributionToRow(c)).select().single();
      if (error) { console.error('contributions.insert:', error); throw error; }
      return rowToContribution(data);
    },
    delete: async (id: string) => {
      const { error } = await SB.from('contributions').delete().eq('id', id);
      if (error) { console.error('contributions.delete:', error); throw error; }
    },
  },
  expenses: {
    list: async (): Promise<Expense[]> => {
      const { data, error } = await SB.from('expenses').select('*').order('created_at', { ascending: false });
      if (error) { console.error('expenses.list:', error); return []; }
      return (data || []).map(rowToExpense);
    },
    insert: async (e: Partial<Expense>): Promise<Expense> => {
      const { data, error } = await SB.from('expenses').insert(expenseToRow(e)).select().single();
      if (error) { console.error('expenses.insert:', error); throw error; }
      return rowToExpense(data);
    },
    delete: async (id: string) => {
      const { error } = await SB.from('expenses').delete().eq('id', id);
      if (error) { console.error('expenses.delete:', error); throw error; }
    },
  },
  sales: {
    list: async (): Promise<SaleEntry[]> => readSales(),
    insert: async (s: Partial<SaleEntry>): Promise<SaleEntry> => {
      const rows = await readSales();
      const nextNo = rows.reduce((m, x) => Math.max(m, Number(x.saleNo) || 0), 0) + 1;
      const cans = Number(s.cans) || ((Number(s.quantityCases) || 0) * 90);
      const pricePerCan = Number(s.pricePerCan) || 0;
      const row: SaleEntry = {
        id: 'sale-' + Date.now(),
        saleNo: nextNo,
        quantityCases: Number(s.quantityCases) || cans / 90,
        cans,
        pricePerCan,
        revenue: cans * pricePerCan,
        createdAt: new Date().toISOString(),
      };
      await writeSales([row, ...rows]);
      return row;
    },
    delete: async (id: string) => {
      const rows = await readSales();
      await writeSales(rows.filter(s => s.id !== id));
    },
  },
  clearAll: async () => {
    const NIL = '00000000-0000-0000-0000-000000000000';
    for (const t of ['shipments_v2', 'purchases', 'expenses', 'contributions']) {
      const { error } = await SB.from(t).delete().neq('id', NIL);
      if (error) { console.error('clearAll ' + t + ':', error); throw error; }
    }
    await writeSales([]);
  },
};
