import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { fetchAHDiscounts } from './ah';
import { fetchJumboDiscounts } from './jumbo';

// In-memory store for MVP — replace with DB queries in production
// { userId -> { pushToken, productNames: string[] } }
const userWatchlists: Record<string, { pushToken: string; products: string[] }> = {};

const expo = new Expo();

export function registerWatchlist(userId: string, pushToken: string, products: string[]) {
  userWatchlists[userId] = { pushToken, products };
}

export async function checkDiscountsAndNotify() {
  const [ahDiscounts, jumboDiscounts] = await Promise.all([
    fetchAHDiscounts(),
    fetchJumboDiscounts(),
  ]);

  const allDiscountedNames = [
    ...ahDiscounts.map((d) => d.title.toLowerCase()),
    ...jumboDiscounts.map((d) => d.title.toLowerCase()),
  ];

  const messages: ExpoPushMessage[] = [];

  for (const [, watchlist] of Object.entries(userWatchlists)) {
    if (!Expo.isExpoPushToken(watchlist.pushToken)) continue;

    const matches = watchlist.products.filter((product) =>
      allDiscountedNames.some((name) => name.includes(product.toLowerCase()))
    );

    if (matches.length === 0) continue;

    messages.push({
      to: watchlist.pushToken,
      sound: 'default',
      title: '🦊 Spaarvos — Indirim var!',
      body: `${matches.join(', ')} bu hafta indirimde!`,
      data: { matches },
    });
  }

  if (messages.length === 0) return;

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    await expo.sendPushNotificationsAsync(chunk);
  }

  console.log(`[notify] Sent ${messages.length} notifications`);
}
