# Инструкция по настройке после миграции

## Шаги для завершения миграции

### 1. Подключение Supabase к Vercel

Если вы интегрировали Supabase через Vercel Dashboard, все необходимые переменные окружения создаются автоматически! ✅

**Проверьте наличие переменных:**
- `STORAGE_POSTGRES_URL_NON_POOLING` - используется для подключения к БД
- Остальные переменные Supabase создаются автоматически

**Создание первого администратора:**

После создания таблиц в БД, создайте первого администратора:

1. Установите зависимости:
   ```bash
   npm install
   ```

2. Установите переменную окружения:
   ```bash
   export STORAGE_POSTGRES_URL_NON_POOLING="postgres://postgres.tczqotyfljxlyzgeuufa:[PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require"
   ```

3. Запустите скрипт создания первого администратора:
   ```bash
   node scripts/create-first-admin.js
   ```

4. Следуйте инструкциям скрипта для ввода данных

**Примечание:** После создания первого администратора, вы сможете создавать других через админ-панель (если добавите соответствующий интерфейс) или через SQL запросы.

**Если переменные Supabase не созданы автоматически:**
1. В Supabase Dashboard перейдите в Settings → Database
2. Найдите раздел "Connection string" → "URI"
3. Скопируйте connection string и добавьте как `DATABASE_URL` в Vercel

### 2. Создание таблиц в БД

Выполните SQL схему из файла `db/schema.sql` в вашей Supabase БД:

1. Откройте Supabase Dashboard
2. Перейдите в SQL Editor
3. Скопируйте содержимое `db/schema.sql`
4. Выполните SQL запрос (нажмите Run)

### 3. Миграция данных из JSON файлов

**Вариант 1: Использовать скрипт миграции**

1. Установите зависимости:
```bash
npm install
```

2. Убедитесь, что переменная окружения установлена локально:

**Если используете Supabase интеграцию:**
```bash
# Для Windows PowerShell
$env:STORAGE_POSTGRES_URL_NON_POOLING="postgres://postgres.tczqotyfljxlyzgeuufa:[PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require"

# Для Linux/Mac
export STORAGE_POSTGRES_URL_NON_POOLING="postgres://postgres.tczqotyfljxlyzgeuufa:[PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

**Или создайте файл `.env` в корне проекта:**
```
STORAGE_POSTGRES_URL_NON_POOLING=postgres://postgres.tczqotyfljxlyzgeuufa:[PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require
```

**Примечание:** Замените `[PASSWORD]` на ваш пароль из Supabase Dashboard → Settings → Database

3. Запустите скрипт миграции:
```bash
node scripts/migrate-data.js
```

**Вариант 2: Ручной импорт**

Импортируйте данные вручную через SQL или используя инструменты Neon.

### 4. Проверка работы

1. Откройте админ-панель: `https://your-domain.vercel.app/admin.html`
2. Войдите используя логин и пароль из переменных окружения
3. Проверьте, что данные загружаются и можно их редактировать

### 5. Обновление фронтенда (опционально)

Если вы хотите, чтобы фронтенд также использовал данные из БД вместо JSON файлов, нужно обновить следующие файлы:

- `js/app.js` - заменить загрузку из GitHub на `/api/config/get`
- `js/macros.js` - заменить на `/api/macro/get`
- `js/addons.js` - заменить на `/api/addon/get`
- `js/guides.js` - заменить на `/api/guide/get`
- `js/top-donors.js` - заменить на `/api/top-donors/get`

**Примечание:** Если вы хотите оставить JSON файлы для чтения на фронтенде (для кеширования), это тоже нормально. Главное, что обновление данных теперь происходит через БД.

## Структура проекта

```
├── api/
│   ├── auth/
│   │   └── login.js          # Авторизация через логин/пароль
│   ├── config/
│   │   ├── get.js            # Получить все конфиги
│   │   └── update.js         # Обновить конфиг
│   ├── macro/
│   │   ├── get.js
│   │   └── update.js
│   ├── addon/
│   │   ├── get.js
│   │   └── update.js
│   ├── guide/
│   │   ├── get.js
│   │   └── update.js
│   └── top-donors/
│       ├── get.js
│       └── update.js
├── lib/
│   ├── db.js                 # Подключение к Postgres
│   └── auth.js               # Проверка авторизации
├── db/
│   └── schema.sql            # SQL схема БД
└── scripts/
    └── migrate-data.js       # Скрипт миграции данных
```

## Безопасность

- Токены авторизации хранятся в localStorage (действуют 1 час)
- Для production рекомендуется:
  - Использовать JWT токены с подписью
  - Хранить сессии в БД или Redis
  - Добавить rate limiting для API endpoints
  - Использовать HTTPS (Vercel делает это автоматически)

## Откат изменений

Если нужно вернуться к старой системе:

1. Восстановите старые API endpoints из git истории
2. Удалите новые файлы БД
3. Восстановите `package.json` с `@octokit/rest`
4. Обновите `admin.js` и `admin.html` на старые версии
