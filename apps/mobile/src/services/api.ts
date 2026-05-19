import axios from 'axios';
import { DiscountMatch } from './types';

// Use your machine's local IP so Expo Go on a real device can reach the backend
export const API_HOST = '192.168.2.25';
const API_URL = `http://${API_HOST}:3000/api`;

export const api = axios.create({ baseURL: API_URL, timeout: 15000 });

export async function getDiscountsForProducts(products: string[]): Promise<DiscountMatch[]> {
  if (products.length === 0) return [];
  const q = products.join(',');
  const res = await api.get<{ count: number; items: DiscountMatch[] }>(`/products/discounts?q=${encodeURIComponent(q)}`);
  return res.data.items;
}
