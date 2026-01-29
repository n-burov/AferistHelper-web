// Обновить администратора
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

  const { userId, username, password, email, fullName, isActive } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // Проверяем, существует ли пользователь
    const existingUser = await query(
      'SELECT id, username FROM admin_users WHERE id = $1',
      [userId]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Если меняется username, проверяем уникальность
    if (username && username !== existingUser.rows[0].username) {
      const duplicateCheck = await query(
        'SELECT id FROM admin_users WHERE username = $1 AND id != $2',
        [username, userId]
      );

      if (duplicateCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Username already exists' });
      }
    }

    // Формируем запрос обновления
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (username) {
      updates.push(`username = $${paramIndex++}`);
      values.push(username);
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }
      const passwordHash = await hashPassword(password);
      updates.push(`password_hash = $${paramIndex++}`);
      values.push(passwordHash);
    }

    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email || null);
    }

    if (fullName !== undefined) {
      updates.push(`full_name = $${paramIndex++}`);
      values.push(fullName || null);
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(isActive);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const updateQuery = `
      UPDATE admin_users 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, username, email, full_name, is_active, updated_at
    `;

    const result = await query(updateQuery, values);

    res.json({
      success: true,
      message: 'Admin user updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update admin user error:', error);
    res.status(500).json({ error: 'Failed to update admin user: ' + error.message });
  }
}
