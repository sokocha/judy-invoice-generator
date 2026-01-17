import * as db from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const scheduled = await db.getAllScheduledInvoices();
      return res.status(200).json(scheduled);
    }

    if (req.method === 'POST') {
      const scheduled = await db.createScheduledInvoice(req.body);
      return res.status(201).json(scheduled);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Scheduled invoices API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
