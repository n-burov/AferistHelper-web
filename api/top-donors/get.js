import { query } from '../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await query('SELECT * FROM top_donors ORDER BY amount DESC');
    
    // Возвращаем массив донатеров в формате, совместимом со старым JSON
    const donors = result.rows.map(row => ({
      id: Number(row.id),
      name: row.name,
      amount: Number(row.amount),
      currency: row.currency || '₽'
    }));

    res.json(donors);
  } catch (error) {
    console.error('Get top donors error:', error);
    res.status(500).json({ error: 'Failed to get top donors' });
  }
}
