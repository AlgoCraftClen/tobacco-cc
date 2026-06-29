import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Sheet from './Sheet';
import { ReviewRow, Btn, Input, Field, PartnerPick } from './Ui';
import { deriveUnits, money, fmt, boxWord, type Shipment, type Expense } from '../lib/data';
import { DB } from '../lib/supabase';
import { useData } from '../hooks/useAppData';
import { useToast } from './Toast';
import { colors, radius } from '../theme';

const todayISO = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

interface RecordSaleSheetProps {
  shipment: Shipment | null;
  expenses: Expense[];
  onClose: () => void;
}

export default function RecordSaleSheet({ shipment, onClose }: RecordSaleSheetProps) {
  const { sales, refresh } = useData();
  const { showToast } = useToast();
  const [casesSold, setCasesSold] = useState('1');
  const [price, setPrice] = useState('12.00');
  const [cashCollector, setCashCollector] = useState('Clenny');
  const [date, setDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (shipment) {
      setCasesSold('1');
      setPrice('12.00');
      setCashCollector('Clenny');
      setDate(todayISO());
    }
  }, [shipment]);

  if (!shipment) return null;

  const units = deriveUnits(shipment);
  const cases = Number(casesSold) || 0;
  const cansPerCase = units.cansPerCase;
  const totalCans = cases * cansPerCase;
  const pricePerCan = Number(price) || 0;
  const revenue = totalCans * pricePerCan;

  const shipmentSales = sales.filter(s => s.shipmentId === shipment.id);
  const existingSoldCans = shipmentSales.reduce((sum, s) => sum + (s.totalCans || 0), 0);
  const remainingCans = Math.max(0, units.totalCans - existingSoldCans);
  const soldOver = totalCans > remainingCans;
  const valid = cases > 0 && pricePerCan > 0 && !soldOver && date.length > 0;

  const save = async () => {
    setSaving(true);
    try {
      await DB.sales.insert({
        shipmentId: shipment.id,
        date,
        casesSold: cases,
        cansPerCase,
        totalCans,
        pricePerCan,
        revenue,
        cashCollector,
      });
      await refresh();
      showToast('Sale recorded');
      onClose();
    } catch {
      showToast("Couldn't save — check connection");
    }
    setSaving(false);
  };

  return (
    <Sheet open={!!shipment} onClose={onClose} title={`Add Sale · ${shipment.brand}`} icon="dollar">
      <View style={styles.reviewCard}>
        <ReviewRow k="Shipment" v={`${shipment.brand} · ${boxWord(shipment.boxes)}`} />
        <ReviewRow k="Total cans" v={fmt(units.totalCans)} />
        <ReviewRow k="Already sold" v={`${fmt(existingSoldCans)} cans`} />
        <ReviewRow k="Available" v={fmt(remainingCans)} />
      </View>

      <Field label="Date" style={{ marginTop: 14 }}>
        <Input value={date} onChange={setDate} placeholder="YYYY-MM-DD" />
      </Field>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Field label="Cases sold" style={{ flex: 1 }}>
          <Input value={casesSold} onChange={setCasesSold} placeholder="1" inputMode="decimal" />
        </Field>
        <Field label="Price / can" style={{ flex: 1 }}>
          <Input value={price} onChange={setPrice} placeholder="12.00" inputMode="decimal" />
        </Field>
      </View>

      <Field label="Cash collector">
        <PartnerPick partner={cashCollector} setPartner={setCashCollector} />
      </Field>

      <View style={styles.reviewCard}>
        <ReviewRow k="Cans per case" v={fmt(cansPerCase)} />
        <ReviewRow k="Total cans" v={fmt(totalCans)} />
        <ReviewRow k="Revenue" v={money(revenue, 2)} total />
      </View>

      {soldOver && (
        <Text style={styles.warning}>This sale exceeds available inventory ({fmt(remainingCans)} cans left).</Text>
      )}

      <View style={{ height: 14 }} />
      <Btn variant="primary" onPress={save} disabled={!valid || saving} fullWidth icon="check">
        {saving ? 'Saving…' : 'Save Sale'}
      </Btn>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  reviewCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 14,
  },
  warning: { color: colors.danger, fontSize: 12, padding: 10 },
});
