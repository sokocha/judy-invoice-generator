import * as db from '../lib/db.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const firms = await db.getAllFirms();
      return res.status(200).json(firms);
    }

    if (req.method === 'POST') {
      const firm = await db.createFirm(req.body);
      return res.status(201).json(firm);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Firms API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
