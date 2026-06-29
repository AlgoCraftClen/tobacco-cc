import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Shipment, Purchase, Expense, Contribution, Sale } from './data';

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
    casesPerBox: Number(r.cases_per_box) || 6,
    rollsPerCase: Number(r.rolls_per_case) || 18,
    cansPerRoll: Number(r.cans_per_roll) || 5,
    costPerCase: Number(r.cost_per_case) || 0,
    clennyProductInvest: Number(r.clenny_product_invest) || 0,
    clannyProductInvest: Number(r.clanny_product_invest) || 0,
    targetSalePricePerCan: Number(r.target_sale_price_per_can) || 0,
    status: (r.status as Shipment['status']) || 'pending',
    notes: (r.notes as string) || '',
    createdAt: (r.created_at as string) || null,
    receivedAt: (r.received_at as string) || null,
    soldAt: (r.sold_at as string) || null,
  };
}

function shipmentToRow(s: Partial<Shipment>) {
  return {
    brand: s.brand || 'Grizzly',
    boxes: s.boxes || 0,
    cases_per_box: s.casesPerBox || 6,
    rolls_per_case: s.rollsPerCase || 18,
    cans_per_roll: s.cansPerRoll || 5,
    cost_per_case: s.costPerCase || 0,
    clenny_product_invest: s.clennyProductInvest || 0,
    clanny_product_invest: s.clannyProductInvest || 0,
    target_sale_price_per_can: s.targetSalePricePerCan || 0,
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
    date: (r.date as string) || null,
    approved: Boolean(r.approved) || false,
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
    date: e.date || null,
    approved: e.approved || false,
  };
}

function rowToSale(r: Record<string, unknown>): Sale {
  return {
    id: r.id as string,
    shipmentId: (r.shipment_id as string) || '',
    date: (r.date as string) || '',
    casesSold: Number(r.cases_sold) || 0,
    cansPerCase: Number(r.cans_per_case) || 90,
    totalCans: Number(r.total_cans) || 0,
    pricePerCan: Number(r.price_per_can) || 0,
    revenue: Number(r.revenue) || 0,
    cashCollector: (r.cash_collector as string) || 'Clenny',
    createdAt: (r.created_at as string) || '',
  };
}

function saleToRow(s: Partial<Sale>) {
  return {
    shipment_id: s.shipmentId || '',
    date: s.date || new Date().toISOString(),
    cases_sold: s.casesSold || 0,
    cans_per_case: s.cansPerCase || 90,
    total_cans: s.totalCans || 0,
    price_per_can: s.pricePerCan || 0,
    revenue: s.revenue || 0,
    cash_collector: s.cashCollector || 'Clenny',
  };
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
    update: async (id: string, fields: Record<string, unknown>) => {
      const { error } = await SB.from('expenses').update(fields).eq('id', id);
      if (error) { console.error('expenses.update:', error); throw error; }
    },
  },
  sales: {
    list: async (): Promise<Sale[]> => {
      const { data, error } = await SB.from('sales').select('*').order('created_at', { ascending: false });
      if (error) { console.error('sales.list:', error); return []; }
      return (data || []).map(rowToSale);
    },
    insert: async (s: Partial<Sale>): Promise<Sale> => {
      const { data, error } = await SB.from('sales').insert(saleToRow(s)).select().single();
      if (error) { console.error('sales.insert:', error); throw error; }
      return rowToSale(data);
    },
    delete: async (id: string) => {
      const { error } = await SB.from('sales').delete().eq('id', id);
      if (error) { console.error('sales.delete:', error); throw error; }
    },
  },
  clearAll: async () => {
    const NIL = '00000000-0000-0000-0000-000000000000';
    for (const t of ['shipments_v2', 'purchases', 'expenses', 'contributions', 'sales']) {
      const { error } = await SB.from(t).delete().neq('id', NIL);
      if (error) { console.error('clearAll ' + t + ':', error); throw error; }
    }
  },
};
