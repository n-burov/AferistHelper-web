import { query } from '../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await query('SELECT * FROM macros ORDER BY created DESC');
    
    // Формируем ответ в формате, совместимом со старым JSON
    const macros = {
      meta: {
        version: "1.0.0",
        lastUpdated: new Date().toISOString(),
        totalMacros: result.rows.length,
        schemaVersion: "1.0"
      },
      macros: result.rows.map(row => ({
        ...row,
        macro: row.macro // сохраняем поле macro для совместимости
      }))
    };

    res.json(macros);
  } catch (error) {
    console.error('Get macros error:', error);
    res.status(500).json({ error: 'Failed to get macros' });
  }
}
