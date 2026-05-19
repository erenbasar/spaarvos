import axios from 'axios';

const AH_AUTH_URL = 'https://api.ah.nl/mobile-auth/v1/auth/token/anonymous';
const AH_BONUS_URL = 'https://api.ah.nl/mobile-services/bonuspage/v1/bonus';

interface AHToken {
  access_token: string;
}

interface AHBonus {
  productId: number;
  title: string;
  description?: string;
  discountType: string;
  bonusStartDate: string;
  bonusEndDate: string;
  image?: string;
}

async function getToken(): Promise<string> {
  const res = await axios.post<AHToken>(
    AH_AUTH_URL,
    { clientId: 'appie' },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return res.data.access_token;
}

export async function fetchAHDiscounts(): Promise<AHBonus[]> {
  try {
    const token = await getToken();
    const res = await axios.get<{ bonuses: AHBonus[] }>(AH_BONUS_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.bonuses ?? [];
  } catch (err) {
    console.error('[AH] Failed to fetch discounts:', err);
    return [];
  }
}
