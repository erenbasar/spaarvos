export interface DiscountMatch {
  market: 'ah' | 'dirk';
  productQuery: string;
  title: string;
  currentPrice: number;
  priceBeforeBonus?: number;
  discountType?: string | null;
  imageUrl?: string;
}
