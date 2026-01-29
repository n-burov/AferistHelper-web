import { query } from '../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await query('SELECT * FROM configs ORDER BY created DESC');
    
    // Формируем ответ в формате, совместимом со старым JSON
    const configs = {
      meta: {
        version: "1.0.0",
        lastUpdated: new Date().toISOString(),
        totalConfigs: result.rows.length,
        schemaVersion: "1.0"
      },
      configs: result.rows
    };

    res.json(configs);
  } catch (error) {
    console.error('Get configs error:', error);
    res.status(500).json({ error: 'Failed to get configs' });
  }
}
