import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '../src/hooks/useAppData';
import {
  BRANDS, BOX_TO, CASE_TO, ROLL_TO, TO_CANS, priceLadder,
  money, fmt, EXPENSE_KINDS, makeExpenseDescription, PRODUCT_FUNDING_CATEGORY,
} from '../src/lib/data';
import { DB } from '../src/lib/supabase';
import { colors, radius } from '../src/theme';
import Icon from '../src/components/Icon';
import { ReviewRow, Progress, Cell, BrandPick, Field, BigInput, Input, Btn } from '../src/components/Ui';
import { useToast } from '../src/components/Toast';
import { getRole } from '../src/lib/storage';

interface SplitState { partner: string; unit: string; amount: string }
interface ExpLine { partner: string; category: string; amount: string }

function EditableUnitCell({ label, value, onChange, accent }: {
  label: string; value: string; onChange: (v: string) => void; accent?: boolean
}) {
  return (
    <TouchableOpacity style={[styles.calcCell, accent && styles.calcCellAccent]} activeOpacity={1}>
      <Text style={[styles.calcK, accent && { color: colors.accent }]}>{label}</Text>
      <Input
        value={value}
        onChange={onChange}
        placeholder="0"
        inputMode="decimal"
      />
    </TouchableOpacity>
  );
}

