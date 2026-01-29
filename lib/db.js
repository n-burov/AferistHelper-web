// Утилита для подключения к Supabase Postgres
import { Pool } from 'pg';

let pool = null;

export function getPool() {
  if (!pool) {
    // Supabase автоматически создает переменные окружения при интеграции с Vercel
    // Используем STORAGE_POSTGRES_URL_NON_POOLING для прямого подключения (без pgbouncer)
    // Это важно для транзакций и некоторых SQL операций
    const connectionString = 
      process.env.STORAGE_POSTGRES_URL_NON_POOLING || 
      process.env.DATABASE_URL || 
      process.env.SUPABASE_DB_URL;
    
    if (!connectionString) {
      throw new Error('STORAGE_POSTGRES_URL_NON_POOLING, DATABASE_URL or SUPABASE_DB_URL environment variable is not set');
    }

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      // Настройки для Supabase
      max: 20, // максимальное количество клиентов в пуле
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Обработка ошибок подключения
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  return pool;
}

export async function query(text, params) {
  const pool = getPool();
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error', { text, error });
    throw error;
  }
}
