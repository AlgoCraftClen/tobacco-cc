import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '../../src/hooks/useAppData';
import {
  deriveUnits, computeShipmentSettlement, computePartnership, buildActivity, money, fmt, relTime, avOf, boxWord,
  type ActivityEvent, type Shipment, type Expense, type Sale,
} from '../../src/lib/data';
import { colors, radius, spacing } from '../../src/theme';
import Icon from '../../src/components/Icon';
import Avatar from '../../src/components/Avatar';
import { MetricCard, SegmentedControl, SkeletonList, EmptyState, ReviewRow, SectionHeader } from '../../src/components/Ui';
import { ShipBadge } from '../../src/components/Badge';

function ActivityRow({ a }: { a: ActivityEvent }) {
  const kindColor: Record<string, string> = {
    sent:         colors.info,
    in_transit:   colors.info,
    received:     colors.pos,
    disputed:     colors.danger,
    sold:         colors.pos,
    purchase:     colors.accent,
    funding:      colors.accent,
    distribution: colors.danger,
    operations:   colors.danger,
    expense:      colors.danger,
    contribution: colors.accent,
  };
  const kindIcon: Record<string, string> = {
    sent: 'send', in_transit: 'truck', received: 'check', disputed: 'alert', sold: 'dollar',
    purchase: 'cart', funding: 'cart', distribution: 'truck', operations: 'wallet', expense: 'wallet', contribution: 'dollar',
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

function SettlementCard({ shipment, expenses, sales }: {
  shipment: Shipment;
  expenses: Expense[];
  sales: Sale[];
}) {
  const settlement = computeShipmentSettlement(shipment, expenses, sales);
  const units = deriveUnits(shipment);
  const check = settlement.projectedRevenue - (settlement.clennyProjectedPayout + settlement.clannyProjectedPayout);
  const isBalanced = Math.abs(check) < 0.01;

  return (
    <View style={{ gap: 10 }}>
      <View style={[styles.summaryCard, { borderColor: colors.accentLine, backgroundColor: colors.accentSofter }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.summaryLabel}>Selected shipment</Text>
          <ShipBadge status={shipment.status} />
        </View>
        <Text style={styles.summaryDesc}>{shipment.brand} · {boxWord(shipment.boxes)} · {fmt(units.totalCans)} cans</Text>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard icon="cart" iconBg={colors.accentSoft} iconColor={colors.accent} value={money(settlement.productCost)} label="Product Cost" />
        <MetricCard icon="dollar" iconBg={colors.posBg} iconColor={colors.pos} value={money(settlement.projectedRevenue)} label="Projected Revenue" />
        <MetricCard icon="trendUp" iconBg={settlement.projectedProfit >= 0 ? colors.posBg : colors.dangerBg} iconColor={settlement.projectedProfit >= 0 ? colors.pos : colors.danger} value={money(settlement.projectedProfit)} label={settlement.projectedProfit >= 0 ? 'Projected Profit' : 'Projected Loss'} />
        <MetricCard icon="box" iconBg={colors.infoBg} iconColor={colors.info} value={fmt(settlement.inventoryRemainingCans)} label="Inventory Left" />
      </View>

      <View style={styles.listCard}>
        <TouchableOpacity style={styles.lcHead} activeOpacity={0.7}>
          <Avatar name="Clenny" cls="av-1" size={40} />
          <View style={styles.lcMain}>
            <Text style={styles.lcTitle}>Clenny</Text>
            <Text style={styles.lcSub}>Receiver · sells locally</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.lcAmt}>{money(settlement.clennyProjectedPayout)}</Text>
            <Text style={styles.lcAmtSub}>projected payout</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.lcBody}>
          <KV k="Product invest" v={money(settlement.clennyInvest)} />
          <KV k="Approved ops" v={money(settlement.clennyApprovedOps)} />
          <KV k="Contribution basis" v={money(settlement.clennyContributionBasis)} />
          <KV k="Contribution %" v={`${(settlement.clennyContributionPct * 100).toFixed(1)}%`} />
          <KV k="Projected profit share" v={money(settlement.clennyProjectedProfitShare)} />
          <KV k="Cash collected" v={money(settlement.cashCollectedByClenny)} />
        </View>
      </View>

      <View style={styles.listCard}>
        <TouchableOpacity style={styles.lcHead} activeOpacity={0.7}>
          <Avatar name="Clanny" cls="av-3" size={40} />
          <View style={styles.lcMain}>
            <Text style={styles.lcTitle}>Clanny</Text>
            <Text style={styles.lcSub}>Sender · funds and ships</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.lcAmt}>{money(settlement.clannyProjectedPayout)}</Text>
            <Text style={styles.lcAmtSub}>projected payout</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.lcBody}>
          <KV k="Product invest" v={money(settlement.clannyInvest)} />
          <KV k="Approved ops" v={money(settlement.clannyApprovedOps)} />
          <KV k="Contribution basis" v={money(settlement.clannyContributionBasis)} />
          <KV k="Contribution %" v={`${(settlement.clannyContributionPct * 100).toFixed(1)}%`} />
          <KV k="Projected profit share" v={money(settlement.clannyProjectedProfitShare)} />
          <KV k="Cash collected" v={money(settlement.cashCollectedByClanny)} />
        </View>
      </View>

      <View style={[styles.summaryCard, { borderColor: isBalanced ? colors.pos : colors.danger, backgroundColor: isBalanced ? colors.posBg : colors.dangerBg }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.summaryLabel}>{isBalanced ? 'Formulas balance ✓' : 'Check mismatch'}</Text>
          <Text style={[styles.summaryAmt, { color: isBalanced ? colors.pos : colors.danger }]}>{money(check, 2)}</Text>
        </View>
        <Text style={styles.summaryDesc}>
          Projected revenue − (Clenny payout + Clanny payout) should be $0
        </Text>
      </View>

      <View style={styles.listCard}>
        <View style={styles.lcBody}>
          <KV k="Gross sales to date" v={money(settlement.grossSalesToDate)} />
          <KV k="Current profit" v={money(settlement.currentProfit)} color={settlement.currentProfit >= 0 ? colors.pos : colors.danger} bold />
          <KV k="Inventory sold" v={`${fmt(settlement.inventorySoldCans)} cans`} />
          <KV k="Inventory remaining" v={`${fmt(settlement.inventoryRemainingCans)} cans`} bold />
        </View>
      </View>
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
  const { shipments, purchases, expenses, contributions, sales, loading, refresh } = useData();
  const [seg, setSeg] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const selectedShipment = shipments.find(s => s.id === selectedShipmentId) || shipments[0] || null;

  const pt = computePartnership(shipments, purchases, expenses, contributions, sales);
  const sent = shipments.length;
  const pending = shipments.filter(s => s.status === 'pending').length;
  const inTransit = shipments.filter(s => s.status === 'in_transit').length;
  const received = shipments.filter(s => s.status === 'received').length;
  const activity = buildActivity(shipments, purchases, expenses, contributions).slice(0, 15);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: 16, paddingHorizontal: 14 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      showsVerticalScrollIndicator={false}
    >
      <SegmentedControl
        options={[{ key: 'overview', label: 'Overview' }, { key: 'settlement', label: 'Settlement' }, { key: 'activity', label: 'Activity' }]}
        value={seg}
        onChange={setSeg}
      />

      <View style={{ height: 14 }} />

      {seg === 'overview' && (
        <>
          {loading ? <SkeletonList count={4} /> : (
            <View style={styles.metricsGrid}>
              <MetricCard icon="send" iconBg={colors.accentSoft} iconColor={colors.accent} value={fmt(sent)} label="Shipments" onPress={() => router.push('/(tabs)/shipments')} />
              <MetricCard icon="dollar" iconBg={colors.posBg} iconColor={colors.pos} value={'$' + fmt(pt.totalProjectedRevenue)} label="Projected Revenue" />
              <MetricCard icon="clock" iconBg={colors.warnBg} iconColor={colors.warn} value={fmt(pending + inTransit)} label="Pending / In Transit" onPress={() => router.push('/(tabs)/receive')} />
              <MetricCard icon="check" iconBg={colors.infoBg} iconColor={colors.info} value={fmt(received)} label="Received" onPress={() => router.push('/(tabs)/shipments')} />
            </View>
          )}

          {loading ? <SkeletonList count={2} /> : (
            <>
              <View style={[styles.netCard, { borderColor: pt.totalProjectedProfit >= 0 ? colors.accentLine : colors.danger, backgroundColor: pt.totalProjectedProfit >= 0 ? colors.accentSofter : colors.dangerBg }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.netLabel}>{pt.totalProjectedProfit >= 0 ? 'Projected profit' : 'Projected loss'}</Text>
                  <Text style={styles.netDesc}>
                    {money(pt.totalProjectedRevenue)} projected revenue · {money(pt.totalProductCost)} product cost · {money(pt.totalOps)} ops
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.netAmt, { color: pt.totalProjectedProfit >= 0 ? colors.pos : colors.danger }]}>{money(pt.totalProjectedProfit)}</Text>
                  <Icon name="chevR" size={15} color={colors.text4} />
                </View>
              </View>

              <View style={[styles.summaryCard, { borderColor: colors.border, backgroundColor: colors.panel }]}>
                <Text style={styles.summaryLabel}>Global position</Text>
                <View style={{ marginTop: 10, gap: 6 }}>
                  <KV k="Gross sales to date" v={money(pt.totalGrossSales)} />
                  <KV k="Current profit" v={money(pt.totalCurrentProfit)} color={pt.totalCurrentProfit >= 0 ? colors.pos : colors.danger} bold />
                  <KV k="Clenny net position" v={money(pt.settlementNetPosition.Clenny)} color={pt.settlementNetPosition.Clenny >= 0 ? colors.pos : colors.danger} />
                  <KV k="Clanny net position" v={money(pt.settlementNetPosition.Clanny)} color={pt.settlementNetPosition.Clanny >= 0 ? colors.pos : colors.danger} />
                  <KV k="Inventory remaining" v={`${fmt(pt.totalInventoryRemaining)} cans`} />
                </View>
              </View>
            </>
          )}
        </>
      )}

      {seg === 'settlement' && (
        loading ? <SkeletonList count={5} /> : (
          <View>
            {shipments.length > 0 ? (
              <>
                <Text style={styles.shipmentPickerLabel}>Select a shipment</Text>
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
                            {s.brand} · {boxWord(s.boxes)}
                          </Text>
                          <ShipBadge status={s.status} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                {selectedShipment && (
                  <SettlementCard
                    shipment={selectedShipment}
                    expenses={expenses}
                    sales={sales}
                  />
                )}
              </>
            ) : (
              <EmptyState icon="send" title="No shipments yet" desc="Create a shipment to view settlement" />
            )}
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
  shipmentPickerLabel: {
    color: colors.text2,
    fontSize: 12.5,
    fontWeight: '600',
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
});
