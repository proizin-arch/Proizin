const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { seedDatabase } = require('../database/seed');

let database;

function resolveDatabasePath(customPath) {
  const selected = customPath || process.env.DB_PATH || path.join(__dirname, '..', 'database', 'izinpro.db');
  return path.isAbsolute(selected) ? selected : path.resolve(process.cwd(), selected);
}

function initDatabase(customPath) {
  if (database) {
    database.close();
  }

  const databasePath = resolveDatabasePath(customPath);
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  database = new Database(databasePath);
  database.pragma('foreign_keys = ON');
  database.pragma('journal_mode = WAL');
  database.pragma('busy_timeout = 5000');

  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  database.exec(fs.readFileSync(schemaPath, 'utf8'));
  seedDatabase(database);

  return { database, databasePath };
}

function getDatabase() {
  if (!database) {
    throw new Error('Veritabanı henüz başlatılmadı.');
  }
  return database;
}

function closeDatabase() {
  if (database) {
    database.close();
    database = undefined;
  }
}

module.exports = { initDatabase, getDatabase, closeDatabase, resolveDatabasePath };
