import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchAHBonus } from '../services/ahService';
import { fetchDirkDiscounts } from '../services/dirkService';

export const DISCOUNT_TASK = 'SPAARVOS_DISCOUNT_CHECK';
const STORAGE_KEY = 'spaarvos_list';
const LAST_NOTIFIED_KEY = 'spaarvos_last_notified';

TaskManager.defineTask(DISCOUNT_TASK, async () => {
  try {
    // Only notify once per day
    const lastNotified = await AsyncStorage.getItem(LAST_NOTIFIED_KEY);
    const today = new Date().toDateString();
    if (lastNotified === today) return BackgroundFetch.BackgroundFetchResult.NoData;

    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const products: string[] = stored ? JSON.parse(stored) : [];
    if (products.length === 0) return BackgroundFetch.BackgroundFetchResult.NoData;

    const [dirkItems, ...ahResults] = await Promise.all([
      fetchDirkDiscounts(),
      ...products.map((p) => searchAHBonus(p)),
    ]);

    // { product -> Set<market> }
    const matchMap: Record<string, Set<string>> = {};

    products.forEach((product, i) => {
      const ahBonus = ahResults[i];
      if (ahBonus && ahBonus.length > 0) {
        if (!matchMap[product]) matchMap[product] = new Set();
        matchMap[product].add('Albert Heijn');
      }
      const lower = product.toLowerCase();
      const dirkMatch = dirkItems.some((d) => {
        const dLower = d.name.toLowerCase();
        return dLower.includes(lower) || lower.includes(dLower);
      });
      if (dirkMatch) {
        if (!matchMap[product]) matchMap[product] = new Set();
        matchMap[product].add('Dirk');
      }
    });

    if (Object.keys(matchMap).length === 0) return BackgroundFetch.BackgroundFetchResult.NoData;

    // Build readable lines: "Melk bij Albert Heijn & Dirk"
    const lines = Object.entries(matchMap).map(
      ([product, markets]) => `${product} bij ${[...markets].join(' & ')}`
    );

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🦊 Spaarvos — Aanbieding!',
        body: lines.join('\n'),
        sound: true,
      },
      trigger: null,
    });

    await AsyncStorage.setItem(LAST_NOTIFIED_KEY, today);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerDiscountTask() {
  const status = await BackgroundFetch.getStatusAsync();
  if (
    status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
    status === BackgroundFetch.BackgroundFetchStatus.Denied
  ) return;

  const isRegistered = await TaskManager.isTaskRegisteredAsync(DISCOUNT_TASK);
  if (!isRegistered) {
    await BackgroundFetch.registerTaskAsync(DISCOUNT_TASK, {
      minimumInterval: 60 * 60 * 8, // check every 8 hours, OS decides exact timing
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }
}
