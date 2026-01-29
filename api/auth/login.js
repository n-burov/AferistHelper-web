// Авторизация через логин/пароль из БД
import { query } from '../../lib/db.js';
import { comparePassword } from '../../lib/password.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    // Ищем пользователя в БД
    const result = await query(
      'SELECT id, username, password_hash, email, full_name, is_active FROM admin_users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Проверяем, активен ли пользователь
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is disabled' });
    }

    // Проверяем пароль
    const passwordMatch = await comparePassword(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Обновляем время последнего входа
    await query(
      'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Генерируем токен сессии
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 3600000; // 1 час

    res.json({
      success: true,
      token: sessionToken,
      expiresAt,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
