import axios from 'axios';

const AUTH_URL = 'https://api.ah.nl/mobile-auth/v1/auth/token/anonymous';
const SEARCH_URL = 'https://api.ah.nl/mobile-services/product/search/v2';

export interface AHProduct {
  webshopId: number;
  title: string;
  isBonus: boolean;
  currentPrice: number | null;
  priceBeforeBonus: number | null;
  discountType: string | null;
  bonusStartDate: string | null;
  bonusEndDate: string | null;
  bonusMechanism: string | null;
  images: { url: string }[];
  mainCategory: string;
}

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const res = await axios.post<{ access_token: string }>(
    AUTH_URL,
    { clientId: 'appie' },
    { headers: { 'Content-Type': 'application/json' } }
  );
  cachedToken = res.data.access_token;
  tokenExpiry = Date.now() + 55 * 60 * 1000; // 55 min
  return cachedToken;
}

export async function searchAHProducts(query: string): Promise<AHProduct[]> {
  const token = await getToken();
  const res = await axios.get<{ products: AHProduct[] }>(SEARCH_URL, {
    params: { query, sortOn: 'RELEVANCE', size: 20 },
    headers: {
      Authorization: `Bearer ${token}`,
      'x-application': 'AHWEBSHOP',
    },
  });
  return res.data.products ?? [];
}

export async function searchAHBonusProducts(query: string): Promise<AHProduct[]> {
  const products = await searchAHProducts(query);
  return products.filter((p) => p.isBonus && p.currentPrice !== null);
}
