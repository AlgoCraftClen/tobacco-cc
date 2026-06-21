import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Sheet from './Sheet';
import { ReviewRow, Btn, Input, Field } from './Ui';
import Icon from './Icon';
import { shipmentFinance, money, fmt, boxWord, EXPENSE_KINDS, makeExpenseDescription, type Shipment, type Expense } from '../lib/data';
import { DB } from '../lib/supabase';
import { useData } from '../hooks/useAppData';
import { useToast } from './Toast';
import { colors, radius } from '../theme';

interface SaleLine { cans: string; price: string }
interface ExpLine { partner: string; category: string; amount: string }

interface RecordSaleSheetProps {
  shipment: Shipment | null;
  expenses: Expense[];
  onClose: () => void;
}

export default function RecordSaleSheet({ shipment, expenses, onClose }: RecordSaleSheetProps) {
  const { refresh } = useData();
  const { showToast } = useToast();
  const [saleLines, setSaleLines] = useState<SaleLine[]>([{ cans: '', price: '' }]);
  const [expLines, setExpLines] = useState<ExpLine[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (shipment) { setSaleLines([{ cans: '', price: '' }]); setExpLines([]); }
  }, [shipment]);

  if (!shipment) return null;

  const finance = shipmentFinance(shipment, expenses);
  const totalCans = Number(shipment.cans) || 0;
  const existingSaleTotal = Number(shipment.saleTotal) || 0;
  const existingAvgPrice = Number(shipment.salePricePerCan) || 0;
  const existingSoldCans = existingSaleTotal > 0 && existingAvgPrice > 0 ? existingSaleTotal / existingAvgPrice : 0;
  const remainingCans = Math.max(0, totalCans - existingSoldCans);

  const newSoldCans = saleLines.reduce((s, l) => s + (Number(l.cans) || 0), 0);
  const newSaleTotal = saleLines.reduce((s, l) => s + ((Number(l.cans) || 0) * (Number(l.price) || 0)), 0);
  const aggregateSoldCans = existingSoldCans + newSoldCans;
  const aggregateSaleTotal = existingSaleTotal + newSaleTotal;
  const aggregateAvgPrice = aggregateSoldCans > 0 ? aggregateSaleTotal / aggregateSoldCans : 0;
  const newDistributionCosts = expLines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const productGain = aggregateSaleTotal - finance.productTotal;
  const netGain = aggregateSaleTotal - finance.productTotal - finance.extraCosts - newDistributionCosts;
  const soldOver = newSoldCans > remainingCans;
  const valid = newSoldCans > 0 && newSaleTotal > 0 && !soldOver;

  const updateLine = (i: number, key: keyof SaleLine, val: string) =>
    setSaleLines(saleLines.map((l, idx) => idx === i ? { ...l, [key]: val } : l));
  const addLine = () => setSaleLines([...saleLines, { cans: '', price: '' }]);
  const removeLine = (i: number) =>
    setSaleLines(saleLines.length === 1 ? [{ cans: '', price: '' }] : saleLines.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    try {
      await DB.shipments.recordSale(shipment.id, { salePricePerCan: aggregateAvgPrice, saleTotal: aggregateSaleTotal });
      for (const l of expLines) {
        const amt = Number(l.amount) || 0;
        if (amt > 0) await DB.expenses.insert({
          partner: l.partner,
          amount: amt,
          category: l.category,
          description: makeExpenseDescription(EXPENSE_KINDS.DISTRIBUTION, { category: l.category }),
          shipmentId: shipment.id,
        });
      }
      await refresh();
      showToast('Sale recorded');
      onClose();
    } catch { showToast("Couldn't save — check connection"); }
    setSaving(false);
  };

  return (
    <Sheet open={!!shipment} onClose={onClose} title={existingSaleTotal > 0 ? 'Add sale' : 'Record sale'} icon="dollar">
      <View style={styles.reviewCard}>
        <ReviewRow k="Shipment" v={`${shipment.brand} · ${boxWord(shipment.boxes)}`} />
        <ReviewRow k="Total cans" v={fmt(totalCans)} />
        {existingSoldCans > 0 && <ReviewRow k="Already sold" v={`${fmt(existingSoldCans)} cans · ${money(existingSaleTotal)}`} />}
        <ReviewRow k="Available" v={fmt(remainingCans)} />
        <ReviewRow k="Product funded" v={money(finance.productTotal)} total />
      </View>

      <Text style={styles.label}>Sale batches</Text>
      {saleLines.map((line, i) => (
        <View key={i} style={styles.saleLine}>
          <Input value={line.cans} onChange={v => updateLine(i, 'cans', v)} placeholder="Cans sold" inputMode="numeric" />
          <View style={styles.salePriceWrap}>
            <Text style={styles.cur}>$</Text>
            <Input value={line.price} onChange={v => updateLine(i, 'price', v)} placeholder="Price/can" inputMode="decimal" />
          </View>
          <TouchableOpacity onPress={() => removeLine(i)} style={styles.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="x" size={15} color={colors.text4} />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity onPress={addLine} style={styles.addLine} activeOpacity={0.7}>
        <Icon name="plus" size={13} color={colors.accent} />
        <Text style={styles.addLineText}>Add sale line</Text>
      </TouchableOpacity>

      {(newSoldCans > 0 || existingSaleTotal > 0) && (
        <View style={[styles.reviewCard, { marginTop: 12 }]}>
          {newSoldCans > 0 && <ReviewRow k={`${fmt(newSoldCans)} cans in this sale`} v={money(newSaleTotal)} />}
          <ReviewRow k="Total sold" v={`${fmt(aggregateSoldCans)} cans · ${money(aggregateSaleTotal)}`} />
          <ReviewRow k="Avg sale price" v={money(aggregateAvgPrice, 2)} />
          <ReviewRow k="Product gain" v={money(productGain)} />
          <ReviewRow k={netGain >= 0 ? 'Net gain after costs' : 'Net loss after costs'} v={money(netGain)} total />
          {soldOver && <Text style={styles.warning}>This sale is more than the available cans.</Text>}
        </View>
      )}

      <View style={{ height: 14 }} />
      <Btn variant="primary" onPress={save} disabled={!valid || saving} fullWidth icon="check">
        {saving ? 'Saving…' : existingSaleTotal > 0 ? 'Add Sale' : 'Record Sale'}
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
  label: { color: colors.text2, fontSize: 12.5, fontWeight: '600', letterSpacing: 0.2, marginBottom: 8 },
  saleLine: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  salePriceWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  cur: { color: colors.text3, fontSize: 15 },
  removeBtn: { padding: 4 },
  addLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, alignSelf: 'flex-start' },
  addLineText: { color: colors.accent, fontSize: 13, fontWeight: '500' },
  warning: { color: colors.danger, fontSize: 12, padding: 10 },
});
