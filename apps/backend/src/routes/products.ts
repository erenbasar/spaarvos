import { Router } from 'express';
import { fetchAHDiscounts } from '../services/ah';
import { fetchJumboDiscounts } from '../services/jumbo';

const router = Router();

// GET /api/products/discounts?market=ah|jumbo|all
router.get('/discounts', async (req, res) => {
  const market = (req.query.market as string) ?? 'all';

  try {
    if (market === 'ah') {
      const data = await fetchAHDiscounts();
      return res.json({ market: 'ah', count: data.length, items: data });
    }
    if (market === 'jumbo') {
      const data = await fetchJumboDiscounts();
      return res.json({ market: 'jumbo', count: data.length, items: data });
    }

    const [ah, jumbo] = await Promise.all([fetchAHDiscounts(), fetchJumboDiscounts()]);
    return res.json({
      ah: { count: ah.length, items: ah },
      jumbo: { count: jumbo.length, items: jumbo },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch discounts' });
  }
});

export default router;
