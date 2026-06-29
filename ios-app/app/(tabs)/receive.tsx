import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '../../src/hooks/useAppData';
import { deriveUnits, shipmentFinance, money, fmt, fmtDate, boxWord, type Shipment } from '../../src/lib/data';
import { DB } from '../../src/lib/supabase';
import { colors, radius } from '../../src/theme';
import Icon from '../../src/components/Icon';
import Sheet from '../../src/components/Sheet';
import { ShipBadge } from '../../src/components/Badge';
import { SkeletonList, EmptyState, ReviewRow, Field, Input, Btn } from '../../src/components/Ui';
import { useToast } from '../../src/components/Toast';
import { getRole } from '../../src/lib/storage';
import { TouchableOpacity } from 'react-native';

function ReceiveCard({ s, onConfirm, onReport, busy, roleName }: {
  s: Shipment;
  onConfirm: (s: Shipment) => void;
  onReport: (s: Shipment) => void;
  busy: boolean;
  roleName: string;
}) {
  const { expenses } = useData();
  const [open, setOpen] = useState(false);
  const finance = shipmentFinance(s, expenses);
  const units = deriveUnits(s);
  const showActions = roleName === 'Clenny';

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHead} onPress={() => setOpen(o => !o)} activeOpacity={0.7}>
        <View style={[styles.cardIco, { backgroundColor: colors.warnBg }]}>
          <Icon name="inbox" size={19} color={colors.warn} />
        </View>
        <View style={styles.cardMain}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.cardTitle}>{s.brand}</Text>
            <ShipBadge status={s.status} />
          </View>
          <Text style={styles.cardSub}>{boxWord(s.boxes)} · {fmt(units.totalCans)} cans · from Clanny</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.cardAmt}>{money(finance.productTotal)}</Text>
          <Text style={styles.cardAmtSub}>{s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</Text>
        </View>
        <Icon name={open ? 'chevD' : 'chevR'} size={15} color={colors.text4} />
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          <View style={styles.calcGrid}>
            {[['Boxes', fmt(s.boxes)], ['Cases', fmt(units.cases)], ['Rolls', fmt(units.rolls)], ['Cans', fmt(units.totalCans)]].map(([k, v]) => (
              <View key={k} style={styles.calcCell}>
                <Text style={styles.calcK}>{k}</Text>
                <Text style={styles.calcV}>{v}</Text>
              </View>
            ))}
          </View>
          <View style={styles.reviewCard}>
            <ReviewRow k="Cost / case" v={money(s.costPerCase, 2)} />
            <ReviewRow k="Product total" v={money(finance.productTotal)} />
            <ReviewRow k="Clenny invest" v={money(s.clennyProductInvest)} />
            <ReviewRow k="Clanny invest" v={money(s.clannyProductInvest)} />
            {finance.shipmentCosts > 0 && <ReviewRow k="Extra shipment costs" v={money(finance.shipmentCosts)} />}
            <ReviewRow k="All-in total" v={money(finance.allInTotal)} total />
          </View>
        </View>
      )}

      {showActions && (
        <View style={styles.cardActions}>
          <Btn variant="danger" onPress={() => onReport(s)} disabled={busy} icon="alert">Report Issue</Btn>
          <Btn variant="primary" onPress={() => onConfirm(s)} disabled={busy} icon="check">Confirm Received</Btn>
        </View>
      )}
    </View>
  );
}

export default function ReceiveScreen() {
  const { shipments, loading, refresh } = useData();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [issueFor, setIssueFor] = useState<Shipment | null>(null);
  const [note, setNote] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [roleName, setRoleName] = useState('Clanny');

  useEffect(() => { getRole().then(r => { if (r) setRoleName(r); }); }, []);

  const pending = shipments.filter(s => s.status === 'pending' || s.status === 'in_transit');

  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  const confirm = async (s: Shipment) => {
    setBusy(true);
    try { await DB.shipments.receive(s.id); await refresh(); showToast(`${s.brand} shipment received`); }
    catch { showToast("Couldn't update — check connection"); }
    setBusy(false);
  };

  const submitIssue = async () => {
    if (!issueFor) return;
    setBusy(true);
    try { await DB.shipments.dispute(issueFor.id, note.trim()); await refresh(); showToast('Issue reported to Clanny'); setIssueFor(null); }
    catch { showToast("Couldn't report — check connection"); }
    setBusy(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: 12, paddingHorizontal: 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.pageTitle}>Receive</Text>
          <Text style={styles.pageDesc}>
            {pending.length} shipment{pending.length !== 1 ? 's' : ''} from Clanny awaiting confirmation
          </Text>
        </View>

        {roleName !== 'Clenny' && (
          <View style={styles.roleNote}>
            <Icon name="alert" size={15} color={colors.text3} />
            <Text style={styles.roleNoteText}>
              Receiving is Clenny's role. You're signed in as {roleName} — you can review, but Clenny confirms.
            </Text>
          </View>
        )}

        {loading ? <SkeletonList count={3} /> :
          pending.length > 0 ? (
            <View style={{ gap: 10 }}>
              {pending.map(s => (
                <ReceiveCard key={s.id} s={s} busy={busy} onConfirm={confirm} onReport={s => { setIssueFor(s); setNote(''); }} roleName={roleName} />
              ))}
            </View>
          ) : (
            <EmptyState icon="check" title="All caught up" desc="No pending shipments to receive" />
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
              <Input value={note} onChange={setNote} placeholder="Describe the issue…" multiline numberOfLines={4} autoFocus />
            </Field>
            <Btn variant="primary" onPress={submitIssue} disabled={busy || !note.trim()} fullWidth icon="alert">
              {busy ? 'Reporting…' : 'Submit Issue'}
            </Btn>
          </>
        )}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  pageTitle: { color: colors.text, fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  pageDesc: { color: colors.text3, fontSize: 13, marginTop: 2 },
  roleNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.accentSofter, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.accentLine,
    padding: 12, marginBottom: 14,
  },
  roleNoteText: { color: colors.text2, fontSize: 12.5, flex: 1, lineHeight: 18 },
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
  calcK: { color: colors.text4, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  calcV: { color: colors.text, fontSize: 15, fontWeight: '700' },
  reviewCard: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 4 },
});
