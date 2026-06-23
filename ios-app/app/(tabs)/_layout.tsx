import React, { useState, useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../../src/theme';
import Icon from '../../src/components/Icon';
import Avatar from '../../src/components/Avatar';
import { getRole, setRole, clearRole } from '../../src/lib/storage';
import Sheet from '../../src/components/Sheet';
import { useToast } from '../../src/components/Toast';

type RoleName = 'Clanny' | 'Clenny';
type TabScreenOptionsArgs = { route: { name: string } };
type TabBarIconArgs = { color: string; focused: boolean };

const TABS = [
  { key: 'dashboard', label: 'Home',     icon: 'home'    },
  { key: 'shipments', label: 'Ships',    icon: 'send'    },
  { key: 'receive',   label: 'Receive',  icon: 'inbox'   },
  { key: 'sale',      label: 'Sale',     icon: 'reports' },
  { key: 'purchases', label: 'Funding',  icon: 'cart'    },
  { key: 'history',   label: 'History',  icon: 'history' },
];

function TabBarIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  return <Icon name={name} size={22} color={color} strokeWidth={focused ? 2 : 1.5} />;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const [role, setRoleState] = useState<RoleName | null>(null);
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    getRole().then(r => {
      if (r === 'Clanny' || r === 'Clenny') setRoleState(r);
      else router.replace('/');
    });
  }, []);

  const pickRole = async (name: RoleName) => {
    await setRole(name);
    setRoleState(name);
    setRoleSheetOpen(false);
    showToast(`Switched to ${name}`);
  };

  const switchRole = () => setRoleSheetOpen(true);

  return (
    <>
      <Tabs
        screenOptions={({ route }: TabScreenOptionsArgs) => {
          const tab = TABS.find(t => t.key === route.name);
          return {
            headerShown: true,
            headerStyle: { backgroundColor: colors.panel, borderBottomColor: colors.border },
            headerTintColor: colors.text,
            headerTitleStyle: { color: colors.text, fontWeight: '700', fontSize: 16 },
            headerShadowVisible: false,
            headerRight: () => role ? (
              <TouchableOpacity
                onPress={switchRole}
                style={styles.roleChip}
                activeOpacity={0.7}
              >
                <Avatar name={role} cls={role === 'Clanny' ? 'av-3' : 'av-1'} size={24} />
                <Text style={styles.roleChipText}>{role}</Text>
                <Icon name="swap" size={13} color={colors.text3} />
              </TouchableOpacity>
            ) : null,
            tabBarStyle: {
              backgroundColor: colors.panel,
              borderTopColor: colors.border,
              borderTopWidth: 1,
              height: 54 + insets.bottom,
              paddingBottom: insets.bottom + 4,
              paddingTop: 6,
            },
            tabBarActiveTintColor: colors.accent,
            tabBarInactiveTintColor: colors.text4,
            tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: -2 },
            tabBarIcon: ({ color, focused }: TabBarIconArgs) => (
              <TabBarIcon name={tab?.icon || 'grid'} color={color} focused={focused} />
            ),
          };
        }}
      >
        {TABS.map(tab => (
          <Tabs.Screen
            key={tab.key}
            name={tab.key}
            options={{ title: tab.label }}
          />
        ))}
      </Tabs>

      <Sheet open={roleSheetOpen} onClose={() => setRoleSheetOpen(false)} title="Switch role" icon="swap">
        <Text style={styles.roleHint}>Clanny is the Sender · Clenny is the Receiver</Text>
        <View style={styles.roleGrid}>
          {(['Clanny', 'Clenny'] as RoleName[]).map(name => {
            const isActive = role === name;
            const av = name === 'Clanny' ? 'av-3' : 'av-1';
            const roleLabel = name === 'Clanny' ? 'Sender' : 'Receiver';
            return (
              <TouchableOpacity
                key={name}
                style={[styles.roleCard, isActive && styles.roleCardActive]}
                onPress={() => pickRole(name)}
                activeOpacity={0.8}
              >
                <Avatar name={name} cls={av} size={44} />
                <Text style={styles.roleCardName}>{name}</Text>
                <Text style={styles.roleCardRole}>{roleLabel}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.panel2,
    borderRadius: radius.xl,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleChipText: {
    color: colors.text2,
    fontSize: 13,
    fontWeight: '600',
  },
  roleHint: {
    color: colors.text3,
    fontSize: 13,
    marginBottom: 20,
  },
  roleGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  roleCard: {
    flex: 1,
    backgroundColor: colors.panel,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    alignItems: 'center',
    gap: 8,
  },
  roleCardActive: {
    borderColor: colors.accentLine,
    backgroundColor: colors.accentSofter,
  },
  roleCardName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  roleCardRole: {
    color: colors.text3,
    fontSize: 12,
  },
});
