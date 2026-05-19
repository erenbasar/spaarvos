import axios from 'axios';

const JUMBO_PROMOTIONS_URL = 'https://mobileapi.jumbo.com/v17/promotions';

interface JumboPromotion {
  id: string;
  title: string;
  subtitle?: string;
  startDate: string;
  endDate: string;
  image?: string;
  tags?: string[];
}

interface JumboResponse {
  promotions: {
    data: JumboPromotion[];
  };
}

export async function fetchJumboDiscounts(): Promise<JumboPromotion[]> {
  try {
    const res = await axios.get<JumboResponse>(JUMBO_PROMOTIONS_URL, {
      headers: {
        'x-jumbo-token': 'youreshoppingcartlovesjumbo',
      },
    });
    return res.data.promotions?.data ?? [];
  } catch (err) {
    console.error('[Jumbo] Failed to fetch discounts:', err);
    return [];
  }
}
