import axios from 'axios';

const DIRK_URL = 'https://www.dirk.nl/aanbiedingen';

export interface DirkProduct {
  name: string;
  price: number;
  oldPrice?: number;
  imageUrl?: string;
}

function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

export async function fetchDirkDiscounts(): Promise<DirkProduct[]> {
  try {
    const res = await axios.get<string>(DIRK_URL, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' },
    });
    const html = res.data as string;

    const fotoRe = /alt="Foto van ([^"]+)"/g;
    const seen = new Set<string>();
    const results: DirkProduct[] = [];
    let m: RegExpExecArray | null;

    while ((m = fotoRe.exec(html)) !== null) {
      const name = decodeHtml(m[1].trim());
      if (seen.has(name)) continue;
      seen.add(name);

      const chunk = html.slice(m.index, m.index + 700);
      const largMatch = chunk.match(/price-large[^>]*>([\d]+)<\/span>/);
      if (!largMatch) continue;

      const beforePrice = chunk.slice(0, chunk.indexOf(largMatch[0]));
      const hasEuros = beforePrice.includes('hasEuros');
      const large = parseInt(largMatch[1]);
      const smallMatch = chunk.match(/price-small[^>]*>([\d]+)<\/span>/);

      let price: number;
      if (hasEuros && smallMatch) price = large + parseInt(smallMatch[1]) / 100;
      else if (hasEuros) price = large;
      else price = large / 100;

      const oldMatch = chunk.match(/regular-price[^<]*<span[^>]*>([\d.,]+)/);
      const imageMatch = chunk.match(/src="(https:\/\/web-fileserver\.dirk\.nl\/(?:artikelen|offers)[^"]+)"/);

      results.push({
        name,
        price,
        oldPrice: oldMatch ? parseFloat(oldMatch[1].replace(',', '.')) : undefined,
        imageUrl: imageMatch?.[1],
      });
    }

    return results;
  } catch (err) {
    console.error('[Dirk] Failed to fetch discounts:', err);
    return [];
  }
}
