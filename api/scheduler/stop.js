export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      // On Vercel, the scheduler is managed by Vercel Cron and cannot be manually started/stopped
      return res.status(200).json({
        running: true,
        message: 'Scheduler is automatically managed by Vercel Cron. To disable, remove the cron configuration from vercel.json.'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Scheduler stop API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
