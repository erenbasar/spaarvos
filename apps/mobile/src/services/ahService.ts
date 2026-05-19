import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_URL = 'https://api.ah.nl/mobile-auth/v1/auth/token/anonymous';
const SEARCH_URL = 'https://api.ah.nl/mobile-services/product/search/v2';
const TOKEN_KEY = 'ah_token';
const TOKEN_EXPIRY_KEY = 'ah_token_expiry';

async function getToken(): Promise<string> {
  const [token, expiry] = await Promise.all([
    AsyncStorage.getItem(TOKEN_KEY),
    AsyncStorage.getItem(TOKEN_EXPIRY_KEY),
  ]);
  if (token && expiry && Date.now() < parseInt(expiry)) return token;

  const res = await axios.post<{ access_token: string }>(
    AUTH_URL,
    { clientId: 'appie' },
    { headers: { 'Content-Type': 'application/json' } }
  );
  const newToken = res.data.access_token;
  const newExpiry = String(Date.now() + 55 * 60 * 1000);
  await Promise.all([
    AsyncStorage.setItem(TOKEN_KEY, newToken),
    AsyncStorage.setItem(TOKEN_EXPIRY_KEY, newExpiry),
  ]);
  return newToken;
}

export interface AHProduct {
  webshopId: number;
  title: string;
  salesUnitSize?: string;
  isBonus: boolean;
  currentPrice: number | null;
  priceBeforeBonus: number | null;
  discountType: string | null;
  images: { url: string }[];
}

export async function searchAH(query: string): Promise<AHProduct[]> {
  const token = await getToken();
  const res = await axios.get<{ products: AHProduct[] }>(SEARCH_URL, {
    params: { query, sortOn: 'RELEVANCE', size: 20 },
    headers: { Authorization: `Bearer ${token}`, 'x-application': 'AHWEBSHOP' },
    timeout: 10000,
  });
  return res.data.products ?? [];
}

export async function searchAHBonus(query: string): Promise<AHProduct[]> {
  const products = await searchAH(query);
  return products.filter((p) => p.isBonus && p.currentPrice !== null);
}
