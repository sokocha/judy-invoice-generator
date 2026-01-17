import * as db from './lib/db.js';
import { verifyEmailConfig } from './lib/email.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    // GET /api/email-config?action=verify
    if (req.method === 'GET' && action === 'verify') {
      const result = await verifyEmailConfig();
      return res.status(200).json(result);
    }

    // GET /api/email-config
    if (req.method === 'GET') {
      const config = await db.getEmailConfig();
      return res.status(200).json({
        ...config,
        smtp_pass: config.smtp_pass ? '********' : ''
      });
    }

    // PUT /api/email-config
    if (req.method === 'PUT') {
      const currentConfig = await db.getEmailConfig();
      const newConfig = {
        ...req.body,
        smtp_pass: (req.body.smtp_pass && req.body.smtp_pass !== '********')
          ? req.body.smtp_pass
          : currentConfig.smtp_pass
      };

      await db.updateEmailConfig(newConfig);
      return res.status(200).json({ success: true, message: 'Email configuration updated' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Email config API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
