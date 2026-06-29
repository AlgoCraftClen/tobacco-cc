import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '../../src/hooks/useAppData';
import {
  isProductFunding, parseExpenseMeta, BRANDS, money, fmt, fmtDate, boxWord,
  type Purchase, type Expense, type Shipment,
} from '../../src/lib/data';
import { DB } from '../../src/lib/supabase';
import { colors, radius } from '../../src/theme';
import Icon from '../../src/components/Icon';
import Sheet from '../../src/components/Sheet';
import Avatar from '../../src/components/Avatar';
import { SegmentedControl, SkeletonList, EmptyState, ReviewRow, Field, BigInput, PartnerPick, BrandPick, Btn, SectionHeader, Input } from '../../src/components/Ui';
import { useToast } from '../../src/components/Toast';

function FundingCard({ row, shipment }: { row: Expense; shipment?: Shipment }) {
  const meta = parseExpenseMeta(row) || {};
  const av = row.partner === 'Clanny' ? 'av-3' : 'av-1';
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Avatar name={row.partner} cls={av} size={42} />
        <View style={styles.cardMain}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.cardTitle}>{shipment ? shipment.brand : 'Product'}</Text>
            <View style={styles.chip}><Text style={styles.chipText}>{row.partner}</Text></View>
          </View>
          <Text style={styles.cardSub}>
            {shipment ? `${boxWord(shipment.boxes)} · ` : ''}{fmt(meta.rolls as number || 0)} rolls · {fmt(meta.cans as number || 0)} cans · {fmtDate(row.createdAt)}
          </Text>
        </View>
        <Text style={styles.cardAmt}>{money(row.amount)}</Text>
      </View>
    </View>
  );
}

function OperationsCard({ row, onToggle }: { row: Expense; onToggle: () => void }) {
  const av = row.partner === 'Clanny' ? 'av-3' : 'av-1';
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Avatar name={row.partner} cls={av} size={42} />
        <View style={styles.cardMain}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.cardTitle}>{row.category}</Text>
            <View style={[styles.chip, row.approved && styles.chipApproved]}>
              <Text style={[styles.chipText, row.approved && { color: colors.pos }]}>{row.approved ? 'Approved' : 'Pending'}</Text>
            </View>
          </View>
          <Text style={styles.cardSub}>{row.partner} · {fmtDate(row.date || row.createdAt)}</Text>
        </View>
        <Text style={styles.cardAmt}>{money(row.amount)}</Text>
        <TouchableOpacity onPress={onToggle} style={{ padding: 4 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name={row.approved ? 'check' : 'x'} size={18} color={row.approved ? colors.pos : colors.text4} />
        </TouchableOpacity>
      </View>
      {row.description ? (
        <View style={styles.cardFooter}>
          <Text style={styles.cardFooterText}>{row.description}</Text>
        </View>
      ) : null}
    </View>
  );
}

function AddPurchaseSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { refresh } = useData();
  const { showToast } = useToast();
  const [brand, setBrand] = useState('Grizzly');
  const [cans, setCans] = useState('');
  const [price, setPrice] = useState('');
  const [partner, setPartner] = useState('Clanny');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (open) { setBrand('Grizzly'); setCans(''); setPrice(''); setPartner('Clanny'); }
  }, [open]);

  const total = (Number(cans) || 0) * (Number(price) || 0);
  const valid = brand && Number(cans) > 0 && Number(price) > 0;

  const save = async () => {
    setSaving(true);
    try {
      await DB.purchases.insert({ partner, brand, cans: Number(cans) || 0, pricePerCan: Number(price) || 0, total });
      await refresh();
      showToast('Older purchase logged');
      onClose();
    } catch { showToast("Couldn't save — check connection"); }
    setSaving(false);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Log older purchase" icon="cart">
      <View style={styles.hintBox}>
        <Text style={styles.hintText}>Use New Shipment for new product funding. This is only for older purchases not tied to a shipment.</Text>
      </View>
      <PartnerPick partner={partner} setPartner={setPartner} label="Who bought it?" />
      <Field label="Brand">
        <BrandPick brand={brand} setBrand={setBrand} brands={BRANDS} />
      </Field>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Field label="Number of cans" style={{ flex: 1 }}>
          <BigInput value={cans} onChange={setCans} placeholder="0" inputMode="numeric" />
        </Field>
        <Field label="Price per can" style={{ flex: 1 }}>
          <BigInput value={price} onChange={setPrice} prefix="$" placeholder="0.00" inputMode="decimal" />
        </Field>
      </View>
      <View style={styles.reviewCard}>
        <ReviewRow k="Total" v={money(total)} total />
      </View>
      <View style={{ height: 14 }} />
      <Btn variant="primary" onPress={save} disabled={!valid || saving} fullWidth icon="check">
        {saving ? 'Saving…' : 'Save Older Purchase'}
      </Btn>
    </Sheet>
  );
}

function AddExpenseSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { refresh } = useData();
  const { showToast } = useToast();
  const [partner, setPartner] = useState('Clanny');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Operations');
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const categories = ['Shipping', 'Handling', 'Freight', 'Gas', 'Port fees', 'Loading', 'Operations', 'Other'];

  React.useEffect(() => {
    if (open) {
      setPartner('Clanny');
      setAmount('');
      setCategory('Operations');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
    }
  }, [open]);

  const valid = partner && Number(amount) > 0 && category && date;

  const save = async () => {
    setSaving(true);
    try {
      await DB.expenses.insert({
        partner,
        amount: Number(amount) || 0,
        category: category.toLowerCase(),
        description,
        date,
        approved: false,
        shipmentId: null,
      });
      await refresh();
      showToast('Expense logged');
      onClose();
    } catch { showToast("Couldn't save — check connection"); }
    setSaving(false);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add expense" icon="wallet">
      <PartnerPick partner={partner} setPartner={setPartner} label="Who paid?" />
      <Field label="Category">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {categories.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.catBtn, category === c && styles.catBtnActive]}
              onPress={() => setCategory(c)}
              activeOpacity={0.7}
            >
              <Text style={[styles.catBtnText, category === c && { color: colors.accent }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>
      <Field label="Date">
        <Input value={date} onChange={setDate} placeholder="YYYY-MM-DD" />
      </Field>
      <Field label="Amount">
        <BigInput value={amount} onChange={setAmount} prefix="$" placeholder="0.00" inputMode="decimal" />
      </Field>
      <Field label="Description (optional)">
        <Input value={description} onChange={setDescription} placeholder="What was this for?" />
      </Field>
      <View style={{ height: 14 }} />
      <Btn variant="primary" onPress={save} disabled={!valid || saving} fullWidth icon="check">
        {saving ? 'Saving…' : 'Save Expense'}
      </Btn>
    </Sheet>
  );
}

