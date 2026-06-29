import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

type BadgeKind = 'pos' | 'warn' | 'danger' | 'info' | 'neutral' | 'accent';

const BADGE_STYLES: Record<BadgeKind, { bg: string; text: string }> = {
  pos:     { bg: colors.posBg,       text: colors.pos },
  warn:    { bg: colors.warnBg,      text: colors.warn },
  danger:  { bg: colors.dangerBg,    text: colors.danger },
  info:    { bg: colors.infoBg,      text: colors.info },
  neutral: { bg: colors.panel2,      text: colors.text2 },
  accent:  { bg: colors.accentSoft,  text: colors.accent },
};

interface BadgeProps {
  kind?: BadgeKind;
  children: React.ReactNode;
}

export default function Badge({ kind = 'neutral', children }: BadgeProps) {
  const { bg, text } = BADGE_STYLES[kind] || BADGE_STYLES.neutral;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{children}</Text>
    </View>
  );
}

export function ShipBadge({ status }: { status: string }) {
  const map: Record<string, { kind: BadgeKind; label: string }> = {
    pending:    { kind: 'warn',    label: 'Pending' },
    in_transit: { kind: 'info',    label: 'In Transit' },
    received:   { kind: 'pos',     label: 'Received' },
    disputed:   { kind: 'danger',  label: 'Disputed' },
  };
  const s = map[status] || map.pending;
  return <Badge kind={s.kind}>{s.label}</Badge>;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
