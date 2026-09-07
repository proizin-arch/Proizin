const fs = require('node:fs');
const path = require('node:path');
const { seedSystemDefaults } = require('../database/seed');

let database;
let databaseReady = Promise.resolve();

function useDatabase(databaseInstance, ready = Promise.resolve()) {
  database = databaseInstance;
  databaseReady = ready;
  return { database, databasePath: 'runtime-database', ready: databaseReady };
}

function resolveDatabasePath(customPath) {
  const selected = customPath || process.env.DB_PATH || path.join(__dirname, '..', 'database', 'izinpro.db');
  return path.isAbsolute(selected) ? selected : path.resolve(process.cwd(), selected);
}

function initDatabase(customPath) {
  // Local and Visual Studio usage stores data in SQLite. Cloudflare passes a
  // D1 adapter through useDatabase(), so the native module is not initialized
  // inside the Worker runtime.
  const Database = require('better-sqlite3');
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
  const userColumns = database.pragma('table_info(users)');
  if (!userColumns.some((column) => column.name === 'must_change_password')) {
    database.exec('ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0 CHECK (must_change_password IN (0, 1))');
  }
  if (!userColumns.some((column) => column.name === 'position_id')) {
    database.exec('ALTER TABLE users ADD COLUMN position_id INTEGER REFERENCES positions(id) ON DELETE RESTRICT');
  }
  if (!userColumns.some((column) => column.name === 'temporary_password_secret')) {
    database.exec('ALTER TABLE users ADD COLUMN temporary_password_secret TEXT');
  }
  database.exec('CREATE INDEX IF NOT EXISTS idx_users_position ON users(position_id)');
  const legacyPositions = database.prepare("SELECT DISTINCT TRIM(position) AS name FROM users WHERE TRIM(position) != ''").all();
  const insertPosition = database.prepare('INSERT OR IGNORE INTO positions (name) VALUES (?)');
  legacyPositions.forEach(({ name }) => insertPosition.run(name));
  database.exec(`
    INSERT OR IGNORE INTO positions (name)
    SELECT 'Admin'
    WHERE EXISTS (
      SELECT 1 FROM users
      WHERE position = 'Sistem Yöneticisi' COLLATE NOCASE
        AND role_id = (SELECT id FROM roles WHERE name = 'ADMIN')
    )
  `);
  database.exec(`
    UPDATE users
    SET position_id = (SELECT id FROM positions WHERE positions.name = users.position COLLATE NOCASE)
    WHERE position_id IS NULL
  `);
  database.exec(`
    UPDATE users
    SET position = 'Admin', position_id = (SELECT id FROM positions WHERE name = 'Admin' COLLATE NOCASE)
    WHERE position = 'Sistem Yöneticisi' COLLATE NOCASE
      AND role_id = (SELECT id FROM roles WHERE name = 'ADMIN')
  `);
  seedSystemDefaults(database);
  database.pragma('optimize');

  databaseReady = Promise.resolve();
  return { database, databasePath, ready: databaseReady };
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
    databaseReady = Promise.resolve();
  }
}

function readyDatabase() {
  return databaseReady;
}

module.exports = { initDatabase, useDatabase, getDatabase, closeDatabase, resolveDatabasePath, readyDatabase };
