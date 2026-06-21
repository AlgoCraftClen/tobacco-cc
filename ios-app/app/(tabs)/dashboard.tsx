import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '../../src/hooks/useAppData';
import {
  computePartnership, buildActivity, money, fmt, relTime, avOf,
  type ActivityEvent, shipmentFinance,
} from '../../src/lib/data';
import { colors, radius, spacing } from '../../src/theme';
import Icon from '../../src/components/Icon';
import Avatar from '../../src/components/Avatar';
import { MetricCard, SegmentedControl, SkeletonList, EmptyState, ReviewRow, SectionHeader } from '../../src/components/Ui';
import { ShipBadge } from '../../src/components/Badge';

function ActivityRow({ a }: { a: ActivityEvent }) {
  const kindColor: Record<string, string> = {
    sent:         colors.info,
    received:     colors.pos,
    disputed:     colors.danger,
    sold:         colors.pos,
    purchase:     colors.accent,
    funding:      colors.accent,
    distribution: colors.danger,
    expense:      colors.danger,
    contribution: colors.accent,
  };
  const kindIcon: Record<string, string> = {
    sent: 'send', received: 'check', disputed: 'alert', sold: 'dollar',
    purchase: 'cart', funding: 'cart', distribution: 'truck', expense: 'wallet', contribution: 'dollar',
  };
  const c = kindColor[a.kind] || colors.text3;
  const ic = kindIcon[a.kind] || 'clock';
  return (
    <View style={styles.activityRow}>
      <View style={[styles.activityDot, { backgroundColor: c }]} />
      <Avatar name={a.who} cls={avOf(a.who)} size={28} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.activityText} numberOfLines={2}>
          <Text style={{ fontWeight: '700', color: colors.text }}>{a.who}</Text>
          <Text style={{ color: colors.text3 }}> {a.act} </Text>
          <Text style={{ color: colors.accent }}>{a.obj}</Text>
        </Text>
      </View>
      <View style={styles.activityRight}>
        {a.amount != null && <Text style={styles.activityAmt}>{money(a.amount)}</Text>}
        <Text style={styles.activityTime}>{relTime(a.time)}</Text>
      </View>
    </View>
  );
}

function PartnerCard({ name, roleLabel, pos }: {
  name: string;
  roleLabel: string;
  pos: {
    productFunded: number; revenueShare: number; productProfit: number;
    costsPaid: number; shipmentCosts: number; distributionCosts: number; net: number;
  };
}) {
  const [open, setOpen] = useState(false);
  const isGain = pos.net >= 0;
  return (
    <View style={styles.listCard}>
      <TouchableOpacity style={styles.lcHead} onPress={() => setOpen(o => !o)} activeOpacity={0.7}>
        <Avatar name={name} cls={avOf(name)} size={40} />
        <View style={styles.lcMain}>
          <Text style={styles.lcTitle}>{name}</Text>
          <Text style={styles.lcSub}>{roleLabel}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.lcAmt, { color: isGain ? colors.pos : colors.danger }]}>{money(pos.net)}</Text>
          <Text style={styles.lcAmtSub}>net gain</Text>
        </View>
        <Icon name={open ? 'chevD' : 'chevR'} size={15} color={colors.text4} />
      </TouchableOpacity>
      {open && (
        <View style={styles.lcBody}>
          <KV k="Product funded" v={money(pos.productFunded)} />
          <KV k="Revenue share" v={money(pos.revenueShare)} />
          <KV k="Product gain" v={money(pos.productProfit)} color={pos.productProfit >= 0 ? colors.pos : colors.danger} />
          <KV k="Shipment costs paid" v={money(pos.shipmentCosts)} />
          <KV k="Distribution costs" v={money(pos.distributionCosts)} />
          <KV k="Net gain after costs" v={money(pos.net)} color={isGain ? colors.pos : colors.danger} bold />
        </View>
      )}
    </View>
  );
}

