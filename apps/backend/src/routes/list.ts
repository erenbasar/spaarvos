import { Router } from 'express';
import { registerWatchlist } from '../services/discountChecker';

const router = Router();

// In-memory MVP store — replace with DB in production
const lists: Record<string, string[]> = {};

// GET /api/list/:userId
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  res.json({ userId, products: lists[userId] ?? [] });
});

// POST /api/list/:userId
// body: { products: string[], pushToken: string }
router.post('/:userId', (req, res) => {
  const { userId } = req.params;
  const { products, pushToken } = req.body as { products: string[]; pushToken: string };

  if (!Array.isArray(products)) {
    return res.status(400).json({ error: 'products must be an array' });
  }

  lists[userId] = products;

  if (pushToken) {
    registerWatchlist(userId, pushToken, products);
  }

  return res.json({ userId, products });
});

// PATCH /api/list/:userId/add
// body: { product: string }
router.patch('/:userId/add', (req, res) => {
  const { userId } = req.params;
  const { product } = req.body as { product: string };

  if (!product) return res.status(400).json({ error: 'product is required' });

  if (!lists[userId]) lists[userId] = [];
  if (!lists[userId].includes(product)) lists[userId].push(product);

  return res.json({ userId, products: lists[userId] });
});

// PATCH /api/list/:userId/remove
// body: { product: string }
router.patch('/:userId/remove', (req, res) => {
  const { userId } = req.params;
  const { product } = req.body as { product: string };

  if (!lists[userId]) return res.json({ userId, products: [] });

  lists[userId] = lists[userId].filter((p) => p !== product);
  return res.json({ userId, products: lists[userId] });
});

export default router;
