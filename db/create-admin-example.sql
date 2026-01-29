-- Пример SQL запроса для создания администратора вручную
-- ВАЖНО: Замените 'your_password' на реальный пароль перед выполнением
-- Пароль будет автоматически захеширован при использовании через API

-- Для создания через SQL нужно сначала захешировать пароль
-- Используйте скрипт create-first-admin.js или API endpoint /api/admin-users/create

-- Пример (пароль уже должен быть захеширован):
-- INSERT INTO admin_users (username, password_hash, email, full_name, is_active)
-- VALUES (
--   'admin',
--   '$2a$10$YourHashedPasswordHere', -- Используйте bcrypt hash
--   'admin@example.com',
--   'Администратор',
--   TRUE
-- );

-- Рекомендуется использовать скрипт create-first-admin.js для создания первого администратора
