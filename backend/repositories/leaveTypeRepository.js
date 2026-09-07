const { getDatabase } = require('../config/database');

function map(row) {
  if (!row) return null;
  return {
    id: row.id, name: row.name, code: row.code, color: row.color,
    isActive: Boolean(row.is_active), createdAt: row.created_at, updatedAt: row.updated_at
  };
}

async function list(activeOnly = false) {
  const where = activeOnly ? 'WHERE is_active = 1' : '';
  return (await getDatabase().prepare(`SELECT * FROM leave_types ${where} ORDER BY name`).all()).map(map);
}

async function findById(id) {
  return map(await getDatabase().prepare('SELECT * FROM leave_types WHERE id = ?').get(id));
}

async function findByCode(code) {
  return map(await getDatabase().prepare('SELECT * FROM leave_types WHERE code = ? COLLATE NOCASE').get(code));
}

async function findByName(name) {
  return map(await getDatabase().prepare('SELECT * FROM leave_types WHERE name = ? COLLATE NOCASE').get(name));
}

async function create(data) {
  const result = await getDatabase().prepare(
    'INSERT INTO leave_types (name, code, color) VALUES (?, ?, ?)'
  ).run(data.name, data.code, data.color);
  return findById(result.lastInsertRowid);
}

async function update(id, data) {
  await getDatabase().prepare(`
    UPDATE leave_types SET name = ?, code = ?, color = ?, is_active = ?,
      updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(data.name, data.code, data.color, data.isActive ? 1 : 0, id);
  return findById(id);
}

async function usageCount(id) {
  return Number((await getDatabase().prepare('SELECT COUNT(*) AS count FROM leave_requests WHERE leave_type_id = ?').get(id)).count);
}

async function remove(id) {
  await getDatabase().prepare('DELETE FROM leave_types WHERE id = ?').run(id);
}

module.exports = { list, findById, findByCode, findByName, create, update, usageCount, remove };
