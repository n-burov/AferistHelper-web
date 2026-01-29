# Настройка Supabase для проекта

## Быстрый старт

### 1. Создание проекта в Supabase

1. Зайдите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Запомните пароль базы данных (он понадобится для connection string)

### 2. Получение Connection String

В Supabase Dashboard:

1. Перейдите в **Settings** → **Database**
2. Найдите раздел **Connection string**
3. Выберите вкладку **URI** (не Connection pooling)
4. Скопируйте connection string, он выглядит примерно так:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### 3. Настройка переменных окружения в Vercel

**Если вы интегрировали Supabase через Vercel Dashboard:**

✅ Все переменные для подключения к БД создаются автоматически!
- `STORAGE_POSTGRES_URL_NON_POOLING` - используется для подключения
- Остальные переменные Supabase также создаются автоматически

**Создание первого администратора:**

После выполнения SQL схемы, создайте первого администратора через скрипт:

1. Установите зависимости:
   ```bash
   npm install
   ```

2. Установите переменную окружения локально:
   ```bash
   export STORAGE_POSTGRES_URL_NON_POOLING="postgres://postgres.tczqotyfljxlyzgeuufa:[PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require"
   ```

3. Запустите скрипт:
   ```bash
   node scripts/create-first-admin.js
   ```

4. Введите данные первого администратора

**Примечание:** После создания первого администратора, вы сможете создавать других через админ-панель или через SQL запросы.

**Если интеграция не была выполнена автоматически:**
1. В Vercel Dashboard → Settings → Integrations
2. Найдите Supabase и подключите его
3. Или вручную добавьте `DATABASE_URL` как описано выше

### 4. Создание таблиц

1. В Supabase Dashboard перейдите в **SQL Editor**
2. Откройте файл `db/schema.sql` из проекта
3. Скопируйте весь SQL код
4. Вставьте в SQL Editor
5. Нажмите **Run** (или F5)

### 5. Миграция данных

**Вариант 1: Через скрипт (рекомендуется)**

1. Установите зависимости:
   ```bash
   npm install
   ```

2. Установите переменную окружения локально:
   ```bash
   # Windows PowerShell
   $env:DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require"
   
   # Linux/Mac
   export DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require"
   ```

3. Запустите миграцию:
   ```bash
   node scripts/migrate-data.js
   ```

**Вариант 2: Через Supabase Dashboard**

1. Откройте SQL Editor в Supabase
2. Используйте INSERT запросы для каждого типа данных
3. Или используйте Table Editor для ручного ввода данных

### 6. Проверка подключения

После настройки проверьте:

1. Откройте админ-панель: `https://your-domain.vercel.app/admin.html`
2. Войдите используя `ADMIN_USERNAME` и `ADMIN_PASSWORD`
3. Проверьте, что данные загружаются из БД

## Troubleshooting

### Ошибка подключения к БД

- Убедитесь, что `DATABASE_URL` правильно скопирован из Supabase
- Проверьте, что пароль в connection string правильный
- Убедитесь, что `?sslmode=require` добавлен в конец connection string

### Ошибка "relation does not exist"

- Убедитесь, что вы выполнили SQL схему из `db/schema.sql`
- Проверьте в Supabase Dashboard → Table Editor, что таблицы созданы

### Ошибка авторизации

- Проверьте, что `ADMIN_USERNAME` и `ADMIN_PASSWORD` установлены в Vercel
- Убедитесь, что переменные окружения применены (может потребоваться передеплой)

## Полезные ссылки

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## Безопасность

⚠️ **Важно:**
- Никогда не коммитьте `DATABASE_URL` в git
- Используйте сильные пароли для `ADMIN_PASSWORD`
- Регулярно обновляйте пароли
- Используйте HTTPS (Vercel делает это автоматически)
