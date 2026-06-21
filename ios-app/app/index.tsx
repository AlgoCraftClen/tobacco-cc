import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRole, setRole as saveRole } from '../src/lib/storage';
import Avatar from '../src/components/Avatar';
import { colors, radius } from '../src/theme';

export default function IndexScreen() {
  const [checking, setChecking] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    getRole().then(r => {
      if (r === 'Clanny' || r === 'Clenny') {
        router.replace('/(tabs)/dashboard');
      } else {
        setChecking(false);
      }
    });
  }, []);

  const pick = async (name: string) => {
    await saveRole(name);
    router.replace('/(tabs)/dashboard');
  };

  if (checking) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.wrap}>
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>CC</Text>
          </View>
          <View>
            <Text style={styles.brandName}>CC Tobacco OS</Text>
            <Text style={styles.brandSub}>Shipment Tracker</Text>
          </View>
        </View>

        <View style={styles.greetSection}>
          <Text style={styles.greet}>Iakwe!</Text>
          <Text style={styles.question}>Who are you?</Text>
        </View>

        <View style={styles.grid}>
          {(['Clanny', 'Clenny'] as const).map(name => {
            const roles = { Clanny: { role: 'Sender', av: 'av-3' }, Clenny: { role: 'Receiver', av: 'av-1' } };
            const r = roles[name];
            return (
              <TouchableOpacity key={name} style={styles.card} onPress={() => pick(name)} activeOpacity={0.8}>
                <Avatar name={name} cls={r.av} size={52} />
                <Text style={styles.cardName}>{name}</Text>
                <Text style={styles.cardRole}>{r.role}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
  },
  wrap: {
    width: '100%',
    maxWidth: 380,
    paddingHorizontal: 24,
    flex: 1,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 52,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  brandSub: {
    color: colors.text3,
    fontSize: 12,
  },
  greetSection: {
    marginBottom: 36,
  },
  greet: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 6,
  },
  question: {
    color: colors.text3,
    fontSize: 16,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: colors.panel,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  cardName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  cardRole: {
    color: colors.text3,
    fontSize: 12,
    fontWeight: '500',
  },
});
