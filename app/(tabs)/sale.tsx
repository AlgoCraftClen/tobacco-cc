import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '../../src/hooks/useAppData';
import { deriveUnits, computeShipmentSettlement, money, fmt, fmtDate, type Sale, type Shipment } from '../../src/lib/data';
import { DB } from '../../src/lib/supabase';
import { colors, radius } from '../../src/theme';
import Icon from '../../src/components/Icon';
import Sheet from '../../src/components/Sheet';
import { ShipBadge } from '../../src/components/Badge';
import { SkeletonList, EmptyState, ReviewRow, Field, BigInput, Input, PartnerPick, Btn } from '../../src/components/Ui';
import { useToast } from '../../src/components/Toast';

const todayISO = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

function SaleRow({ sale, onDelete }: { sale: Sale; onDelete: (s: Sale) => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={[styles.cardIco, { backgroundColor: colors.accentSoft }]}>
          <Icon name="reports" size={18} color={colors.accent} />
        </View>
        <View style={styles.cardMain}>
          <Text style={styles.cardTitle}>Sale · {fmtDate(sale.date)}</Text>
          <Text style={styles.cardSub}>{fmt(sale.casesSold)} cases · {fmt(sale.totalCans)} cans · {money(sale.pricePerCan, 2)}/can</Text>
        </View>
        <Text style={styles.cardAmt}>{money(sale.revenue, 2)}</Text>
        <TouchableOpacity onPress={() => onDelete(sale)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="trash" size={15} color={colors.text4} />
        </TouchableOpacity>
      </View>
      <View style={styles.calcGrid}>
        <View style={styles.calcCell}>
          <Text style={styles.calcK}>Cases</Text>
          <Text style={styles.calcV}>{fmt(sale.casesSold)}</Text>
        </View>
        <View style={styles.calcCell}>
          <Text style={styles.calcK}>Cans</Text>
          <Text style={styles.calcV}>{fmt(sale.totalCans)}</Text>
        </View>
        <View style={styles.calcCell}>
          <Text style={styles.calcK}>Price/Can</Text>
          <Text style={styles.calcV}>{money(sale.pricePerCan, 2)}</Text>
        </View>
        <View style={[styles.calcCell, styles.calcCellAccent]}>
          <Text style={[styles.calcK, { color: colors.accent }]}>Revenue</Text>
          <Text style={[styles.calcV, { color: colors.accent }]}>{money(sale.revenue, 2)}</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.cardFooterText}>Cash collected by <Text style={{ fontWeight: '700' }}>{sale.cashCollector}</Text></Text>
      </View>
    </View>
  );
}

function AddSaleSheet({
  open,
  onClose,
  shipment,
}: {
  open: boolean;
  onClose: () => void;
  shipment: Shipment | null;
}) {
  const { refresh } = useData();
  const { showToast } = useToast();
  const [casesSold, setCasesSold] = useState('1');
  const [price, setPrice] = useState('12.00');
  const [cashCollector, setCashCollector] = useState('Clenny');
  const [date, setDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (open) {
      setCasesSold('1');
      setPrice('12.00');
      setCashCollector('Clenny');
      setDate(todayISO());
    }
  }, [open]);

  if (!shipment) return null;

  const units = deriveUnits(shipment);
  const cases = Number(casesSold) || 0;
  const cansPerCase = units.cansPerCase;
  const totalCans = cases * cansPerCase;
  const pricePerCan = Number(price) || 0;
  const revenue = totalCans * pricePerCan;
  const valid = cases > 0 && pricePerCan > 0 && date.length > 0;

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
      showToast("Couldn't save sale");
    }
    setSaving(false);
  };

  return (
    <Sheet open={open} onClose={onClose} title={`Add Sale · ${shipment.brand}`} icon="dollar">
      <View style={styles.reviewCard}>
        <ReviewRow k="Shipment" v={`${shipment.brand} · ${shipment.boxes} boxes`} />
        <ReviewRow k="Cans per case" v={fmt(cansPerCase)} />
        <ReviewRow k="Available cases" v={fmt(units.cases)} />
      </View>

      <Field label="Date" style={{ marginTop: 14 }}>
        <Input value={date} onChange={setDate} placeholder="YYYY-MM-DD" />
      </Field>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Field label="Cases sold" style={{ flex: 1 }}>
          <BigInput value={casesSold} onChange={setCasesSold} placeholder="1" inputMode="decimal" autoFocus />
        </Field>
        <Field label="Price / can" style={{ flex: 1 }}>
          <BigInput value={price} onChange={setPrice} prefix="$" placeholder="12.00" inputMode="decimal" />
        </Field>
      </View>

      <Field label="Cash collector">
        <PartnerPick partner={cashCollector} setPartner={setCashCollector} />
      </Field>

      <View style={styles.reviewCard}>
        <ReviewRow k="Total cans" v={fmt(totalCans)} />
        <ReviewRow k="Revenue" v={money(revenue, 2)} total />
      </View>

      <View style={{ height: 14 }} />
      <Btn variant="primary" onPress={save} disabled={!valid || saving} fullWidth icon="check">
        {saving ? 'Saving…' : 'Save Sale'}
      </Btn>
    </Sheet>
  );
}

