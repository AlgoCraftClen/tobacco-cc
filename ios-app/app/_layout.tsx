import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ToastProvider } from '../src/components/Toast';
import { AppDataProvider } from '../src/hooks/useAppData';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppDataProvider>
        <ToastProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0a0a0a' } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="new-shipment"
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
          </Stack>
        </ToastProvider>
      </AppDataProvider>
    </SafeAreaProvider>
  );
}
