// Получить список всех администраторов (только для авторизованных админов)
import { query } from '../../../lib/db.js';
import { verifyAuth } from '../../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Проверка авторизации
  const auth = verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await query(
      'SELECT id, username, email, full_name, is_active, created_at, updated_at, last_login FROM admin_users ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ error: 'Failed to get admin users' });
  }
}