export default function SaleScreen() {
  const { shipments, sales, loading, refresh } = useData();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [addOpen, setAddOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);

  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  const selectedShipment = shipments.find(s => s.id === selectedShipmentId) || shipments.find(s => s.status === 'received') || null;
  const shipmentSales = selectedShipment
    ? sales.filter(s => s.shipmentId === selectedShipment.id)
    : [];

  const totalRevenue = shipmentSales.reduce((s, r) => s + (r.revenue || 0), 0);
  const totalCans = shipmentSales.reduce((s, r) => s + (r.totalCans || 0), 0);

  const settlement = selectedShipment
    ? computeShipmentSettlement(selectedShipment, [], sales)
    : null;

  const deleteSale = (sale: Sale) => {
    Alert.alert('Delete sale?', `Remove sale from ${fmtDate(sale.date)}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await DB.sales.delete(sale.id); await refresh(); showToast('Sale removed'); }
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
            <Text style={styles.pageTitle}>Sales</Text>
            <Text style={styles.pageDesc}>{shipmentSales.length} sale{shipmentSales.length !== 1 ? 's' : ''} · {money(totalRevenue, 2)} total</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setAddOpen(true)} activeOpacity={0.8}>
            <Icon name="plus" size={15} color="#fff" />
            <Text style={styles.addBtnText}>Add Sale</Text>
          </TouchableOpacity>
        </View>

        {shipments.length > 0 && (
          <>
            <Text style={styles.pickerLabel}>Select shipment</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {shipments.map(s => {
                  const active = selectedShipment?.id === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.shipmentChip, active && styles.shipmentChipActive]}
                      onPress={() => setSelectedShipmentId(s.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.shipmentChipText, active && { color: colors.accent, fontWeight: '700' }]}>
                        {s.brand} · {s.boxes} boxes
                      </Text>
                      <ShipBadge status={s.status} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </>
        )}

        {selectedShipment && settlement && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Gross sales</Text>
              <Text style={styles.summaryValue}>{money(settlement.grossSalesToDate, 2)}</Text>
            </View>
            <View style={[styles.summaryItem, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
              <Text style={styles.summaryLabel}>Inventory sold</Text>
              <Text style={styles.summaryValue}>{fmt(settlement.inventorySoldCans)} cans</Text>
            </View>
            <View style={[styles.summaryItem, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
              <Text style={styles.summaryLabel}>Remaining</Text>
              <Text style={styles.summaryValue}>{fmt(settlement.inventoryRemainingCans)} cans</Text>
            </View>
          </View>
        )}

        {selectedShipment && settlement && (
          <View style={[styles.summaryRow, { marginBottom: 14 }]}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Cash · Clenny</Text>
              <Text style={styles.summaryValue}>{money(settlement.cashCollectedByClenny, 2)}</Text>
            </View>
            <View style={[styles.summaryItem, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
              <Text style={styles.summaryLabel}>Cash · Clanny</Text>
              <Text style={styles.summaryValue}>{money(settlement.cashCollectedByClanny, 2)}</Text>
            </View>
          </View>
        )}

        {loading ? <SkeletonList count={3} /> :
          shipmentSales.length > 0 ? (
            <View style={{ gap: 10 }}>
              {shipmentSales.map(s => <SaleRow key={s.id} sale={s} onDelete={deleteSale} />)}
            </View>
          ) : selectedShipment ? (
            <EmptyState icon="reports" title="No sales yet" desc="Add a sale entry for this shipment" />
          ) : (
            <EmptyState icon="send" title="No shipment selected" desc="Select a shipment to view and add sales" />
          )
        }
      </ScrollView>

      <AddSaleSheet open={addOpen} onClose={() => setAddOpen(false)} shipment={selectedShipment} />
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
  pickerLabel: {
    color: colors.text2, fontSize: 12.5, fontWeight: '600',
    marginBottom: 8,
  },
  shipmentChip: {
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    gap: 6,
    alignItems: 'center',
    minWidth: 120,
  },
  shipmentChipActive: {
    borderColor: colors.accentLine,
    backgroundColor: colors.accentSofter,
  },
  shipmentChipText: {
    color: colors.text,
    fontSize: 12.5,
    fontWeight: '500',
  },
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
  cardFooter: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cardFooterText: { color: colors.text3, fontSize: 12 },
  calcGrid: { flexDirection: 'row', gap: 1, paddingHorizontal: 14, paddingBottom: 10 },
  calcCell: {
    flex: 1, backgroundColor: colors.panel2, borderRadius: radius.sm,
    padding: 9, alignItems: 'center', marginHorizontal: 2, borderWidth: 1, borderColor: colors.border,
  },
  calcCellAccent: { backgroundColor: colors.accentSofter, borderColor: colors.accentLine },
  calcK: { color: colors.text4, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  calcV: { color: colors.text, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  reviewCard: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 4 },
});
