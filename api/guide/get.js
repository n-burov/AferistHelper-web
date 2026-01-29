import { query } from '../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await query('SELECT * FROM guides ORDER BY created DESC');
    
    // Формируем ответ в формате, совместимом со старым JSON
    const guides = {
      meta: {
        version: "1.0.0",
        lastUpdated: new Date().toISOString(),
        totalGuides: result.rows.length,
        schemaVersion: "1.0"
      },
      guides: result.rows.map(row => ({
        ...row,
        youtubeUrl: row.youtube_url // преобразуем для совместимости
      }))
    };

    res.json(guides);
  } catch (error) {
    console.error('Get guides error:', error);
    res.status(500).json({ error: 'Failed to get guides' });
  }
}
