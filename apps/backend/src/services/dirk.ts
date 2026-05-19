import axios from 'axios';

const DIRK_URL = 'https://www.dirk.nl/aanbiedingen';

export interface DirkProduct {
  name: string;
  sku: number;
  price: number;
  imageUrl?: string;
  productUrl: string;
}

export async function fetchDirkDiscounts(): Promise<DirkProduct[]> {
  try {
    const res = await axios.get<string>(DIRK_URL, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' },
    });

    const html = res.data;
    const match = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
    if (!match) return [];

    const json = JSON.parse(match[1]);
    const itemList = json['@graph']?.find((g: { '@type': string }) => g['@type'] === 'ItemList');
    if (!itemList?.itemListElement) return [];

    return itemList.itemListElement.map((entry: {
      item: {
        name: string;
        sku: number;
        image?: string[];
        url: string;
        offers: { price: number };
      };
    }) => ({
      name: entry.item.name,
      sku: entry.item.sku,
      price: entry.item.offers.price,
      imageUrl: entry.item.image?.[0],
      productUrl: `https://www.dirk.nl${entry.item.url}`,
    }));
  } catch (err) {
    console.error('[Dirk] Failed to fetch discounts:', err);
    return [];
  }
}
