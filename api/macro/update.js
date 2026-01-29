import { query } from '../../../lib/db.js';
import { verifyAuth } from '../../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Проверка авторизации
  const auth = verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { action, macroData } = req.body;
  if (!action || !macroData) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    switch (action) {
      case 'add':
        await query(
          `INSERT INTO macros (id, name, description, class, addon, macro, author, created, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            macroData.id,
            macroData.name,
            macroData.description,
            macroData.class,
            macroData.addon || 'universal',
            macroData.macro || macroData.content,
            macroData.author,
            macroData.created || new Date().toISOString(),
            new Date().toISOString()
          ]
        );
        break;

      case 'update':
        await query(
          `UPDATE macros 
           SET name = $2, description = $3, class = $4, addon = $5, 
               macro = $6, author = $7, updated_at = $8
           WHERE id = $1`,
          [
            macroData.id,
            macroData.name,
            macroData.description,
            macroData.class,
            macroData.addon || 'universal',
            macroData.macro || macroData.content,
            macroData.author,
            new Date().toISOString()
          ]
        );
        break;

      case 'delete':
        await query('DELETE FROM macros WHERE id = $1', [macroData.id]);
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.json({ success: true, message: 'Macro updated successfully' });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Failed to update macro: ' + error.message });
  }
}
