// TEMPORARY read-only diagnostic endpoint.
// Lists every scheduled invoice with the firm details and the computed
// per-user-per-month rate, so we can find scheduled invoices that exceed
// the pricing cap. Intended to run only on an SSO-protected preview
// deployment and to be removed once the audit is done.
import { neon } from '@neondatabase/serverless';
import { calculateAmounts, parseDurationMonths } from './lib/invoice.js';

const sql = neon(process.env.DATABASE_URL);

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const scheduled = await sql`
      SELECT s.id, s.firm_id, s.schedule_date, s.plan_type, s.duration,
             s.num_users, s.base_amount, s.status, s.created_at,
             f.firm_name, f.home_country, f.plan_type AS firm_plan_type,
             f.plan_duration AS firm_plan_duration, f.num_users AS firm_num_users,
             f.normal_price, f.base_price, f.subscription_end
      FROM scheduled_invoices s
      LEFT JOIN law_firms f ON s.firm_id = f.id
      ORDER BY s.schedule_date ASC
    `;

    let plan_prices = [];
    let addon_prices = [];
    try { plan_prices = await sql`SELECT country, plan_type, duration_months, currency, price_per_user FROM plan_prices ORDER BY country, plan_type, duration_months`; } catch (e) {}
    try { addon_prices = await sql`SELECT country, currency, price_per_user_per_month FROM addon_prices ORDER BY country`; } catch (e) {}

    const rows = scheduled.map((s) => {
      const country = (s.home_country || 'ghana').toLowerCase();
      const currency = country === 'nigeria' ? 'NGN' : 'GHS';
      const months = parseDurationMonths(s.duration);
      const users = Math.max(1, parseInt(s.num_users) || 1);
      const amounts = calculateAmounts(s.base_amount, s.num_users, s.duration, country);
      return {
        id: s.id,
        status: s.status,
        schedule_date: s.schedule_date,
        firm_name: s.firm_name,
        country,
        currency,
        plan_type: s.plan_type,
        duration: s.duration,
        months,
        num_users: users,
        base_amount_per_user_per_month: round2(s.base_amount),
        firm_normal_price: s.normal_price == null ? null : round2(s.normal_price),
        subtotal: amounts.subtotal,
        total: amounts.total,
      };
    });

    return res.status(200).json({ count: rows.length, rows, plan_prices, addon_prices });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
