import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '../../src/hooks/useAppData';
import { buildActivity, dayLabel, money, relTime, avOf, type ActivityEvent } from '../../src/lib/data';
import { DB } from '../../src/lib/supabase';
import { colors, radius } from '../../src/theme';
import Icon from '../../src/components/Icon';
import Avatar from '../../src/components/Avatar';
import { SegmentedControl, SkeletonList, EmptyState, SectionHeader } from '../../src/components/Ui';
import { useToast } from '../../src/components/Toast';

const KIND_ICON: Record<string, { icon: string; bg: string; color: string }> = {
  sent:         { icon: 'send',    bg: 'rgba(56,189,248,0.12)',   color: '#38bdf8' },
  in_transit:   { icon: 'truck',   bg: 'rgba(82,113,255,0.1)',    color: '#5271ff' },
  received:     { icon: 'check',   bg: 'rgba(34,197,94,0.12)',    color: '#22c55e' },
  disputed:     { icon: 'alert',   bg: 'rgba(239,68,68,0.12)',    color: '#ef4444' },
  sold:         { icon: 'dollar',  bg: 'rgba(34,197,94,0.12)',    color: '#22c55e' },
  purchase:     { icon: 'cart',    bg: 'rgba(82,113,255,0.1)',    color: '#5271ff' },
  funding:      { icon: 'cart',    bg: 'rgba(82,113,255,0.1)',    color: '#5271ff' },
  distribution: { icon: 'truck',   bg: 'rgba(239,68,68,0.12)',    color: '#ef4444' },
  operations:   { icon: 'wallet',  bg: 'rgba(239,68,68,0.12)',    color: '#ef4444' },
  expense:      { icon: 'wallet',  bg: 'rgba(239,68,68,0.12)',    color: '#ef4444' },
  contribution: { icon: 'dollar',  bg: 'rgba(82,113,255,0.1)',    color: '#5271ff' },
};

function HistoryRow({ a }: { a: ActivityEvent }) {
  const ki = KIND_ICON[a.kind] || KIND_ICON.expense;
  return (
    <View style={styles.row}>
      <View style={[styles.rowIco, { backgroundColor: ki.bg }]}>
        <Icon name={ki.icon} size={14} color={ki.color} />
      </View>
      <Avatar name={a.who} cls={avOf(a.who)} size={26} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.rowText} numberOfLines={2}>
          <Text style={{ fontWeight: '700', color: colors.text }}>{a.who}</Text>
          <Text style={{ color: colors.text3 }}> {a.act} </Text>
          <Text style={{ color: colors.accent }}>{a.obj}</Text>
        </Text>
        <Text style={styles.rowTime}>{relTime(a.time)}</Text>
      </View>
      {a.amount != null && (
        <Text style={styles.rowAmt}>{money(a.amount)}</Text>
      )}
    </View>
  );
}

export default function HistoryScreen() {
  const { shipments, purchases, expenses, contributions, sales, loading, refresh } = useData();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [scope, setScope] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);

  const SHIP_KINDS = ['sent', 'received', 'disputed', 'sold', 'in_transit'];
  const all = buildActivity(shipments, purchases, expenses, contributions);
  const events = scope === 'all' ? all
    : scope === 'shipments' ? all.filter(e => SHIP_KINDS.includes(e.kind))
    : all.filter(e => !SHIP_KINDS.includes(e.kind));

  const groups: { label: string; items: ActivityEvent[] }[] = [];
  events.forEach(e => {
    const label = dayLabel(e.time);
    let g = groups[groups.length - 1];
    if (!g || g.label !== label) { g = { label, items: [] }; groups.push(g); }
    g.items.push(e);
  });

  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  const confirmClear = () => {
    Alert.alert('Clear all data?', 'This will permanently delete all shipments, purchases, expenses, and contributions. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All', style: 'destructive',
        onPress: async () => {
          setClearing(true);
          try { await DB.clearAll(); await refresh(); showToast('All data cleared'); }
          catch { showToast("Couldn't clear — check connection"); }
          setClearing(false);
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
            <Text style={styles.pageTitle}>History</Text>
            <Text style={styles.pageDesc}>{all.length} event{all.length !== 1 ? 's' : ''} · shipments, funding, sales, costs</Text>
          </View>
          {all.length > 0 && (
            <TouchableOpacity style={styles.dangerBtn} onPress={confirmClear} disabled={clearing} activeOpacity={0.8}>
              <Icon name="trash" size={13} color={colors.danger} />
              <Text style={styles.dangerBtnText}>{clearing ? 'Clearing…' : 'Clear all'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <SegmentedControl
          options={[{ key: 'all', label: 'All' }, { key: 'shipments', label: 'Shipments' }, { key: 'finance', label: 'Finance' }]}
          value={scope}
          onChange={setScope}
        />
        <View style={{ height: 14 }} />

        {loading ? <SkeletonList count={5} /> :
          events.length > 0 ? (
            <View style={{ gap: 12 }}>
              {groups.map(g => (
                <View key={g.label}>
                  <Text style={styles.dayLabel}>{g.label}</Text>
                  <View style={styles.group}>
                    {g.items.map((a, i) => <HistoryRow key={i} a={a} />)}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState icon="history" title="No history" desc="Activity appears here as you add shipments, sales, and expenses" />
          )
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  pageTitle: { color: colors.text, fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  pageDesc: { color: colors.text3, fontSize: 13, marginTop: 2 },
  dangerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.dangerBg, borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  dangerBtnText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  dayLabel: {
    color: colors.text3, fontSize: 11, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 8, paddingLeft: 2,
  },
  group: {
    backgroundColor: colors.panel, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowIco: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  rowText: { fontSize: 12.5, lineHeight: 17 },
  rowTime: { color: colors.text4, fontSize: 10.5, marginTop: 2 },
  rowAmt: {
    color: colors.text3, fontSize: 12, fontVariant: ['tabular-nums'],
    flexShrink: 0,
  },
});