function SplitInput({ split, setSplit, splitSummary, totalCans }: {
  split: SplitState;
  setSplit: (s: SplitState) => void;
  splitSummary: ReturnType<typeof computeSplitSummary>;
  totalCans: number;
}) {
  return (
    <View style={styles.splitBox}>
      <Text style={styles.splitTitle}>Product funding</Text>
      <Text style={styles.splitSub}>Enter what one person paid for. The remaining is assigned to the other.</Text>

      <Field label="Who paid for product?">
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {['Clanny', 'Clenny'].map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.partnerBtn, split.partner === p && styles.partnerBtnActive]}
              onPress={() => setSplit({ ...split, partner: p })}
              activeOpacity={0.7}
            >
              <Text style={[styles.partnerBtnText, split.partner === p && { color: colors.accent }]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      <Field label="Unit">
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[['rolls', 'Rolls'], ['cans', 'Cans'], ['cases', 'Cases'], ['boxes', 'Boxes']].map(([k, l]) => (
            <TouchableOpacity
              key={k}
              style={[styles.unitBtn, split.unit === k && styles.unitBtnActive]}
              onPress={() => setSplit({ ...split, unit: k })}
              activeOpacity={0.7}
            >
              <Text style={[styles.unitBtnText, split.unit === k && { color: colors.accent }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      <Field label={`Amount paid for (in ${split.unit})`}>
        <Input value={split.amount} onChange={v => setSplit({ ...split, amount: v })} placeholder="0" inputMode="decimal" />
      </Field>

      {totalCans > 0 && split.amount !== '' && (
        <View style={[styles.splitSummary, splitSummary.over && styles.splitSummaryDanger]}>
          <View style={styles.splitPerson}>
            <Text style={styles.splitWho}>{split.partner}</Text>
            <Text style={styles.splitDetail}>
              paid for {fmt(splitSummary.primaryRolls)} rolls · {fmt(splitSummary.primaryCans)} cans
              {splitSummary.canPrice > 0 ? ` · ${money(splitSummary.primaryValue)}` : ''}
            </Text>
          </View>
          <View style={styles.splitPerson}>
            <Text style={styles.splitWho}>{splitSummary.otherPartner}</Text>
            <Text style={styles.splitDetail}>
              paid for {fmt(splitSummary.remainingRolls)} rolls · {fmt(splitSummary.remainingCans)} cans
              {splitSummary.canPrice > 0 ? ` · ${money(splitSummary.remainingValue)}` : ''}
            </Text>
          </View>
          {splitSummary.over && (
            <Text style={styles.splitWarning}>This is more than the product coming in.</Text>
          )}
        </View>
      )}
    </View>
  );
}

function ExpenseLines({ lines, setLines, categories, defaultPartner }: {
  lines: ExpLine[];
  setLines: (l: ExpLine[]) => void;
  categories: string[];
  defaultPartner: string;
}) {
  const add = () => setLines([...lines, { partner: defaultPartner, category: categories[0], amount: '' }]);
  const upd = (i: number, k: keyof ExpLine, v: string) => setLines(lines.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  const rm = (i: number) => setLines(lines.filter((_, idx) => idx !== i));

  return (
    <View style={{ gap: 10 }}>
      {lines.map((l, i) => (
        <View key={i} style={styles.expLine}>
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['Clanny', 'Clenny'].map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.unitBtn, l.partner === p && styles.unitBtnActive]}
                  onPress={() => upd(i, 'partner', p)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.unitBtnText, l.partner === p && { color: colors.accent }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <View style={styles.categoryScroll}>
                {categories.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.unitBtn, l.category === c && styles.unitBtnActive]}
                    onPress={() => upd(i, 'category', c)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.unitBtnText, l.category === c && { color: colors.accent }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: colors.text3, fontSize: 16 }}>$</Text>
              <Input value={l.amount} onChange={v => upd(i, 'amount', v)} placeholder="0.00" inputMode="decimal" />
            </View>
          </View>
          <TouchableOpacity onPress={() => rm(i)} style={{ padding: 4 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="x" size={16} color={colors.text4} />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity onPress={add} style={styles.addExpBtn} activeOpacity={0.7}>
        <Icon name="plus" size={13} color={colors.accent} />
        <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '500' }}>Add cost</Text>
      </TouchableOpacity>
    </View>
  );
}

function splitToCans(unit: string, amount: number) {
  if (unit === 'boxes') return amount * TO_CANS.Box;
  if (unit === 'cases') return amount * TO_CANS.Case;
  if (unit === 'rolls') return amount * TO_CANS.Roll;
  return amount;
}

function computeSplitSummary(split: SplitState, totalCans: number, canPrice: string) {
  const n = Number(split.amount) || 0;
  const splitCans = split.amount === '' ? 0 : splitToCans(split.unit, n);
  const over = splitCans > totalCans;
  const remainingCans = Math.max(0, totalCans - splitCans);
  const otherPartner = split.partner === 'Clanny' ? 'Clenny' : 'Clanny';
  const price = Number(canPrice) || 0;
  return {
    totalCans,
    canPrice: price,
    primaryCans: splitCans,
    primaryRolls: splitCans / TO_CANS.Roll,
    primaryValue: splitCans * price,
    remainingCans,
    remainingRolls: remainingCans / TO_CANS.Roll,
    remainingValue: remainingCans * price,
    otherPartner,
    over,
  };
}

export default function NewShipmentScreen() {
  const { refresh } = useData();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [brand, setBrand] = useState('');
  const [qty, setQty] = useState({ boxes: '', cases: '', rolls: '', cans: '' });
  const [split, setSplit] = useState<SplitState>({ partner: 'Clanny', unit: 'rolls', amount: '' });
  const [canPrice, setCanPrice] = useState('');
  const [expLines, setExpLines] = useState<ExpLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [roleName, setRoleName] = useState('Clanny');

  useEffect(() => {
    getRole().then(r => {
      if (r) { setRoleName(r); setSplit(s => ({ ...s, partner: r })); }
    });
  }, []);

  const num = (v: string) => Number(v) || 0;
  const formatQty = (n: number) => n ? String(Number(n.toFixed(4))) : '';

  const setUnit = (unit: string, value: string) => {
    const n = num(value);
    const next = { boxes: '', cases: '', rolls: '', cans: '' };
    if (value !== '') {
      if (unit === 'boxes') {
        next.boxes = value; next.cases = formatQty(n * BOX_TO.Case); next.rolls = formatQty(n * BOX_TO.Roll); next.cans = formatQty(n * BOX_TO.Can);
      } else if (unit === 'cases') {
        next.boxes = formatQty(n / BOX_TO.Case); next.cases = value; next.rolls = formatQty(n * CASE_TO.Roll); next.cans = formatQty(n * CASE_TO.Can);
      } else if (unit === 'rolls') {
        next.boxes = formatQty(n / BOX_TO.Roll); next.cases = formatQty(n / CASE_TO.Roll); next.rolls = value; next.cans = formatQty(n * ROLL_TO.Can);
      } else if (unit === 'cans') {
        next.boxes = formatQty(n / BOX_TO.Can); next.cases = formatQty(n / CASE_TO.Can); next.rolls = formatQty(n / ROLL_TO.Can); next.cans = value;
      }
    }
    setQty(next);
  };

  const u = { boxes: num(qty.boxes), cases: num(qty.cases), rolls: num(qty.rolls), cans: num(qty.cans) };
  const splitSummary = computeSplitSummary(split, u.cans, canPrice);
  const lad = priceLadder(canPrice);
  const subtotal = u.cans * (Number(canPrice) || 0);
  const shipmentCosts = expLines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  const paidBy = expLines.reduce((acc, l) => {
    const p = l.partner || 'Clanny';
    acc[p] = (acc[p] || 0) + (Number(l.amount) || 0);
    return acc;
  }, { Clanny: 0, Clenny: 0 } as Record<string, number>);
  const allInTotal = subtotal + shipmentCosts;

  const canNext =
    step === 1 ? (!!brand && u.cans > 0) :
    step === 2 ? (split.amount !== '' && !splitSummary.over) :
    step === 3 ? (Number(canPrice) > 0) : true;

  const submit = async () => {
    setSaving(true);
    try {
      const created = await DB.shipments.insert({
        brand, boxes: u.boxes, cases: u.cases, rolls: u.rolls, cans: u.cans,
        pricePerCan: Number(canPrice) || 0, subtotal,
        miscCost: 0, miscDesc: '',
        grandTotal: subtotal, sender: 'Clanny', receiver: 'Clenny', status: 'pending',
      });

      // Insert product funding for both partners
      const fundingRows = [
        {
          partner: split.partner,
          amount: splitSummary.primaryValue,
          cans: splitSummary.primaryCans,
          rolls: splitSummary.primaryRolls,
        },
        {
          partner: splitSummary.otherPartner,
          amount: splitSummary.remainingValue,
          cans: splitSummary.remainingCans,
          rolls: splitSummary.remainingRolls,
        },
      ];
      for (const row of fundingRows) {
        if (row.amount <= 0 && row.cans <= 0) continue;
        await DB.expenses.insert({
          partner: row.partner,
          amount: row.amount,
          category: PRODUCT_FUNDING_CATEGORY,
          description: makeExpenseDescription(EXPENSE_KINDS.PRODUCT, {
            category: PRODUCT_FUNDING_CATEGORY,
            cans: row.cans,
            rolls: row.rolls,
            unit: split.unit,
            enteredAmount: row.partner === split.partner ? Number(split.amount) || 0 : row.cans,
            pricePerCan: Number(canPrice) || 0,
          }),
          shipmentId: created.id,
        });
      }

      // Insert extra shipment costs
      for (const l of expLines) {
        const amt = Number(l.amount) || 0;
        if (amt > 0) await DB.expenses.insert({
          partner: l.partner,
          amount: amt,
          category: l.category,
          description: makeExpenseDescription(EXPENSE_KINDS.SHIPMENT, { category: l.category }),
          shipmentId: created.id,
        });
      }

      await refresh();
      showToast('Shipment sent to Clenny');
      router.back();
    } catch {
      showToast("Couldn't send — check connection");
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="chevL" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.progressWrap}>
          <Progress value={(step / 5) * 100} />
        </View>
        <Text style={styles.stepNum}>{step}/5</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepLabel}>Step 1 · Brand & Quantity</Text>
            <Text style={styles.stepQ}>What product is coming?</Text>
            <Text style={styles.stepHint}>Pick a brand, then enter the total shipment quantity in any unit.</Text>

            <Field label="Brand" style={{ marginBottom: 20 }}>
              <BrandPick brand={brand} setBrand={setBrand} brands={BRANDS} />
            </Field>

            <Text style={styles.calcLabel}>Quantity (enter in any unit)</Text>
            <View style={styles.calcGrid}>
              {[
                { label: 'Boxes', key: 'boxes' as const },
                { label: 'Cases', key: 'cases' as const },
                { label: 'Rolls', key: 'rolls' as const },
                { label: 'Cans',  key: 'cans'  as const, accent: true },
              ].map(({ label, key, accent }) => (
                <View key={key} style={[styles.calcCellFull, accent && styles.calcCellAccent]}>
                  <Text style={[styles.calcK, accent && { color: colors.accent }]}>{label}</Text>
                  <Input value={qty[key]} onChange={v => setUnit(key, v)} placeholder="0" inputMode="decimal" />
                </View>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepLabel}>Step 2 · Product Funding</Text>
            <Text style={styles.stepQ}>Who paid for the product?</Text>
            <Text style={styles.stepHint}>Enter the amount one person paid for. The remainder goes to the other.</Text>
            <SplitInput split={split} setSplit={setSplit} splitSummary={splitSummary} totalCans={u.cans} />
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepLabel}>Step 3 · Product Price</Text>
            <Text style={styles.stepQ}>What was the product price?</Text>
            <Text style={styles.stepHint}>This calculates the product total and each person's funded amount.</Text>

            <Field label="Price per can">
              <BigInput value={canPrice} onChange={setCanPrice} prefix="$" placeholder="0.00" inputMode="decimal" autoFocus />
            </Field>

            {Number(canPrice) > 0 && (
              <>
                <View style={styles.calcGrid}>
                  <View style={styles.calcCellFull}>
                    <Text style={styles.calcK}>Per roll (×5)</Text>
                    <Text style={styles.calcV}>{money(lad.perRoll, 2)}</Text>
                  </View>
                  <View style={styles.calcCellFull}>
                    <Text style={styles.calcK}>Per case (×90)</Text>
                    <Text style={styles.calcV}>{money(lad.perCase)}</Text>
                  </View>
                  <View style={styles.calcCellFull}>
                    <Text style={styles.calcK}>Per box (×540)</Text>
                    <Text style={styles.calcV}>{money(lad.perBox)}</Text>
                  </View>
                  <View style={[styles.calcCellFull, styles.calcCellAccent]}>
                    <Text style={[styles.calcK, { color: colors.accent }]}>{fmt(u.cans)} cans</Text>
                    <Text style={[styles.calcV, { color: colors.accent }]}>{money(subtotal)}</Text>
                  </View>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalK}>Product total</Text>
                  <Text style={styles.totalV}>{money(subtotal)}</Text>
                </View>
                <SplitInput split={split} setSplit={setSplit} splitSummary={splitSummary} totalCans={u.cans} />
              </>
            )}
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepLabel}>Step 4 · Extra Shipment Costs</Text>
            <Text style={styles.stepQ}>Who paid extra costs?</Text>
            <Text style={styles.stepHint}>Keep shipping, handling, gas, and freight separate from the product purchase.</Text>

            <Field label="Extra shipment costs">
              <ExpenseLines
                lines={expLines}
                setLines={setExpLines}
                defaultPartner={roleName}
                categories={['Shipping', 'Handling', 'Freight', 'Gas', 'Port fees', 'Loading', 'Other']}
              />
            </Field>

            <View style={[styles.reviewCard, { marginTop: 16 }]}>
              <ReviewRow k="Product total" v={money(subtotal)} />
              <ReviewRow k="Clanny extra costs" v={money(paidBy.Clanny || 0)} />
              <ReviewRow k="Clenny extra costs" v={money(paidBy.Clenny || 0)} />
              <ReviewRow k="Extra costs" v={money(shipmentCosts)} />
              <ReviewRow k="All-in total" v={money(allInTotal)} total />
            </View>
          </View>
        )}

        {step === 5 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepLabel}>Step 5 · Review</Text>
            <Text style={styles.stepQ}>Ready to send?</Text>
            <Text style={styles.stepHint}>Confirm the product funding and extra costs before saving the shipment.</Text>

            <View style={styles.reviewCard}>
              <ReviewRow k="Brand" v={brand} />
              <ReviewRow k="Boxes" v={fmt(u.boxes)} />
              <ReviewRow k="Cases" v={fmt(u.cases)} />
              <ReviewRow k="Rolls" v={fmt(u.rolls)} />
              <ReviewRow k="Cans" v={fmt(u.cans)} />
              <ReviewRow k={`${split.partner} paid for`} v={`${fmt(splitSummary.primaryRolls)} rolls · ${money(splitSummary.primaryValue)}`} />
              <ReviewRow k={`${splitSummary.otherPartner} paid for`} v={`${fmt(splitSummary.remainingRolls)} rolls · ${money(splitSummary.remainingValue)}`} />
              <ReviewRow k="Price / can" v={money(Number(canPrice) || 0, 2)} />
              <ReviewRow k="Product total" v={money(subtotal)} />
              <ReviewRow k="Clanny extra costs" v={money(paidBy.Clanny || 0)} />
              <ReviewRow k="Clenny extra costs" v={money(paidBy.Clenny || 0)} />
              <ReviewRow k="Extra costs" v={money(shipmentCosts)} />
              <ReviewRow k="All-in total" v={money(allInTotal)} total />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.stickyActions, { paddingBottom: insets.bottom + 12 }]}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {step > 1 && (
            <Btn onPress={() => setStep(step - 1)} disabled={saving} style={{ flex: 1 }}>Back</Btn>
          )}
          {step < 5 ? (
            <Btn variant="primary" onPress={() => setStep(step + 1)} disabled={!canNext} style={{ flex: 2 }}>
              Continue
            </Btn>
          ) : (
            <Btn variant="primary" onPress={submit} disabled={saving} style={{ flex: 2 }} icon="send">
              {saving ? 'Sending…' : 'Send Shipment'}
            </Btn>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12,
    gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.panel,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: colors.panel2,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  progressWrap: { flex: 1 },
  stepNum: { color: colors.text4, fontSize: 12, fontFamily: 'Courier', minWidth: 28, textAlign: 'right' },
  stepCard: { paddingTop: 20, paddingBottom: 8 },
  stepLabel: { color: colors.accent, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  stepQ: { color: colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6 },
  stepHint: { color: colors.text3, fontSize: 13.5, lineHeight: 19, marginBottom: 24 },
  calcLabel: { color: colors.text2, fontSize: 12.5, fontWeight: '600', marginBottom: 10 },
  calcGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  calcCell: {
    width: '47%', backgroundColor: colors.panel, borderRadius: radius.md,
    padding: 12, borderWidth: 1, borderColor: colors.border,
  },
  calcCellFull: {
    flex: 1, minWidth: '45%', backgroundColor: colors.panel, borderRadius: radius.md,
    padding: 12, borderWidth: 1, borderColor: colors.border,
  },
  calcCellAccent: { backgroundColor: colors.accentSofter, borderColor: colors.accentLine },
  calcK: { color: colors.text4, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: '500' },
  calcV: { color: colors.text, fontSize: 16, fontWeight: '700' },
  splitBox: {
    backgroundColor: colors.panel, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: 14, marginTop: 18,
  },
  splitTitle: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  splitSub: { color: colors.text3, fontSize: 12.5, lineHeight: 18, marginBottom: 14 },
  partnerBtn: {
    flex: 1, paddingVertical: 10, borderRadius: radius.md,
    backgroundColor: colors.panel2, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center',
  },
  partnerBtnActive: { borderColor: colors.accentLine, backgroundColor: colors.accentSofter },
  partnerBtnText: { color: colors.text2, fontSize: 14, fontWeight: '600' },
  unitBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.sm,
    backgroundColor: colors.panel2, borderWidth: 1, borderColor: colors.border,
  },
  unitBtnActive: { borderColor: colors.accentLine, backgroundColor: colors.accentSofter },
  unitBtnText: { color: colors.text2, fontSize: 13, fontWeight: '500' },
  splitSummary: {
    backgroundColor: colors.panel2, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: 12, marginTop: 12, gap: 8,
  },
  splitSummaryDanger: { borderColor: 'rgba(239,68,68,0.4)', backgroundColor: colors.dangerBg },
  splitPerson: { gap: 2 },
  splitWho: { color: colors.text, fontSize: 13, fontWeight: '700' },
  splitDetail: { color: colors.text3, fontSize: 12.5 },
  splitWarning: { color: colors.danger, fontSize: 12.5, fontWeight: '500' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.accentSofter, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.accentLine,
    padding: 12, marginTop: 8, marginBottom: 4,
  },
  totalK: { color: colors.text, fontSize: 13, fontWeight: '600' },
  totalV: { color: colors.accent, fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  expLine: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.panel, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: 12,
  },
  categoryScroll: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  addExpBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', padding: 4,
  },
  reviewCard: {
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden', backgroundColor: colors.panel,
  },
  stickyActions: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.panel,
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: 16, paddingTop: 12,
  },
});
