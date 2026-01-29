import { query } from '../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await query('SELECT * FROM addons ORDER BY created DESC');
    
    // Формируем ответ в формате, совместимом со старым JSON
    const addons = {
      meta: {
        version: "1.0.0",
        lastUpdated: new Date().toISOString(),
        totalAddons: result.rows.length,
        schemaVersion: "1.0"
      },
      addons: result.rows.map(row => ({
        ...row,
        downloadUrl: row.download_url // преобразуем для совместимости
      }))
    };

    res.json(addons);
  } catch (error) {
    console.error('Get addons error:', error);
    res.status(500).json({ error: 'Failed to get addons' });
  }
}
