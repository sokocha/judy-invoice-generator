import * as db from './lib/db.js';
import { authenticate } from './lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Authenticate request
  const auth = await authenticate(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  // Extract ID from query if present (e.g., /api/firms?id=123)
  const { id } = req.query;

  try {
    // Single firm operations
    if (id) {
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
    }

    // Collection operations
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
