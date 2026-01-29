// Скрипт для создания первого администратора
// Запуск: node scripts/create-first-admin.js
// 
// Убедитесь, что переменная окружения установлена:
// export STORAGE_POSTGRES_URL_NON_POOLING="..."

import { query } from '../lib/db.js';
import { hashPassword } from '../lib/password.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createFirstAdmin() {
  try {
    console.log('=== Создание первого администратора ===\n');

    const username = await question('Введите логин: ');
    if (!username || username.trim().length === 0) {
      console.error('Логин не может быть пустым');
      process.exit(1);
    }

    const password = await question('Введите пароль (минимум 6 символов): ');
    if (!password || password.length < 6) {
      console.error('Пароль должен содержать минимум 6 символов');
      process.exit(1);
    }

    const confirmPassword = await question('Подтвердите пароль: ');
    if (password !== confirmPassword) {
      console.error('Пароли не совпадают');
      process.exit(1);
    }

    const email = await question('Введите email (необязательно): ');
    const fullName = await question('Введите полное имя (необязательно): ');

    // Проверяем, существует ли пользователь
    const existingUser = await query(
      'SELECT id FROM admin_users WHERE username = $1',
      [username.trim()]
    );

    if (existingUser.rows.length > 0) {
      console.error('Пользователь с таким логином уже существует');
      process.exit(1);
    }

    // Хешируем пароль
    const passwordHash = await hashPassword(password);

    // Создаем пользователя
    const result = await query(
      `INSERT INTO admin_users (username, password_hash, email, full_name, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, username, email, full_name, created_at`,
      [
        username.trim(),
        passwordHash,
        email.trim() || null,
        fullName.trim() || null
      ]
    );

    console.log('\n✅ Администратор успешно создан!');
    console.log('ID:', result.rows[0].id);
    console.log('Логин:', result.rows[0].username);
    console.log('Email:', result.rows[0].email || '(не указан)');
    console.log('Имя:', result.rows[0].full_name || '(не указано)');
    console.log('Создан:', result.rows[0].created_at);

    process.exit(0);
  } catch (error) {
    console.error('Ошибка при создании администратора:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

createFirstAdmin();
