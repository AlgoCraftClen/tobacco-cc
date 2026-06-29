/* Shared primitives: MetricCard, ReviewRow, SegmentedControl, Skeleton, PartnerPick */
import React from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { colors, radius, spacing } from '../theme';
import Icon from './Icon';
import Avatar from './Avatar';

/* ---- MoneyDisplay ---- */
export function MoneyText({ value, decimals = 0, style }: { value: number; decimals?: number; style?: TextStyle }) {
  const formatted = Number(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return <Text style={style}>${formatted}</Text>;
}

/* ---- Metric card (KPI tile) ---- */
interface MetricCardProps {
  icon: string;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
  onPress?: () => void;
}

export function MetricCard({ icon, iconBg, iconColor, value, label, onPress }: MetricCardProps) {
  return (
    <TouchableOpacity
      style={styles.metric}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.metricIco, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={16} color={iconColor} />
      </View>
      <Text style={styles.metricVal}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ---- Review row ---- */
export function ReviewRow({ k, v, total }: { k: string; v: string; total?: boolean }) {
  return (
    <View style={[styles.reviewRow, total && styles.reviewRowTotal]}>
      <Text style={[styles.reviewK, total && styles.reviewKTotal]}>{k}</Text>
      <Text style={[styles.reviewV, total && styles.reviewVTotal]}>{v}</Text>
    </View>
  );
}

/* ---- Info cell (calc grid) ---- */
export function Cell({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <View style={[styles.cell, accent && styles.cellAccent]}>
      <Text style={[styles.cellK, accent && { color: colors.accent }]}>{k}</Text>
      <Text style={[styles.cellV, accent && { color: colors.accent }]}>{v}</Text>
    </View>
  );
}

/* ---- Segmented control ---- */
interface SegOption { key: string; label: string; count?: number }
interface SegmentedProps {
  options: SegOption[];
  value: string;
  onChange: (v: string) => void;
}
export function SegmentedControl({ options, value, onChange }: SegmentedProps) {
  return (
    <View style={styles.seg}>
      {options.map(o => (
        <TouchableOpacity
          key={o.key}
          style={[styles.segBtn, value === o.key && styles.segBtnActive]}
          onPress={() => onChange(o.key)}
          activeOpacity={0.7}
        >
          <Text style={[styles.segText, value === o.key && styles.segTextActive]}>
            {o.label}{o.count !== undefined ? ` ${o.count}` : ''}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/* ---- Partner picker ---- */
interface PartnerPickProps {
  partner: string;
  setPartner: (p: string) => void;
  label?: string;
}
export function PartnerPick({ partner, setPartner, label }: PartnerPickProps) {
  return (
    <View style={styles.field}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.choiceRow}>
        {['Clanny', 'Clenny'].map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.choice, partner === p && styles.choiceActive]}
            onPress={() => setPartner(p)}
            activeOpacity={0.7}
          >
            <Avatar name={p} cls={p === 'Clanny' ? 'av-3' : 'av-1'} size={28} />
            <Text style={[styles.choiceName, partner === p && { color: colors.accent }]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

/* ---- Brand picker ---- */
interface BrandPickProps {
  brand: string;
  setBrand: (b: string) => void;
  brands: readonly string[];
}
export function BrandPick({ brand, setBrand, brands }: BrandPickProps) {
  return (
    <View style={styles.choiceRow}>
      {brands.map(b => (
        <TouchableOpacity
          key={b}
          style={[styles.choice, brand === b && styles.choiceActive]}
          onPress={() => setBrand(b)}
          activeOpacity={0.7}
        >
          <View style={styles.choiceIco}><Icon name="box" size={20} color={brand === b ? colors.accent : colors.text3} /></View>
          <Text style={[styles.choiceName, brand === b && { color: colors.accent }]}>{b}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/* ---- Form field ---- */
interface FieldProps {
  label?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}
export function Field({ label, children, style }: FieldProps) {
  return (
    <View style={[styles.field, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      {children}
    </View>
  );
}

/* ---- Big number input ---- */
interface BigInputProps {
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  placeholder?: string;
  inputMode?: 'decimal' | 'numeric';
  autoFocus?: boolean;
}
export function BigInput({ value, onChange, prefix, placeholder, inputMode = 'decimal', autoFocus }: BigInputProps) {
  return (
    <View style={styles.bigInputWrap}>
      {prefix && <Text style={styles.bigInputPrefix}>{prefix}</Text>}
      <TextInput
        style={[styles.bigInput, prefix && { paddingLeft: 0 }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder || '0'}
        placeholderTextColor={colors.text4}
        keyboardType={inputMode === 'decimal' ? 'decimal-pad' : 'number-pad'}
        keyboardAppearance="dark"
        autoFocus={autoFocus}
      />
    </View>
  );
}

/* ---- Regular input ---- */
interface InputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  inputMode?: 'decimal' | 'numeric' | 'text';
  autoFocus?: boolean;
}
export function Input({ value, onChange, placeholder, multiline, numberOfLines, inputMode, autoFocus }: InputProps) {
  return (
    <TextInput
      style={[styles.input, multiline && { height: (numberOfLines || 4) * 22, textAlignVertical: 'top', paddingTop: 12 }]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.text4}
      keyboardType={inputMode === 'decimal' ? 'decimal-pad' : inputMode === 'numeric' ? 'number-pad' : 'default'}
      keyboardAppearance="dark"
      multiline={multiline}
      numberOfLines={numberOfLines}
      autoFocus={autoFocus}
    />
  );
}

/* ---- Button ---- */
type BtnVariant = 'primary' | 'default' | 'danger' | 'ghost';
interface BtnProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: BtnVariant;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
  icon?: string;
}
export function Btn({ children, onPress, variant = 'default', disabled, style, fullWidth, icon }: BtnProps) {
  const bg = {
    primary: colors.accent,
    default: colors.panel2,
    danger: colors.dangerBg,
    ghost: 'transparent',
  }[variant];
  const fg = {
    primary: '#fff',
    default: colors.text,
    danger: colors.danger,
    ghost: colors.text2,
  }[variant];
  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: bg }, fullWidth && { width: '100%' }, disabled && styles.btnDisabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
    >
      {icon && <Icon name={icon} size={15} color={disabled ? colors.text4 : fg} />}
      <Text style={[styles.btnText, { color: disabled ? colors.text4 : fg }]}>{children}</Text>
    </TouchableOpacity>
  );
}

/* ---- Card ---- */
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/* ---- Skeleton ---- */
export function Skeleton({ h = 16, style }: { h?: number; style?: ViewStyle }) {
  return <View style={[styles.skeleton, { height: h }, style]} />;
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={{ gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.skelCard} />
      ))}
    </View>
  );
}

/* ---- Progress bar ---- */
export function Progress({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.progressBg}>
      <View style={[styles.progressFill, { width: `${pct}%` as unknown as number }]} />
    </View>
  );
}

/* ---- Empty state ---- */
export function EmptyState({ icon, title, desc }: { icon: string; title: string; desc?: string }) {
  return (
    <View style={styles.empty}>
      <Icon name={icon} size={32} color={colors.text4} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {desc && <Text style={styles.emptyDesc}>{desc}</Text>}
    </View>
  );
}

/* ---- Section header ---- */
export function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.secHead}>
      <Text style={styles.secTitle}>{title}</Text>
    </View>
  );
}

/* ---- Loading spinner ---- */
export function Spinner() {
  return (
    <View style={styles.spinner}>
      <ActivityIndicator color={colors.accent} size="small" />
    </View>
  );
}

const styles = StyleSheet.create({
  /* Metric card */
  metric: {
    flex: 1,
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start',
  },
  metricIco: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metricVal: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  metricLabel: {
    color: colors.text3,
    fontSize: 11,
    fontWeight: '500',
  },

  /* Review row */
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reviewRowTotal: {
    borderBottomWidth: 0,
    paddingTop: 11,
  },
  reviewK: {
    color: colors.text2,
    fontSize: 13,
    flex: 1,
  },
  reviewKTotal: {
    color: colors.text,
    fontWeight: '600',
  },
  reviewV: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  reviewVTotal: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },

  /* Cell */
  cell: {
    flex: 1,
    backgroundColor: colors.panel,
    borderRadius: radius.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cellAccent: {
    backgroundColor: colors.accentSofter,
    borderColor: colors.accentLine,
  },
  cellK: {
    color: colors.text3,
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cellV: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },

  /* Segmented control */
  seg: {
    flexDirection: 'row',
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm - 2,
    alignItems: 'center',
  },
  segBtnActive: {
    backgroundColor: colors.panel2,
    borderWidth: 1,
    borderColor: colors.border2,
  },
  segText: {
    color: colors.text3,
    fontSize: 12.5,
    fontWeight: '500',
  },
  segTextActive: {
    color: colors.text,
    fontWeight: '600',
  },

  /* Partner / Brand pick */
  choiceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  choice: {
    flex: 1,
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    minHeight: 72,
    justifyContent: 'center',
  },
  choiceActive: {
    borderColor: colors.accentLine,
    backgroundColor: colors.accentSofter,
  },
  choiceIco: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panel2,
  },
  choiceName: {
    color: colors.text2,
    fontSize: 13,
    fontWeight: '600',
  },

  /* Field */
  field: {
    gap: 8,
    marginBottom: 16,
  },
  label: {
    color: colors.text2,
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  /* Big input */
  bigInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    height: 56,
    paddingHorizontal: 14,
  },
  bigInputPrefix: {
    color: colors.text3,
    fontSize: 20,
    fontWeight: '400',
    marginRight: 4,
  },
  bigInput: {
    flex: 1,
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  /* Input */
  input: {
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    height: 46,
  },

  /* Button */
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: radius.md,
    gap: 7,
    minHeight: 42,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
  },

  /* Card */
  card: {
    backgroundColor: colors.panel,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },

  /* Skeleton */
  skeleton: {
    backgroundColor: colors.panel2,
    borderRadius: radius.sm,
  },
  skelCard: {
    height: 72,
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  /* Progress */
  progressBg: {
    height: 4,
    backgroundColor: colors.panel2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },

  /* Empty */
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    gap: 10,
  },
  emptyTitle: {
    color: colors.text2,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyDesc: {
    color: colors.text3,
    fontSize: 13,
    textAlign: 'center',
  },

  /* Section header */
  secHead: {
    paddingVertical: 8,
    paddingHorizontal: 2,
    marginBottom: 6,
  },
  secTitle: {
    color: colors.text3,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  /* Spinner */
  spinner: {
    padding: 40,
    alignItems: 'center',
  },
});
