import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '../../src/hooks/useAppData';
import { shipmentFinance, money, fmt, fmtDate, relTime, boxWord, type Shipment, type Expense } from '../../src/lib/data';
import { DB } from '../../src/lib/supabase';
import { colors, radius } from '../../src/theme';
import Icon from '../../src/components/Icon';
import Sheet from '../../src/components/Sheet';
import { ShipBadge } from '../../src/components/Badge';
import { SegmentedControl, SkeletonList, EmptyState, ReviewRow, Field, Input, Btn } from '../../src/components/Ui';
import { useToast } from '../../src/components/Toast';
import { getRole } from '../../src/lib/storage';
import RecordSaleSheet from '../../src/components/RecordSaleSheet';

function ShipmentCard({ s, expenses, onSell, onReceive, onReport, busy, roleName }: {
  s: Shipment;
  expenses: Expense[];
  onSell: (s: Shipment) => void;
  onReceive: (s: Shipment) => void;
  onReport: (s: Shipment) => void;
  busy: boolean;
  roleName: string;
}) {
  const [open, setOpen] = useState(false);
  const finance = shipmentFinance(s, expenses);
  const sold = (s.saleTotal || 0) > 0;
  const net = finance.netProfit;
  const canSell = s.status === 'received' && roleName === 'Clenny';
  const canReceive = s.status === 'pending' && roleName === 'Clenny';

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHead} onPress={() => setOpen(o => !o)} activeOpacity={0.7}>
        <View style={[styles.cardIco, { backgroundColor: colors.accentSoft }]}>
          <Icon name="send" size={19} color={colors.accent} />
        </View>
        <View style={styles.cardMain}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={styles.cardTitle}>{s.brand}</Text>
            <ShipBadge status={s.status} />
          </View>
          <Text style={styles.cardSub}>{boxWord(s.boxes)} · {fmt(s.cans)} cans · {fmtDate(s.createdAt)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.cardAmt}>{money(finance.productTotal)}</Text>
          <Text style={styles.cardAmtSub}>product</Text>
        </View>
        <Icon name={open ? 'chevD' : 'chevR'} size={15} color={colors.text4} />
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <View style={styles.calcGrid}>
            {[['Boxes', fmt(s.boxes)], ['Cases', fmt(s.cases)], ['Rolls', fmt(s.rolls)], ['Cans', fmt(s.cans)]].map(([k, v]) => (
              <View key={k} style={styles.calcCell}>
                <Text style={styles.calcK}>{k}</Text>
                <Text style={styles.calcV}>{v}</Text>
              </View>
            ))}
          </View>
          <View style={styles.reviewCard}>
            <ReviewRow k="Price / can" v={money(s.pricePerCan, 2)} />
            <ReviewRow k="Product total" v={money(finance.productTotal)} />
            <ReviewRow k="Clanny funded" v={`${fmt(finance.funding.Clanny.rolls)} rolls · ${money(finance.funding.Clanny.amount)}`} />
            <ReviewRow k="Clenny funded" v={`${fmt(finance.funding.Clenny.rolls)} rolls · ${money(finance.funding.Clenny.amount)}`} />
            {finance.shipmentCosts > 0 && <ReviewRow k="Extra shipment costs" v={money(finance.shipmentCosts)} />}
            {finance.distributionCosts > 0 && <ReviewRow k="Distribution costs" v={money(finance.distributionCosts)} />}
            <ReviewRow k="All-in total" v={money(finance.allInTotal)} total />
          </View>
          {sold && (
            <View style={[styles.reviewCard, { marginTop: 10 }]}>
              <ReviewRow k="Sold for" v={money(s.saleTotal)} />
              <ReviewRow k="Avg sale price / can" v={money(s.salePricePerCan, 2)} />
              <ReviewRow k="Clanny sale share" v={`${money(finance.revenueShare.Clanny)} · ${money(finance.productProfit.Clanny)} gain`} />
              <ReviewRow k="Clenny sale share" v={`${money(finance.revenueShare.Clenny)} · ${money(finance.productProfit.Clenny)} gain`} />
              <ReviewRow k={net >= 0 ? 'Net gain after costs' : 'Net loss after costs'} v={money(net)} total />
            </View>
          )}
          {s.notes ? (
            <View style={styles.kv}>
              <Text style={styles.kvK}>Issue note</Text>
              <Text style={[styles.kvV, { color: colors.danger, flex: 1, textAlign: 'right' }]}>{s.notes}</Text>
            </View>
          ) : null}
          {s.receivedAt && (
            <View style={styles.kv}>
              <Text style={styles.kvK}>{s.status === 'disputed' ? 'Flagged' : 'Received'}</Text>
              <Text style={styles.kvV}>{fmtDate(s.receivedAt)}</Text>
            </View>
          )}
        </View>
      )}

      {(canReceive || canSell || sold) && (
        <View style={styles.cardActions}>
          {canReceive ? (
            <>
              <Btn variant="danger" onPress={() => onReport(s)} disabled={busy} icon="alert">Report Issue</Btn>
              <Btn variant="primary" onPress={() => onReceive(s)} disabled={busy} icon="check">Confirm Received</Btn>
            </>
          ) : sold ? (
            <>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text3, fontSize: 12 }}>Sold for {money(s.saleTotal)}</Text>
                <Text style={{ color: net >= 0 ? colors.pos : colors.danger, fontSize: 13, fontWeight: '700' }}>
                  {net >= 0 ? '+' : ''}{money(net)} net {net >= 0 ? 'gain' : 'loss'}
                </Text>
              </View>
              <Btn variant="primary" onPress={() => onSell(s)} icon="plus">Add sale</Btn>
            </>
          ) : (
            <Btn variant="primary" onPress={() => onSell(s)} icon="dollar" style={{ flex: 1 }}>Record sale</Btn>
          )}
        </View>
      )}
    </View>
  );
}