export default function PurchasesScreen() {
  const { purchases, shipments, expenses, loading, refresh } = useData();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [addOpen, setAddOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [scope, setScope] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  const shipmentById = new Map(shipments.map(s => [s.id, s]));
  const fundingRows = expenses.filter(isProductFunding).sort((a, b) =>
    new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  const filteredFunding = scope === 'all' ? fundingRows : fundingRows.filter(r => r.partner === scope);
  const filteredPurchases = scope === 'all' ? purchases : purchases.filter(p => p.partner === scope);
  const fundingTotal = filteredFunding.reduce((s, r) => s + r.amount, 0);
  const olderTotal = filteredPurchases.reduce((s, p) => s + p.total, 0);

  const operationsRows = expenses.filter(e => e.category === 'operations').sort((a, b) =>
    new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  const filteredOps = scope === 'all' ? operationsRows : operationsRows.filter(r => r.partner === scope);
  const opsTotal = filteredOps.reduce((s, r) => s + r.amount, 0);
  const approvedOpsTotal = filteredOps.filter(e => e.approved).reduce((s, r) => s + r.amount, 0);

  const toggleApproval = async (expense: Expense) => {
    try {
      await DB.expenses.update(expense.id, { approved: !expense.approved });
      await refresh();
      showToast(expense.approved ? 'Approval revoked' : 'Expense approved');
    } catch {
      showToast("Couldn't update — check connection");
    }
  };

  const removePurchase = (p: Purchase) => {
    Alert.alert('Remove purchase?', `${fmt(p.cans)} cans of ${p.brand} — ${money(p.total)}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try { await DB.purchases.delete(p.id); await refresh(); showToast('Older purchase removed'); }
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <View>
            <Text style={styles.pageTitle}>Product Funding</Text>
            <Text style={styles.pageDesc}>{filteredFunding.length} line{filteredFunding.length !== 1 ? 's' : ''} · {money(fundingTotal + olderTotal)} total</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/new-shipment')} activeOpacity={0.8}>
            <Icon name="plus" size={15} color="#fff" />
            <Text style={styles.addBtnText}>New Shipment</Text>
          </TouchableOpacity>
        </View>

        <SegmentedControl
          options={[{ key: 'all', label: 'All' }, { key: 'Clanny', label: 'Clanny' }, { key: 'Clenny', label: 'Clenny' }]}
          value={scope}
          onChange={setScope}
        />
        <View style={{ height: 14 }} />

        {loading ? <SkeletonList count={4} /> :
          filteredFunding.length > 0 ? (
            <View style={{ gap: 8 }}>
              {filteredFunding.map(row => (
                <FundingCard key={row.id} row={row} shipment={shipmentById.get(row.shipmentId!)} />
              ))}
            </View>
          ) : (
            <EmptyState icon="cart" title="No product funding yet" desc="Create a shipment and enter who paid for the product" />
          )
        }

        {filteredPurchases.length > 0 && (
          <>
            <SectionHeader title="Older manual purchases" />
            <View style={{ gap: 8 }}>
              {filteredPurchases.map(p => (
                <View key={p.id} style={styles.card}>
                  <View style={styles.cardHead}>
                    <Avatar name={p.partner} cls={p.partner === 'Clanny' ? 'av-3' : 'av-1'} size={42} />
                    <View style={styles.cardMain}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.cardTitle}>{p.brand}</Text>
                        <View style={styles.chip}><Text style={styles.chipText}>{p.partner}</Text></View>
                      </View>
                      <Text style={styles.cardSub}>{fmt(p.cans)} cans · {money(p.pricePerCan, 2)}/can · {fmtDate(p.createdAt)}</Text>
                    </View>
                    <Text style={styles.cardAmt}>{money(p.total)}</Text>
                    <TouchableOpacity onPress={() => removePurchase(p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Icon name="trash" size={15} color={colors.text4} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 14 }}>
          <View>
            <Text style={styles.pageTitle}>Operations</Text>
            <Text style={styles.pageDesc}>{filteredOps.length} expense{filteredOps.length !== 1 ? 's' : ''} · {money(approvedOpsTotal)} approved · {money(opsTotal)} total</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setExpenseOpen(true)} activeOpacity={0.8}>
            <Icon name="plus" size={15} color="#fff" />
            <Text style={styles.addBtnText}>Add Expense</Text>
          </TouchableOpacity>
        </View>

        {filteredOps.length > 0 ? (
          <View style={{ gap: 8 }}>
            {filteredOps.map(row => (
              <OperationsCard key={row.id} row={row} onToggle={() => toggleApproval(row)} />
            ))}
          </View>
        ) : (
          <EmptyState icon="wallet" title="No operations expenses" desc="Add an expense with category 'Operations'" />
        )}
      </ScrollView>

      <AddPurchaseSheet open={addOpen} onClose={() => setAddOpen(false)} />
      <AddExpenseSheet open={expenseOpen} onClose={() => setExpenseOpen(false)} />
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
    paddingHorizontal: 12, paddingVertical: 8,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  card: {
    backgroundColor: colors.panel, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
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
  chip: {
    backgroundColor: colors.panel2, borderRadius: 5,
    paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: colors.border,
  },
  chipApproved: {
    backgroundColor: colors.posBg,
    borderColor: colors.pos,
  },
  chipText: { color: colors.text3, fontSize: 11, fontWeight: '500' },
  hintBox: { backgroundColor: colors.panel2, borderRadius: radius.sm, padding: 12, marginBottom: 16 },
  hintText: { color: colors.text3, fontSize: 12.5, lineHeight: 18 },
  reviewCard: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  catBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.sm,
    backgroundColor: colors.panel2, borderWidth: 1, borderColor: colors.border,
  },
  catBtnActive: { borderColor: colors.accentLine, backgroundColor: colors.accentSofter },
  catBtnText: { color: colors.text2, fontSize: 13, fontWeight: '500' },
});
