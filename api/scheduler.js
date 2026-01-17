export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    // GET /api/scheduler?action=status or GET /api/scheduler
    if (req.method === 'GET') {
      return res.status(200).json({
        running: true,
        message: 'Scheduler runs automatically via Vercel Cron at 8:00 AM daily'
      });
    }

    // POST /api/scheduler?action=start
    if (req.method === 'POST' && action === 'start') {
      return res.status(200).json({
        running: true,
        message: 'Scheduler is automatically managed by Vercel Cron. It runs daily at 8:00 AM.'
      });
    }

    // POST /api/scheduler?action=stop
    if (req.method === 'POST' && action === 'stop') {
      return res.status(200).json({
        running: true,
        message: 'Scheduler is automatically managed by Vercel Cron. To disable, remove the cron configuration from vercel.json.'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Scheduler API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
