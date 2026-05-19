import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import productsRouter from './routes/products';
import listRouter from './routes/list';
import notificationsRouter from './routes/notifications';
import { checkDiscountsAndNotify } from './services/discountChecker';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/products', productsRouter);
app.use('/api/list', listRouter);
app.use('/api/notifications', notificationsRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'spaarvos-backend' });
});

// Every Wednesday at 08:00 — Dutch supermarkets publish new weekly discounts
cron.schedule('0 8 * * 3', async () => {
  console.log('[cron] Checking weekly discounts...');
  await checkDiscountsAndNotify();
});

app.listen(PORT, () => {
  console.log(`Spaarvos backend running on port ${PORT}`);
});
