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

  const { action, guideData, guideId } = req.body;
  if (!action) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  if ((action === 'add' || action === 'update') && !guideData) {
    return res.status(400).json({ error: 'Missing guideData for add/update' });
  }

  if (action === 'delete' && !guideId) {
    return res.status(400).json({ error: 'Missing guideId for delete' });
  }

  try {
    switch (action) {
      case 'add':
        await query(
          `INSERT INTO guides (id, title, description, youtube_url, author, created, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            guideData.id,
            guideData.title,
            guideData.description,
            guideData.youtubeUrl,
            guideData.author,
            guideData.created || new Date().toISOString(),
            new Date().toISOString()
          ]
        );
        break;

      case 'update':
        await query(
          `UPDATE guides 
           SET title = $2, description = $3, youtube_url = $4, author = $5, updated_at = $6
           WHERE id = $1`,
          [
            guideData.id,
            guideData.title,
            guideData.description,
            guideData.youtubeUrl,
            guideData.author,
            new Date().toISOString()
          ]
        );
        break;

      case 'delete':
        await query('DELETE FROM guides WHERE id = $1', [guideId]);
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.json({ success: true, message: 'Guide updated successfully' });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Failed to update guide: ' + error.message });
  }
}