function KV({ k, v, color, bold }: { k: string; v: string; color?: string; bold?: boolean }) {
  return (
    <View style={styles.kv}>
      <Text style={[styles.kvK, bold && { color: colors.text, fontWeight: '600' }]}>{k}</Text>
      <Text style={[styles.kvV, color ? { color } : undefined, bold && { fontWeight: '700' }]}>{v}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { shipments, purchases, expenses, contributions, loading, refresh } = useData();
  const [seg, setSeg] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const pt = computePartnership(shipments, purchases, expenses, contributions);
  const sent = shipments.length;
  const pending = shipments.filter(s => s.status === 'pending').length;
  const received = shipments.filter(s => s.status === 'received').length;
  const value = pt.productTotal + pt.manualPurchases;
  const activity = buildActivity(shipments, purchases, expenses, contributions).slice(0, 15);
  const lossy = pt.netProfit < 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: 16, paddingHorizontal: 14 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      showsVerticalScrollIndicator={false}
    >
      <SegmentedControl
        options={[{ key: 'overview', label: 'Overview' }, { key: 'partnership', label: 'P&L' }, { key: 'activity', label: 'Activity' }]}
        value={seg}
        onChange={setSeg}
      />

      <View style={{ height: 14 }} />

      {seg === 'overview' && (
        <>
          {loading ? <SkeletonList count={4} /> : (
            <View style={styles.metricsGrid}>
              <MetricCard icon="send" iconBg={colors.accentSoft} iconColor={colors.accent} value={fmt(sent)} label="Shipments" onPress={() => router.push('/(tabs)/shipments')} />
              <MetricCard icon="cart" iconBg={colors.posBg} iconColor={colors.pos} value={'$' + fmt(value)} label="Product Funded" onPress={() => router.push('/(tabs)/purchases')} />
              <MetricCard icon="clock" iconBg={colors.warnBg} iconColor={colors.warn} value={fmt(pending)} label="Pending" onPress={() => router.push('/(tabs)/receive')} />
              <MetricCard icon="check" iconBg={colors.infoBg} iconColor={colors.info} value={fmt(received)} label="Received" onPress={() => router.push('/(tabs)/history')} />
            </View>
          )}
          <TouchableOpacity
            style={[styles.netCard, { borderColor: lossy ? colors.danger : colors.accentLine, backgroundColor: lossy ? colors.dangerBg : colors.accentSofter }]}
            onPress={() => setSeg('partnership')}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.netLabel}>{lossy ? 'Net loss' : 'Net gain'}</Text>
              <Text style={styles.netDesc}>
                {money(pt.revenue)} sales · {money(pt.productTotal + pt.manualPurchases)} product · {money(pt.extraCosts)} costs
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.netAmt, { color: lossy ? colors.danger : colors.pos }]}>{money(pt.netProfit)}</Text>
              <Icon name="chevR" size={15} color={colors.text4} />
            </View>
          </TouchableOpacity>
        </>
      )}

      {seg === 'partnership' && (
        loading ? <SkeletonList count={3} /> : (
          <View>
            <View style={styles.metricsGrid}>
              <MetricCard icon="dollar" iconBg={colors.posBg} iconColor={colors.pos} value={'$' + fmt(pt.revenue)} label="Sales Revenue" />
              <MetricCard icon="cart" iconBg={colors.accentSoft} iconColor={colors.accent} value={'$' + fmt(pt.productTotal + pt.manualPurchases)} label="Product Funded" />
              <MetricCard icon="wallet" iconBg={colors.dangerBg} iconColor={colors.danger} value={'$' + fmt(pt.extraCosts)} label="Extra Costs" />
              <MetricCard icon="trendUp" iconBg={lossy ? colors.dangerBg : colors.posBg} iconColor={lossy ? colors.danger : colors.pos} value={'$' + fmt(pt.netProfit)} label={lossy ? 'Net Loss' : 'Net Gain'} />
            </View>

            <View style={[styles.summaryCard, { borderColor: lossy ? colors.danger : colors.accentLine, backgroundColor: lossy ? colors.dangerBg : colors.accentSofter }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.summaryLabel}>{lossy ? 'Net loss after all costs' : 'Net gain after all costs'}</Text>
                <Text style={[styles.summaryAmt, { color: lossy ? colors.danger : colors.pos }]}>{money(pt.netProfit)}</Text>
              </View>
              <Text style={styles.summaryDesc}>Sales revenue − product funding − shipment/distribution costs</Text>
            </View>

            <SectionHeader title="Each partner's position" />
            <View style={{ gap: 10 }}>
              {(['Clanny', 'Clenny'] as const).map(name => (
                <PartnerCard
                  key={name}
                  name={name}
                  roleLabel={name === 'Clanny' ? 'Sender · funds and ships' : 'Receiver · sells locally'}
                  pos={{
                    productFunded: pt.productFunded[name],
                    revenueShare: pt.revenueShare[name],
                    productProfit: pt.productProfit[name],
                    costsPaid: pt.costsPaid[name],
                    shipmentCosts: pt.shipmentCostsPaid[name],
                    distributionCosts: pt.distributionCostsPaid[name],
                    net: pt.netGain[name],
                  }}
                />
              ))}
            </View>
          </View>
        )
      )}

      {seg === 'activity' && (
        loading ? <SkeletonList count={5} /> : (
          activity.length > 0 ? (
            <View style={styles.activityCard}>
              {activity.map((a, i) => <ActivityRow key={i} a={a} />)}
            </View>
          ) : (
            <EmptyState icon="bell" title="No activity yet" desc="Create a shipment, record sales, or log a cost" />
          )
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  netCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: 4,
    gap: 12,
  },
  netLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  netDesc: {
    color: colors.text3,
    fontSize: 11.5,
    marginTop: 3,
  },
  netAmt: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  summaryCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  summaryLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  summaryAmt: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  summaryDesc: {
    color: colors.text3,
    fontSize: 11.5,
    marginTop: 5,
  },
  listCard: {
    backgroundColor: colors.panel,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  lcHead: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  lcMain: { flex: 1, minWidth: 0 },
  lcTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  lcSub: { color: colors.text3, fontSize: 12, marginTop: 1 },
  lcAmt: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  lcAmtSub: { color: colors.text4, fontSize: 10, marginTop: 1 },
  lcBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    gap: 2,
  },
  kv: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  kvK: { color: colors.text3, fontSize: 12.5 },
  kvV: { color: colors.text, fontSize: 12.5, fontWeight: '500', fontVariant: ['tabular-nums'] },
  activityCard: {
    backgroundColor: colors.panel,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  activityText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.text,
  },
  activityRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  activityAmt: {
    color: colors.text3,
    fontSize: 11.5,
    fontVariant: ['tabular-nums'],
  },
  activityTime: {
    color: colors.text4,
    fontSize: 10,
    marginTop: 1,
  },
});
