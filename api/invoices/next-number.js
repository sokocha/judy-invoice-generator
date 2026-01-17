import * as db from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const invoiceNumber = await db.getNextInvoiceNumber();
      return res.status(200).json({ invoiceNumber });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Next invoice number API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
