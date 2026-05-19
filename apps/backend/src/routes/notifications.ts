import { Router } from 'express';
import { checkDiscountsAndNotify } from '../services/discountChecker';

const router = Router();

// POST /api/notifications/trigger — manual trigger for testing
router.post('/trigger', async (_req, res) => {
  await checkDiscountsAndNotify();
  res.json({ status: 'triggered' });
});

export default router;
