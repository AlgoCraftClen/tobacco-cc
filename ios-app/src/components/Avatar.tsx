import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AV_COLORS: Record<string, { bg: string; text: string }> = {
  'av-1': { bg: '#5271ff', text: '#fff' },
  'av-3': { bg: '#f59e0b', text: '#000' },
};

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

interface AvatarProps {
  name: string;
  cls?: string;
  size?: number;
}

export default function Avatar({ name, cls = 'av-1', size = 30 }: AvatarProps) {
  const { bg, text } = AV_COLORS[cls] || AV_COLORS['av-1'];
  const r = Math.max(6, size * 0.26);
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: r, backgroundColor: bg }]}>
      <Text style={[styles.text, { fontSize: size * 0.38, color: text }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    letterSpacing: -0.5,
  },
});
