# Миграция на Neon Postgres и простая авторизация

## Изменения

### 1. База данных
- Все данные теперь хранятся в Supabase Postgres вместо JSON файлов
- Схема БД находится в `db/schema.sql`
- Подключение к БД через переменную окружения `DATABASE_URL` (или `SUPABASE_DB_URL`)

### 2. Авторизация
- Убрана авторизация через GitHub OAuth
- Добавлена авторизация через логин/пароль из базы данных
- Поддержка нескольких администраторов
- Администраторы хранятся в таблице `admin_users` в БД
- Пароли хешируются с помощью bcrypt
- API для управления администраторами (`/api/admin-users/*`)

### 3. API Endpoints
Все API endpoints теперь работают с базой данных:
- `/api/config/get` - получить все конфиги
- `/api/config/update` - добавить/обновить/удалить конфиг
- `/api/macro/get` - получить все макросы
- `/api/macro/update` - добавить/обновить/удалить макрос
- `/api/addon/get` - получить все аддоны
- `/api/addon/update` - добавить/обновить/удалить аддон
- `/api/guide/get` - получить все гайды
- `/api/guide/update` - добавить/обновить/удалить гайд
- `/api/top-donors/get` - получить топ донатеров
- `/api/top-donors/update` - обновить топ донатеров
- `/api/auth/login` - авторизация через логин/пароль
- `/api/admin-users/get` - получить список администраторов
- `/api/admin-users/create` - создать нового администратора
- `/api/admin-users/update` - обновить администратора
- `/api/admin-users/delete` - удалить администратора

Все endpoints для обновления требуют авторизации через Bearer токен в заголовке `Authorization`.

### 4. Переменные окружения Vercel

**Если Supabase интегрирован через Vercel Dashboard:**
✅ Переменные для подключения к БД создаются автоматически!
- `STORAGE_POSTGRES_URL_NON_POOLING` - используется для подключения

**Создание администраторов:**

Администраторы хранятся в таблице `admin_users` в БД. Для создания первого администратора используйте скрипт:

```bash
node scripts/create-first-admin.js
```

После этого вы сможете создавать других администраторов через админ-панель или SQL запросы.

**Если интеграция не выполнена автоматически:**
1. В Supabase Dashboard перейдите в Settings → Database
2. Найдите "Connection string" → "URI"
3. Скопируйте connection string и добавьте как `DATABASE_URL` в Vercel

### 5. Миграция данных

Для переноса данных из JSON файлов в БД нужно:

1. Подключиться к Supabase Postgres (через Supabase Dashboard → SQL Editor)
2. Выполнить SQL схему из `db/schema.sql`
3. Импортировать данные из JSON файлов в соответствующие таблицы

Пример скрипта для импорта (можно создать отдельный файл `scripts/migrate.js`):

```javascript
import { query } from '../lib/db.js';
import fs from 'fs';

// Импорт конфигов
const configsData = JSON.parse(fs.readFileSync('configs/configs.json', 'utf8'));
for (const config of configsData.configs) {
  await query(
    `INSERT INTO configs (id, name, description, class, addon, role, config, screenshot, author, created)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (id) DO NOTHING`,
    [config.id, config.name, config.description, config.class, config.addon, config.role || null, config.config, config.screenshot || null, config.author, config.created]
  );
}

// Аналогично для macros, addons, guides, top_donors
```

### 6. Удаленные зависимости

- `@octokit/rest` - больше не используется

### 7. Новые зависимости

- `pg` - для работы с Postgres

## Важные замечания

1. Старые JSON файлы можно оставить для резервного копирования, но они больше не используются для обновления данных
2. Все обновления теперь происходят в реальном времени через БД
3. Авторизация через логин/пароль проще, но менее безопасна чем OAuth. Рекомендуется использовать сильный пароль и HTTPS
