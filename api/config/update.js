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

  const { action, configData } = req.body;
  if (!action || !configData) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    switch (action) {
      case 'add':
        await query(
          `INSERT INTO configs (id, name, description, class, addon, role, config, screenshot, author, created, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            configData.id,
            configData.name,
            configData.description,
            configData.class,
            configData.addon,
            configData.role || null,
            configData.config,
            configData.screenshot || null,
            configData.author,
            configData.created || new Date().toISOString(),
            new Date().toISOString()
          ]
        );
        break;

      case 'update':
        await query(
          `UPDATE configs 
           SET name = $2, description = $3, class = $4, addon = $5, role = $6, 
               config = $7, screenshot = $8, author = $9, updated_at = $10
           WHERE id = $1`,
          [
            configData.id,
            configData.name,
            configData.description,
            configData.class,
            configData.addon,
            configData.role || null,
            configData.config,
            configData.screenshot || null,
            configData.author,
            new Date().toISOString()
          ]
        );
        break;

      case 'delete':
        await query('DELETE FROM configs WHERE id = $1', [configData.id]);
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.json({ success: true, message: 'Config updated successfully' });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Failed to update config: ' + error.message });
  }
}
