# Управление администраторами

## Система авторизации

Теперь система поддерживает несколько администраторов. Все администраторы хранятся в таблице `admin_users` в базе данных.

## Создание первого администратора

После выполнения SQL схемы (`db/schema.sql`), создайте первого администратора:

```bash
# Установите зависимости
npm install

# Установите переменную окружения
export STORAGE_POSTGRES_URL_NON_POOLING="postgres://postgres.tczqotyfljxlyzgeuufa:[PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require"

# Запустите скрипт
node scripts/create-first-admin.js
```

Скрипт попросит ввести:
- Логин (уникальный)
- Пароль (минимум 6 символов)
- Email (необязательно)
- Полное имя (необязательно)

## API для управления администраторами

Все endpoints требуют авторизации через Bearer токен.

### Получить список администраторов

```
GET /api/admin-users/get
Authorization: Bearer <token>
```

Ответ:
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "full_name": "Администратор",
      "is_active": true,
      "created_at": "2026-01-29T10:00:00Z",
      "updated_at": "2026-01-29T10:00:00Z",
      "last_login": "2026-01-29T12:00:00Z"
    }
  ]
}
```

### Создать нового администратора

```
POST /api/admin-users/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newadmin",
  "password": "securepassword123",
  "email": "newadmin@example.com",
  "fullName": "Новый администратор"
}
```

Ответ:
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "user": {
    "id": 2,
    "username": "newadmin",
    "email": "newadmin@example.com",
    "full_name": "Новый администратор",
    "is_active": true,
    "created_at": "2026-01-29T13:00:00Z"
  }
}
```

### Обновить администратора

```
POST /api/admin-users/update
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": 2,
  "username": "updatedadmin",
  "email": "updated@example.com",
  "fullName": "Обновленное имя",
  "isActive": true
}
```

Можно обновить любое поле:
- `username` - логин
- `password` - пароль (минимум 6 символов)
- `email` - email
- `fullName` - полное имя
- `isActive` - активен ли пользователь (true/false)

### Удалить администратора

```
POST /api/admin-users/delete
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": 2
}
```

## Безопасность

- Пароли хранятся в захешированном виде (bcrypt)
- Минимальная длина пароля: 6 символов
- Логины должны быть уникальными
- Можно деактивировать администратора без удаления (`isActive: false`)
- Время последнего входа отслеживается автоматически

## Структура таблицы admin_users

```sql
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);
```

## Примеры использования

### Создание администратора через SQL (не рекомендуется)

Для создания через SQL нужно сначала захешировать пароль. Лучше использовать API или скрипт `create-first-admin.js`.

### Деактивация администратора

```json
POST /api/admin-users/update
{
  "userId": 2,
  "isActive": false
}
```

### Смена пароля

```json
POST /api/admin-users/update
{
  "userId": 2,
  "password": "новый_пароль_123"
}
```
