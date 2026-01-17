import * as db from '../lib/db.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      const firm = await db.getFirmById(id);
      if (!firm) {
        return res.status(404).json({ error: 'Firm not found' });
      }
      return res.status(200).json(firm);
    }

    if (req.method === 'PUT') {
      const firm = await db.updateFirm(id, req.body);
      if (!firm) {
        return res.status(404).json({ error: 'Firm not found' });
      }
      return res.status(200).json(firm);
    }

    if (req.method === 'DELETE') {
      await db.deleteFirm(id);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Firm API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
