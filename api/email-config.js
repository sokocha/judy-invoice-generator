import * as db from './lib/db.js';
import { verifyEmailConfig, normalizeSmtpPass } from './lib/email.js';
import { authenticate } from './lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Authenticate request
  const auth = await authenticate(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
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
        smtp_pass: config.smtp_pass ? '********' : '',
        backup_smtp_pass: config.backup_smtp_pass ? '********' : ''
      });
    }

    // PUT /api/email-config
    if (req.method === 'PUT') {
      const currentConfig = await db.getEmailConfig();
      const trimmed = (v) => (typeof v === 'string' ? v.trim() : v);
      const newConfig = {
        ...req.body,
        smtp_host: trimmed(req.body.smtp_host),
        smtp_user: trimmed(req.body.smtp_user),
        from_email: trimmed(req.body.from_email),
        accountant_email: trimmed(req.body.accountant_email),
        backup_smtp_user: trimmed(req.body.backup_smtp_user),
        smtp_pass: (req.body.smtp_pass && req.body.smtp_pass.trim() && req.body.smtp_pass !== '********')
          ? normalizeSmtpPass(req.body.smtp_pass)
          : currentConfig.smtp_pass,
        backup_smtp_pass: (req.body.backup_smtp_pass && req.body.backup_smtp_pass.trim() && req.body.backup_smtp_pass !== '********')
          ? normalizeSmtpPass(req.body.backup_smtp_pass)
          : currentConfig.backup_smtp_pass
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
