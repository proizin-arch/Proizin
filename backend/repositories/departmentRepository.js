const { getDatabase } = require('../config/database');

const SELECT = `
  SELECT d.id, d.name, d.manager_id, d.is_active, d.created_at, d.updated_at,
         m.first_name || ' ' || m.last_name AS manager_name,
         COUNT(DISTINCT u.id) AS employee_count
  FROM departments d
  LEFT JOIN users m ON m.id = d.manager_id
  LEFT JOIN users u ON u.department_id = d.id AND u.is_active = 1
`;

function map(row) {
  if (!row) return null;
  return {
    id: row.id, name: row.name, managerId: row.manager_id,
    managerName: row.manager_name, employeeCount: row.employee_count,
    isActive: Boolean(row.is_active), createdAt: row.created_at, updatedAt: row.updated_at
  };
}

function list(activeOnly = false) {
  const where = activeOnly ? 'WHERE d.is_active = 1' : '';
  return getDatabase().prepare(`${SELECT} ${where} GROUP BY d.id ORDER BY d.name`).all().map(map);
}

function findById(id) {
  return map(getDatabase().prepare(`${SELECT} WHERE d.id = ? GROUP BY d.id`).get(id));
}

function findByName(name) {
  return getDatabase().prepare('SELECT * FROM departments WHERE name = ? COLLATE NOCASE').get(name);
}

function create({ name, managerId }) {
  const result = getDatabase().prepare(
    'INSERT INTO departments (name, manager_id) VALUES (?, ?)'
  ).run(name, managerId);
  return findById(result.lastInsertRowid);
}

function update(id, { name, managerId }) {
  getDatabase().prepare(`
    UPDATE departments SET name = ?, manager_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(name, managerId, id);
  return findById(id);
}

function setActive(id, active) {
  getDatabase().prepare(`
    UPDATE departments SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(active ? 1 : 0, id);
  return findById(id);
}

module.exports = { list, findById, findByName, create, update, setActive };