export default function ShipmentsScreen() {
  const { shipments, expenses, loading, refresh } = useData();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('all');
  const [sellFor, setSellFor] = useState<Shipment | null>(null);
  const [issueFor, setIssueFor] = useState<Shipment | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [roleName, setRoleName] = useState('Clanny');

  React.useEffect(() => { getRole().then(r => { if (r) setRoleName(r); }); }, []);

  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  const receive = async (s: Shipment) => {
    setBusy(true);
    try { await DB.shipments.receive(s.id); await refresh(); showToast(`${s.brand} shipment received`); }
    catch { showToast("Couldn't update — check connection"); }
    setBusy(false);
  };

  const submitIssue = async () => {
    if (!issueFor) return;
    setBusy(true);
    try { await DB.shipments.dispute(issueFor.id, note.trim()); await refresh(); showToast('Issue reported'); setIssueFor(null); }
    catch { showToast("Couldn't report — check connection"); }
    setBusy(false);
  };

  const counts = {
    all: shipments.length,
    pending: shipments.filter(s => s.status === 'pending').length,
    received: shipments.filter(s => s.status === 'received').length,
    disputed: shipments.filter(s => s.status === 'disputed').length,
  };
  const filtered = filter === 'all' ? shipments : shipments.filter(s => s.status === filter);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: 12, paddingHorizontal: 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <View>
            <Text style={styles.pageTitle}>Shipments</Text>
            <Text style={styles.pageDesc}>{counts.all} total · {counts.pending} pending</Text>
          </View>
          <TouchableOpacity style={styles.newBtn} onPress={() => router.push('/new-shipment')} activeOpacity={0.8}>
            <Icon name="plus" size={15} color="#fff" />
            <Text style={styles.newBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        <SegmentedControl
          options={[
            { key: 'all', label: 'All', count: counts.all },
            { key: 'pending', label: 'Pending', count: counts.pending },
            { key: 'received', label: 'Received', count: counts.received },
            { key: 'disputed', label: 'Disputed', count: counts.disputed },
          ]}
          value={filter}
          onChange={setFilter}
        />

        <View style={{ height: 14 }} />

        {loading ? <SkeletonList count={4} /> :
          filtered.length > 0 ? (
            <View style={{ gap: 10 }}>
              {filtered.map(s => (
                <ShipmentCard key={s.id} s={s} expenses={expenses} onSell={setSellFor} onReceive={receive} onReport={s => { setIssueFor(s); setNote(''); }} busy={busy} roleName={roleName} />
              ))}
            </View>
          ) : (
            <EmptyState icon="send" title={`No shipments${filter !== 'all' ? ` (${filter})` : ''}`} desc={roleName === 'Clanny' ? 'Tap New to send one' : 'Shipments from Clanny appear here'} />
          )
        }
      </ScrollView>

      <Sheet open={!!issueFor} onClose={() => setIssueFor(null)} title="Report an issue" icon="alert">
        {issueFor && (
          <>
            <View style={styles.reviewCard}>
              <ReviewRow k="Shipment" v={`${issueFor.brand} · ${boxWord(issueFor.boxes)}`} />
            </View>
            <Field label="What's wrong? (e.g. 2 cans damaged)" style={{ marginTop: 14 }}>
              <Input value={note} onChange={setNote} placeholder="Describe the issue…" multiline numberOfLines={4} />
            </Field>
            <Btn variant="primary" onPress={submitIssue} disabled={busy || !note.trim()} fullWidth icon="alert">
              {busy ? 'Reporting…' : 'Submit Issue'}
            </Btn>
          </>
        )}
      </Sheet>

      <RecordSaleSheet shipment={sellFor} expenses={expenses} onClose={() => setSellFor(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  pageTitle: { color: colors.text, fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  pageDesc: { color: colors.text3, fontSize: 13, marginTop: 2 },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.accent, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  newBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  card: {
    backgroundColor: colors.panel, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  cardIco: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  cardMain: { flex: 1, minWidth: 0 },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  cardSub: { color: colors.text3, fontSize: 12, marginTop: 2 },
  cardAmt: { color: colors.text, fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
  cardAmtSub: { color: colors.text4, fontSize: 10 },
  cardBody: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  cardActions: { flexDirection: 'row', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: colors.border },
  calcGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  calcCell: {
    flex: 1, backgroundColor: colors.panel2, borderRadius: radius.sm,
    padding: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  calcK: { color: colors.text4, fontSize: 10, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  calcV: { color: colors.text, fontSize: 15, fontWeight: '700' },
  reviewCard: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  kv: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, marginTop: 6 },
  kvK: { color: colors.text3, fontSize: 12.5 },
  kvV: { color: colors.text, fontSize: 12.5, fontWeight: '500' },
});
