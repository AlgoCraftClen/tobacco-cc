import { useState, useCallback, useEffect, createContext, useContext } from 'react';
import { DB } from '../lib/supabase';
import type { Shipment, Purchase, Expense, Contribution, Sale } from '../lib/data';

export interface AppData {
  shipments: Shipment[];
  purchases: Purchase[];
  expenses: Expense[];
  contributions: Contribution[];
  sales: Sale[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useAppData(): AppData {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, e, c, sa] = await Promise.all([
        DB.shipments.list(),
        DB.purchases.list(),
        DB.expenses.list(),
        DB.contributions.list(),
        DB.sales.list(),
      ]);
      setShipments(s);
      setPurchases(p);
      setExpenses(e);
      setContributions(c);
      setSales(sa);
    } catch (err) {
      console.error('refresh error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { shipments, purchases, expenses, contributions, sales, loading, refresh };
}

import React from 'react';

const AppDataContext = createContext<AppData | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const data = useAppData();
  return React.createElement(AppDataContext.Provider, { value: data }, children);
}

export function useData(): AppData {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useData must be used within AppDataProvider');
  return ctx;
}
