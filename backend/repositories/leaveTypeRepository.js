const { getDatabase } = require('../config/database');

function map(row) {
  if (!row) return null;
  return {
    id: row.id, name: row.name, code: row.code, color: row.color,
    isActive: Boolean(row.is_active), createdAt: row.created_at, updatedAt: row.updated_at
  };
}

function list(activeOnly = false) {
  const where = activeOnly ? 'WHERE is_active = 1' : '';
  return getDatabase().prepare(`SELECT * FROM leave_types ${where} ORDER BY name`).all().map(map);
}

function findById(id) {
  return map(getDatabase().prepare('SELECT * FROM leave_types WHERE id = ?').get(id));
}

function findByCode(code) {
  return map(getDatabase().prepare('SELECT * FROM leave_types WHERE code = ? COLLATE NOCASE').get(code));
}

function create(data) {
  const result = getDatabase().prepare(
    'INSERT INTO leave_types (name, code, color) VALUES (?, ?, ?)'
  ).run(data.name, data.code, data.color);
  return findById(result.lastInsertRowid);
}

function update(id, data) {
  getDatabase().prepare(`
    UPDATE leave_types SET name = ?, code = ?, color = ?, is_active = ?,
      updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(data.name, data.code, data.color, data.isActive ? 1 : 0, id);
  return findById(id);
}

module.exports = { list, findById, findByCode, create, update };
