import * as db from '../../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      const invoice = await db.getInvoiceById(id);
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // Note: In serverless, we can't store generated documents in memory across requests.
      // The user needs to regenerate the invoice to download it.
      return res.status(404).json({
        error: 'Invoice file not available. Please regenerate the invoice.',
        invoice
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Download invoice API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
