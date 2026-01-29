// Удалить администратора
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

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // Проверяем, существует ли пользователь
    const existingUser = await query(
      'SELECT id FROM admin_users WHERE id = $1',
      [userId]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Удаляем пользователя
    await query('DELETE FROM admin_users WHERE id = $1', [userId]);

    res.json({
      success: true,
      message: 'Admin user deleted successfully'
    });
  } catch (error) {
    console.error('Delete admin user error:', error);
    res.status(500).json({ error: 'Failed to delete admin user: ' + error.message });
  }
}
