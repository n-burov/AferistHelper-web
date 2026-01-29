// Создать нового администратора
import { query } from '../../../lib/db.js';
import { verifyAuth } from '../../../lib/auth.js';
import { hashPassword } from '../../../lib/password.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Проверка авторизации
  const auth = verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { username, password, email, fullName } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Проверка минимальной длины пароля
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    // Проверяем, существует ли пользователь
    const existingUser = await query(
      'SELECT id FROM admin_users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Хешируем пароль
    const passwordHash = await hashPassword(password);

    // Создаем пользователя
    const result = await query(
      `INSERT INTO admin_users (username, password_hash, email, full_name, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, username, email, full_name, is_active, created_at`,
      [username, passwordHash, email || null, fullName || null]
    );

    res.json({
      success: true,
      message: 'Admin user created successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Create admin user error:', error);
    res.status(500).json({ error: 'Failed to create admin user: ' + error.message });
  }
}
