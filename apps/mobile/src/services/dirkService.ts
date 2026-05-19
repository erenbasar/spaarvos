import axios from 'axios';

const DIRK_URL = 'https://www.dirk.nl/aanbiedingen';

export interface DirkProduct {
  name: string;
  price: number;
  imageUrl?: string;
}

export async function fetchDirkDiscounts(): Promise<DirkProduct[]> {
  try {
    const res = await axios.get<string>(DIRK_URL, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' },
    });
    const html = res.data as string;
    const match = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
    if (!match) return [];

    const json = JSON.parse(match[1]);
    const itemList = json['@graph']?.find((g: { '@type': string }) => g['@type'] === 'ItemList');
    if (!itemList?.itemListElement) return [];

    return itemList.itemListElement.map((entry: {
      item: { name: string; image?: string[]; offers: { price: number } };
    }) => ({
      name: entry.item.name,
      price: entry.item.offers.price,
      imageUrl: entry.item.image?.[0],
    }));
  } catch {
    return [];
  }
}
