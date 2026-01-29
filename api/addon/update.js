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

  const { action, addonData } = req.body;
  if (!action || !addonData) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    switch (action) {
      case 'add':
        await query(
          `INSERT INTO addons (id, name, version, description, features, download_url, author, created, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            addonData.id,
            addonData.name,
            addonData.version,
            addonData.description,
            Array.isArray(addonData.features) ? addonData.features : [],
            addonData.downloadUrl || null,
            addonData.author,
            addonData.created || new Date().toISOString(),
            new Date().toISOString()
          ]
        );
        break;

      case 'update':
        await query(
          `UPDATE addons 
           SET name = $2, version = $3, description = $4, features = $5, 
               download_url = $6, author = $7, updated_at = $8
           WHERE id = $1`,
          [
            addonData.id,
            addonData.name,
            addonData.version,
            addonData.description,
            Array.isArray(addonData.features) ? addonData.features : [],
            addonData.downloadUrl || null,
            addonData.author,
            new Date().toISOString()
          ]
        );
        break;

      case 'delete':
        await query('DELETE FROM addons WHERE id = $1', [addonData.id]);
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.json({ success: true, message: 'Addon updated successfully' });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Failed to update addon: ' + error.message });
  }
}
