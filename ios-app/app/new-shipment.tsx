import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '../src/hooks/useAppData';
import {
  BRANDS, deriveUnits, money, fmt, boxWord,
  type Shipment,
} from '../src/lib/data';
import { DB } from '../src/lib/supabase';
import { colors, radius } from '../src/theme';
import Icon from '../src/components/Icon';
import { ReviewRow, Progress, BrandPick, Field, BigInput, Input, Btn, PartnerPick } from '../src/components/Ui';
import { useToast } from '../src/components/Toast';
import { getRole } from '../src/lib/storage';

const STATUS_OPTIONS: Shipment['status'][] = ['pending', 'in_transit', 'received', 'disputed'];

export default function NewShipmentScreen() {
  const { refresh } = useData();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [brand, setBrand] = useState('Grizzly');
  const [boxes, setBoxes] = useState('');
  const [casesPerBox, setCasesPerBox] = useState('6');
  const [rollsPerCase, setRollsPerCase] = useState('18');
  const [cansPerRoll, setCansPerRoll] = useState('5');
  const [costPerCase, setCostPerCase] = useState('');
  const [clennyProductInvest, setClennyProductInvest] = useState('');
  const [clannyProductInvest, setClannyProductInvest] = useState('');
  const [targetSalePricePerCan, setTargetSalePricePerCan] = useState('');
  const [status, setStatus] = useState<Shipment['status']>('pending');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [roleName, setRoleName] = useState('Clanny');

  useEffect(() => {
    getRole().then(r => {
      if (r) { setRoleName(r); }
    });
  }, []);

  const num = (v: string) => Number(v) || 0;

  const units = deriveUnits({
    boxes: num(boxes),
    casesPerBox: num(casesPerBox),
    rollsPerCase: num(rollsPerCase),
    cansPerRoll: num(cansPerRoll),
  });

  const productCost = units.cases * num(costPerCase);
  const projectedRevenue = units.totalCans * num(targetSalePricePerCan);

  // Auto-calculate clanny invest if clenny invest is provided and product cost is known
  useEffect(() => {
    const clenny = num(clennyProductInvest);
    if (productCost > 0 && clenny > 0 && clenny <= productCost) {
      const clanny = productCost - clenny;
      if (clanny !== num(clannyProductInvest)) {
        setClannyProductInvest(String(clanny));
      }
    }
  }, [clennyProductInvest, costPerCase, boxes, casesPerBox]);

  const valid = !!brand && num(boxes) > 0 && num(costPerCase) > 0 && num(targetSalePricePerCan) > 0;

  const submit = async () => {
    setSaving(true);
    try {
      const totalInvest = num(clennyProductInvest) + num(clannyProductInvest);
      // If no explicit investment entered, default all to Clanny (sender)
      const clennyInvest = num(clennyProductInvest) || 0;
      const clannyInvest = totalInvest > 0 ? num(clannyProductInvest) : productCost;

      await DB.shipments.insert({
        brand,
        boxes: num(boxes),
        casesPerBox: num(casesPerBox) || 6,
        rollsPerCase: num(rollsPerCase) || 18,
        cansPerRoll: num(cansPerRoll) || 5,
        costPerCase: num(costPerCase),
        clennyProductInvest: clennyInvest,
        clannyProductInvest: clannyInvest,
        targetSalePricePerCan: num(targetSalePricePerCan),
        status,
        notes,
      });

      await refresh();
      showToast('Shipment created');
      router.back();
    } catch {
      showToast("Couldn't create — check connection");
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="chevL" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Shipment</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.stepCard}>
          <Text style={styles.stepLabel}>Product & Quantity</Text>
          <Text style={styles.stepQ}>What product is coming?</Text>

          <Field label="Brand" style={{ marginBottom: 20 }}>
            <BrandPick brand={brand} setBrand={setBrand} brands={BRANDS} />
          </Field>

          <Text style={styles.calcLabel}>Quantity</Text>
          <View style={styles.calcGrid}>
            <View style={styles.calcCellFull}>
              <Text style={styles.calcK}>Boxes</Text>
              <BigInput value={boxes} onChange={setBoxes} placeholder="0" inputMode="numeric" />
            </View>
            <View style={styles.calcCellFull}>
              <Text style={styles.calcK}>Cases / box</Text>
              <BigInput value={casesPerBox} onChange={setCasesPerBox} placeholder="6" inputMode="numeric" />
            </View>
            <View style={styles.calcCellFull}>
              <Text style={styles.calcK}>Rolls / case</Text>
              <BigInput value={rollsPerCase} onChange={setRollsPerCase} placeholder="18" inputMode="numeric" />
            </View>
            <View style={styles.calcCellFull}>
              <Text style={styles.calcK}>Cans / roll</Text>
              <BigInput value={cansPerRoll} onChange={setCansPerRoll} placeholder="5" inputMode="numeric" />
            </View>
          </View>

          <Text style={styles.calcLabel}>Derived units</Text>
          <View style={styles.calcGrid}>
            <View style={styles.calcCellFull}>
              <Text style={styles.calcK}>Cases</Text>
              <Text style={styles.calcV}>{fmt(units.cases)}</Text>
            </View>
            <View style={styles.calcCellFull}>
              <Text style={styles.calcK}>Rolls</Text>
              <Text style={styles.calcV}>{fmt(units.rolls)}</Text>
            </View>
            <View style={styles.calcCellFull}>
              <Text style={styles.calcK}>Total cans</Text>
              <Text style={styles.calcV}>{fmt(units.totalCans)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.stepCard}>
          <Text style={styles.stepLabel}>Pricing</Text>
          <Text style={styles.stepQ}>What are the costs and target price?</Text>

          <Field label="Cost per case">
            <BigInput value={costPerCase} onChange={setCostPerCase} prefix="$" placeholder="0.00" inputMode="decimal" />
          </Field>
          <Field label="Target sale price per can">
            <BigInput value={targetSalePricePerCan} onChange={setTargetSalePricePerCan} prefix="$" placeholder="0.00" inputMode="decimal" />
          </Field>

          <View style={styles.reviewCard}>
            <ReviewRow k="Total product cost" v={money(productCost)} />
            <ReviewRow k="Projected revenue" v={money(projectedRevenue)} total />
          </View>
        </View>

        <View style={styles.stepCard}>
          <Text style={styles.stepLabel}>Funding</Text>
          <Text style={styles.stepQ}>Who invested in the product?</Text>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Field label="Clenny invest" style={{ flex: 1 }}>
              <BigInput value={clennyProductInvest} onChange={setClennyProductInvest} prefix="$" placeholder="0.00" inputMode="decimal" />
            </Field>
            <Field label="Clanny invest" style={{ flex: 1 }}>
              <BigInput value={clannyProductInvest} onChange={setClannyProductInvest} prefix="$" placeholder="0.00" inputMode="decimal" />
            </Field>
          </View>

          <Text style={styles.hintText}>
            If Clenny invest is provided, Clanny invest auto-calculates as total cost minus Clenny invest. You can override it manually.
          </Text>

          <View style={styles.reviewCard}>
            <ReviewRow k="Product cost" v={money(productCost)} />
            <ReviewRow k="Total invested" v={money(num(clennyProductInvest) + num(clannyProductInvest))} total />
            <ReviewRow k="Check" v={money(productCost - (num(clennyProductInvest) + num(clannyProductInvest)))} />
          </View>
        </View>

        <View style={styles.stepCard}>
          <Text style={styles.stepLabel}>Status</Text>
          <Text style={styles.stepQ}>What is the shipment status?</Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {STATUS_OPTIONS.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.statusBtn, status === s && styles.statusBtnActive]}
                onPress={() => setStatus(s)}
                activeOpacity={0.7}
              >
                <Text style={[styles.statusBtnText, status === s && { color: colors.accent, fontWeight: '700' }]}>
                  {s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.stepCard}>
          <Text style={styles.stepLabel}>Notes</Text>
          <Field label="Optional notes">
            <Input value={notes} onChange={setNotes} placeholder="Any notes about this shipment…" multiline numberOfLines={3} />
          </Field>
        </View>
      </ScrollView>

      <View style={[styles.stickyActions, { paddingBottom: insets.bottom + 12 }]}>
        <Btn variant="primary" onPress={submit} disabled={!valid || saving} fullWidth icon="send">
          {saving ? 'Creating…' : 'Create Shipment'}
        </Btn>
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
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  stepCard: { paddingTop: 20, paddingBottom: 8 },
  stepLabel: { color: colors.accent, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  stepQ: { color: colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6 },
  calcLabel: { color: colors.text2, fontSize: 12.5, fontWeight: '600', marginBottom: 10 },
  calcGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  calcCellFull: {
    flex: 1, minWidth: '45%', backgroundColor: colors.panel, borderRadius: radius.md,
    padding: 12, borderWidth: 1, borderColor: colors.border,
  },
  calcK: { color: colors.text4, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: '500' },
  calcV: { color: colors.text, fontSize: 16, fontWeight: '700' },
  reviewCard: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 4, backgroundColor: colors.panel },
  hintText: { color: colors.text3, fontSize: 12.5, lineHeight: 18, marginTop: 8, marginBottom: 8 },
  statusBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.md,
    backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border,
  },
  statusBtnActive: { borderColor: colors.accentLine, backgroundColor: colors.accentSofter },
  statusBtnText: { color: colors.text2, fontSize: 13, fontWeight: '600' },
  stickyActions: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.panel,
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: 16, paddingTop: 12,
  },
});
