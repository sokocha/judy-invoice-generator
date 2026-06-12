import * as db from './lib/db.js';
import { authenticate } from './lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = await authenticate(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });

  try {
    if (req.method === 'GET') {
      if (req.query.action === 'pricing') {
        const [plan_prices, addon_prices] = await Promise.all([
          db.getPlanPrices(),
          db.getAddonPrices()
        ]);
        return res.status(200).json({ plan_prices, addon_prices });
      }
      const rows = await db.getReferencePrices();
      return res.status(200).json(rows);
    }

    if (req.method === 'PUT') {
      await db.savePricing(req.body || {});
      const [plan_prices, addon_prices] = await Promise.all([
        db.getPlanPrices(),
        db.getAddonPrices()
      ]);
      return res.status(200).json({ plan_prices, addon_prices });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('reference-prices error:', error);
    return res.status(500).json({ error: error.message });
  }
}
