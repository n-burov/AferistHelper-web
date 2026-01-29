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

  const { donors } = req.body;
  if (!donors || !Array.isArray(donors)) {
    return res.status(400).json({ error: 'Missing required parameters: donors array' });
  }

  try {
    // Валидация данных
    for (let donor of donors) {
      if (!donor.hasOwnProperty('id') || !donor.hasOwnProperty('name') || !donor.hasOwnProperty('amount')) {
        return res.status(400).json({ error: 'Некорректная структура данных донатера: отсутствуют обязательные поля (id, name, amount)' });
      }
      
      donor.id = Number(donor.id);
      donor.amount = Number(donor.amount);
      
      if (isNaN(donor.id) || isNaN(donor.amount) || !isFinite(donor.id) || !isFinite(donor.amount)) {
        return res.status(400).json({ error: 'Некорректные числовые типы данных донатера' });
      }
      
      if (typeof donor.name !== 'string') {
        return res.status(400).json({ error: 'Поле name должно быть строкой' });
      }
    }

    // Удаляем всех существующих донатеров
    await query('DELETE FROM top_donors');

    // Вставляем новых донатеров
    for (const donor of donors) {
      await query(
        `INSERT INTO top_donors (id, name, amount, currency, created, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           amount = EXCLUDED.amount,
           currency = EXCLUDED.currency,
           updated_at = EXCLUDED.updated_at`,
        [
          donor.id,
          donor.name,
          donor.amount,
          donor.currency || '₽',
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
    }

    res.json({ success: true, message: 'Топ донатеров успешно обновлен' });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Failed to update top donors: ' + error.message });
  }
}
