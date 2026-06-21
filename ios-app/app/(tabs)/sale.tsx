import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '../../src/hooks/useAppData';
import { TO_CANS, money, fmt, fmtDate, type SaleEntry } from '../../src/lib/data';
import { DB } from '../../src/lib/supabase';
import { colors, radius } from '../../src/theme';
import Icon from '../../src/components/Icon';
import Sheet from '../../src/components/Sheet';
import { SkeletonList, EmptyState, ReviewRow, Field, BigInput, Btn } from '../../src/components/Ui';
import { useToast } from '../../src/components/Toast';

const fmtQty = (n: number) => {
  const x = Number(n) || 0;
  return Number.isInteger(x) ? fmt(x) : x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

function SaleRow({ sale, onDelete }: { sale: SaleEntry; onDelete: (s: SaleEntry) => void }) {
  const cases = Number(sale.quantityCases) || ((Number(sale.cans) || 0) / TO_CANS.Case);
  const cans = Number(sale.cans) || 0;
  const pricePerCan = Number(sale.pricePerCan) || 0;
  const revenue = Number(sale.revenue) || cans * pricePerCan;

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={[styles.cardIco, { backgroundColor: colors.accentSoft }]}>
          <Icon name="reports" size={18} color={colors.accent} />
        </View>
        <View style={styles.cardMain}>
          <Text style={styles.cardTitle}>Sale #{sale.saleNo}</Text>
          <Text style={styles.cardSub}>{fmtQty(cases)} case{cases === 1 ? '' : 's'} · {fmt(cans)} cans · {fmtDate(sale.createdAt)}</Text>
        </View>
        <Text style={styles.cardAmt}>{money(revenue, 2)}</Text>
        <TouchableOpacity onPress={() => onDelete(sale)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="trash" size={15} color={colors.text4} />
        </TouchableOpacity>
      </View>
      <View style={styles.calcGrid}>
        <View style={styles.calcCell}>
          <Text style={styles.calcK}>Quantity</Text>
          <Text style={styles.calcV}>{fmtQty(cases)} case{cases === 1 ? '' : 's'}</Text>
        </View>
        <View style={styles.calcCell}>
          <Text style={styles.calcK}>Cans</Text>
          <Text style={styles.calcV}>{fmt(cans)}</Text>
        </View>
        <View style={styles.calcCell}>
          <Text style={styles.calcK}>Price/Can</Text>
          <Text style={styles.calcV}>{money(pricePerCan, 2)}</Text>
        </View>
        <View style={[styles.calcCell, styles.calcCellAccent]}>
          <Text style={[styles.calcK, { color: colors.accent }]}>Revenue</Text>
          <Text style={[styles.calcV, { color: colors.accent }]}>{money(revenue, 2)}</Text>
        </View>
      </View>
    </View>
  );
}

function AddSaleSheet({ open, onClose, nextNo }: { open: boolean; onClose: () => void; nextNo: number }) {
  const { sales, refresh } = useData();
  const { showToast } = useToast();
  const [quantityCases, setQuantityCases] = useState('1');
  const [price, setPrice] = useState('12.00');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (open) { setQuantityCases('1'); setPrice('12.00'); }
  }, [open]);

  const cases = Number(quantityCases) || 0;
  const cans = cases * TO_CANS.Case;
  const pricePerCan = Number(price) || 0;
  const revenue = cans * pricePerCan;
  const valid = cases > 0 && pricePerCan > 0;

  const save = async () => {
    setSaving(true);
    try {
      await DB.sales.insert({ quantityCases: cases, cans, pricePerCan });
      await refresh();
      showToast(`Sale #${nextNo} added`);
      onClose();
    } catch { showToast("Couldn't save sale"); }
    setSaving(false);
  };

  return (
    <Sheet open={open} onClose={onClose} title={`Add Sale #${nextNo}`} icon="dollar">
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Field label="Quantity (cases)" style={{ flex: 1 }}>
          <BigInput value={quantityCases} onChange={setQuantityCases} placeholder="1" inputMode="decimal" autoFocus />
        </Field>
        <Field label="Price / can" style={{ flex: 1 }}>
          <BigInput value={price} onChange={setPrice} prefix="$" placeholder="12.00" inputMode="decimal" />
        </Field>
      </View>
      <View style={styles.reviewCard}>
        <ReviewRow k="Cans" v={fmt(cans)} />
        <ReviewRow k="Revenue" v={money(revenue, 2)} total />
      </View>
      <View style={{ height: 14 }} />
      <Btn variant="primary" onPress={save} disabled={!valid || saving} fullWidth icon="check">
        {saving ? 'Saving…' : `Save Sale #${nextNo}`}
      </Btn>
    </Sheet>
  );
}

