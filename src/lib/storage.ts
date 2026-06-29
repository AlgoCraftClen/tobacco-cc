import AsyncStorage from '@react-native-async-storage/async-storage';

const ROLE_KEY = 'cc_role';

export async function getRole(): Promise<string | null> {
  return AsyncStorage.getItem(ROLE_KEY);
}

export async function setRole(name: string): Promise<void> {
  await AsyncStorage.setItem(ROLE_KEY, name);
}

export async function clearRole(): Promise<void> {
  await AsyncStorage.removeItem(ROLE_KEY);
}
