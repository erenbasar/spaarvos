import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { searchAHBonusProducts, AHProduct } from './ah';
import { fetchDirkDiscounts, DirkProduct } from './dirk';

export interface DiscountMatch {
  market: 'ah' | 'dirk';
  productQuery: string;
  title: string;
  currentPrice: number;
  priceBeforeBonus?: number;
  discountType?: string | null;
  imageUrl?: string;
}

const userWatchlists: Record<string, { pushToken: string; products: string[] }> = {};

const expo = new Expo();

export function registerWatchlist(userId: string, pushToken: string, products: string[]) {
  userWatchlists[userId] = { pushToken, products };
}

export async function findDiscountsForProducts(productNames: string[]): Promise<DiscountMatch[]> {
  const results: DiscountMatch[] = [];

  const dirkItems = await fetchDirkDiscounts();

  await Promise.all(
    productNames.map(async (query) => {
      const lower = query.toLowerCase();

      // AH
      try {
        const ahProducts = await searchAHBonusProducts(query);
        for (const p of ahProducts.slice(0, 2)) {
          results.push({
            market: 'ah',
            productQuery: query,
            title: p.title,
            currentPrice: p.currentPrice!,
            priceBeforeBonus: p.priceBeforeBonus ?? undefined,
            discountType: p.discountType,
            imageUrl: p.images?.[0]?.url,
          });
        }
      } catch {
        // skip
      }

      // Dirk
      const dirkMatches = dirkItems.filter((d) => d.name.toLowerCase().includes(lower));
      for (const d of dirkMatches.slice(0, 2)) {
        results.push({
          market: 'dirk',
          productQuery: query,
          title: d.name,
          currentPrice: d.price,
          imageUrl: d.imageUrl,
        });
      }
    })
  );

  return results;
}

export async function checkDiscountsAndNotify() {
  const messages: ExpoPushMessage[] = [];

  for (const [, watchlist] of Object.entries(userWatchlists)) {
    if (!Expo.isExpoPushToken(watchlist.pushToken)) continue;

    const matches = await findDiscountsForProducts(watchlist.products);
    if (matches.length === 0) continue;

    const productNames = [...new Set(matches.map((m) => m.productQuery))];

    messages.push({
      to: watchlist.pushToken,
      sound: 'default',
      title: '🦊 Spaarvos — Aanbieding!',
      body: `${productNames.join(', ')} ${productNames.length === 1 ? 'staat' : 'staan'} in de aanbieding!`,
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