export default function SaleScreen() {
  const { sales, loading, refresh } = useData();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [addOpen, setAddOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  const nextNo = sales.reduce((m, s) => Math.max(m, Number(s.saleNo) || 0), 0) + 1;
  const totalRevenue = sales.reduce((s, r) => s + (Number(r.revenue) || 0), 0);
  const totalCans = sales.reduce((s, r) => s + (Number(r.cans) || 0), 0);

  const deleteSale = (sale: SaleEntry) => {
    Alert.alert('Delete sale?', `Remove Sale #${sale.saleNo}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await DB.sales.delete(sale.id); await refresh(); showToast(`Sale #${sale.saleNo} removed`); }
          catch { showToast("Couldn't remove — check connection"); }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: 12, paddingHorizontal: 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <View>
            <Text style={styles.pageTitle}>Sales Report</Text>
            <Text style={styles.pageDesc}>{sales.length} sale{sales.length !== 1 ? 's' : ''} · {money(totalRevenue, 2)} total</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setAddOpen(true)} activeOpacity={0.8}>
            <Icon name="plus" size={15} color="#fff" />
            <Text style={styles.addBtnText}>Add Sale</Text>
          </TouchableOpacity>
        </View>

        {sales.length > 0 && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total revenue</Text>
              <Text style={styles.summaryValue}>{money(totalRevenue, 2)}</Text>
            </View>
            <View style={[styles.summaryItem, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
              <Text style={styles.summaryLabel}>Total cans sold</Text>
              <Text style={styles.summaryValue}>{fmt(totalCans)}</Text>
            </View>
          </View>
        )}

        {loading ? <SkeletonList count={3} /> :
          sales.length > 0 ? (
            <View style={{ gap: 10 }}>
              {sales.map(s => <SaleRow key={s.id} sale={s} onDelete={deleteSale} />)}
            </View>
          ) : (
            <EmptyState icon="reports" title="No sales yet" desc="Add a sale entry to track your running sales" />
          )
        }
      </ScrollView>

      <AddSaleSheet open={addOpen} onClose={() => setAddOpen(false)} nextNo={nextNo} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  pageTitle: { color: colors.text, fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  pageDesc: { color: colors.text3, fontSize: 13, marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.accent, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  summaryRow: {
    flexDirection: 'row', backgroundColor: colors.panel, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, marginBottom: 14, overflow: 'hidden',
  },
  summaryItem: { flex: 1, padding: 14 },
  summaryLabel: { color: colors.text3, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  summaryValue: { color: colors.text, fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  card: {
    backgroundColor: colors.panel, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  cardIco: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardMain: { flex: 1, minWidth: 0 },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  cardSub: { color: colors.text3, fontSize: 12, marginTop: 2 },
  cardAmt: { color: colors.text, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  calcGrid: { flexDirection: 'row', gap: 1, paddingHorizontal: 14, paddingBottom: 14 },
  calcCell: {
    flex: 1, backgroundColor: colors.panel2, borderRadius: radius.sm,
    padding: 9, alignItems: 'center', marginHorizontal: 2, borderWidth: 1, borderColor: colors.border,
  },
  calcCellAccent: { backgroundColor: colors.accentSofter, borderColor: colors.accentLine },
  calcK: { color: colors.text4, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  calcV: { color: colors.text, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  reviewCard: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 4 },
});
