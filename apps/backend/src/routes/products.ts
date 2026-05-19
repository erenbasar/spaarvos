import { Router } from 'express';
import { searchAHProducts, searchAHBonusProducts } from '../services/ah';
import { fetchDirkDiscounts } from '../services/dirk';
import { findDiscountsForProducts } from '../services/discountChecker';

const router = Router();

// GET /api/products/search?q=melk&market=ah
router.get('/search', async (req, res) => {
  const q = req.query.q as string;
  if (!q) return res.status(400).json({ error: 'q is required' });

  try {
    const products = await searchAHProducts(q);
    return res.json({ count: products.length, items: products });
  } catch {
    return res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/products/discounts?q=melk,kaas,appels
router.get('/discounts', async (req, res) => {
  const q = req.query.q as string;
  if (!q) return res.status(400).json({ error: 'q is required (comma-separated product names)' });

  const productNames = q.split(',').map((s) => s.trim()).filter(Boolean);

  try {
    const matches = await findDiscountsForProducts(productNames);
    return res.json({ count: matches.length, items: matches });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch discounts' });
  }
});

// GET /api/products/dirk — all current Dirk weekly discounts
router.get('/dirk', async (_req, res) => {
  try {
    const items = await fetchDirkDiscounts();
    return res.json({ market: 'dirk', count: items.length, items });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch Dirk discounts' });
  }
});

// GET /api/products/bonus?q=melk
router.get('/bonus', async (req, res) => {
  const q = req.query.q as string;
  if (!q) return res.status(400).json({ error: 'q is required' });

  try {
    const items = await searchAHBonusProducts(q);
    return res.json({ count: items.length, items });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch bonus products' });
  }
});

export default router;
