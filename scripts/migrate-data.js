// Скрипт для миграции данных из JSON файлов в Supabase Postgres БД
// Запуск: node scripts/migrate-data.js
// 
// Убедитесь, что переменная окружения установлена:
// Для Supabase (автоматически создается при интеграции с Vercel):
//   STORAGE_POSTGRES_URL_NON_POOLING
// Или вручную:
//   export DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require"

import { query } from '../lib/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateConfigs() {
  console.log('Миграция конфигов...');
  const configsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../configs/configs.json'), 'utf8'));
  
  for (const config of configsData.configs) {
    try {
      await query(
        `INSERT INTO configs (id, name, description, class, addon, role, config, screenshot, author, created, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           class = EXCLUDED.class,
           addon = EXCLUDED.addon,
           role = EXCLUDED.role,
           config = EXCLUDED.config,
           screenshot = EXCLUDED.screenshot,
           author = EXCLUDED.author,
           updated_at = EXCLUDED.updated_at`,
        [
          config.id,
          config.name,
          config.description || null,
          config.class || null,
          config.addon || null,
          config.role || null,
          config.config,
          config.screenshot || null,
          config.author || null,
          config.created || new Date().toISOString(),
          new Date().toISOString()
        ]
      );
    } catch (error) {
      console.error(`Ошибка при миграции конфига ${config.id}:`, error.message);
    }
  }
  console.log(`Мигрировано конфигов: ${configsData.configs.length}`);
}

async function migrateMacros() {
  console.log('Миграция макросов...');
  const macrosData = JSON.parse(fs.readFileSync(path.join(__dirname, '../macros/macros.json'), 'utf8'));
  
  for (const macro of macrosData.macros) {
    try {
      await query(
        `INSERT INTO macros (id, name, description, class, addon, macro, author, created, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           class = EXCLUDED.class,
           addon = EXCLUDED.addon,
           macro = EXCLUDED.macro,
           author = EXCLUDED.author,
           updated_at = EXCLUDED.updated_at`,
        [
          macro.id,
          macro.name,
          macro.description || null,
          macro.class || null,
          macro.addon || 'universal',
          macro.macro,
          macro.author || null,
          macro.created || new Date().toISOString(),
          new Date().toISOString()
        ]
      );
    } catch (error) {
      console.error(`Ошибка при миграции макроса ${macro.id}:`, error.message);
    }
  }
  console.log(`Мигрировано макросов: ${macrosData.macros.length}`);
}

async function migrateAddons() {
  console.log('Миграция аддонов...');
  const addonsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../addons/addons.json'), 'utf8'));
  
  for (const addon of addonsData.addons) {
    try {
      await query(
        `INSERT INTO addons (id, name, version, description, features, download_url, author, created, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           version = EXCLUDED.version,
           description = EXCLUDED.description,
           features = EXCLUDED.features,
           download_url = EXCLUDED.download_url,
           author = EXCLUDED.author,
           updated_at = EXCLUDED.updated_at`,
        [
          addon.id,
          addon.name,
          addon.version || null,
          addon.description || null,
          Array.isArray(addon.features) ? addon.features : [],
          addon.downloadUrl || null,
          addon.author || null,
          addon.created || new Date().toISOString(),
          new Date().toISOString()
        ]
      );
    } catch (error) {
      console.error(`Ошибка при миграции аддона ${addon.id}:`, error.message);
    }
  }
  console.log(`Мигрировано аддонов: ${addonsData.addons.length}`);
}

async function migrateGuides() {
  console.log('Миграция гайдов...');
  const guidesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../guides/guides.json'), 'utf8'));
  
  for (const guide of guidesData.guides) {
    try {
      await query(
        `INSERT INTO guides (id, title, description, youtube_url, author, created, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           youtube_url = EXCLUDED.youtube_url,
           author = EXCLUDED.author,
           updated_at = EXCLUDED.updated_at`,
        [
          guide.id,
          guide.title,
          guide.description || null,
          guide.youtubeUrl || null,
          guide.author || null,
          guide.created || new Date().toISOString(),
          new Date().toISOString()
        ]
      );
    } catch (error) {
      console.error(`Ошибка при миграции гайда ${guide.id}:`, error.message);
    }
  }
  console.log(`Мигрировано гайдов: ${guidesData.guides.length}`);
}

async function migrateTopDonors() {
  console.log('Миграция топ донатеров...');
  const donorsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../top-donors/top-donors.json'), 'utf8'));
  
  // Очищаем таблицу перед миграцией
  await query('DELETE FROM top_donors');
  
  for (const donor of donorsData) {
    try {
      await query(
        `INSERT INTO top_donors (id, name, amount, currency, created, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          Number(donor.id),
          donor.name,
          Number(donor.amount),
          donor.currency || '₽',
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
    } catch (error) {
      console.error(`Ошибка при миграции донатера ${donor.id}:`, error.message);
    }
  }
  console.log(`Мигрировано донатеров: ${donorsData.length}`);
}

async function main() {
  try {
    console.log('Начало миграции данных...');
    
    await migrateConfigs();
    await migrateMacros();
    await migrateAddons();
    await migrateGuides();
    await migrateTopDonors();
    
    console.log('Миграция завершена успешно!');
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при миграции:', error);
    process.exit(1);
  }
}

main();
