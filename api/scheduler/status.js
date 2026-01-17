export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // On Vercel, the scheduler is handled by Vercel Cron, so it's always "running"
      return res.status(200).json({
        running: true,
        message: 'Scheduler runs automatically via Vercel Cron at 8:00 AM daily'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Scheduler status API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
