const { getDatabase } = require('../config/database');

const USER_SELECT = `
  SELECT u.id, u.first_name, u.last_name, u.email, u.password_hash, u.birth_date,
         u.phone, u.address, u.department_id, u.position, u.hire_date, u.is_active,
         u.created_at, u.updated_at, r.name AS role,
         d.name AS department_name
  FROM users u
  JOIN roles r ON r.id = u.role_id
  LEFT JOIN departments d ON d.id = u.department_id
`;

function mapUser(row, includePassword = false) {
  if (!row) return null;
  const user = {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: `${row.first_name} ${row.last_name}`,
    email: row.email,
    birthDate: row.birth_date,
    phone: row.phone,
    address: row.address,
    department: row.department_id ? { id: row.department_id, name: row.department_name } : null,
    position: row.position,
    role: row.role,
    hireDate: row.hire_date,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (includePassword) user.passwordHash = row.password_hash;
  return user;
}

function findByEmail(email) {
  return mapUser(getDatabase().prepare(`${USER_SELECT} WHERE u.email = ?`).get(email), true);
}

function findById(id, includePassword = false) {
  return mapUser(getDatabase().prepare(`${USER_SELECT} WHERE u.id = ?`).get(id), includePassword);
}

function list({ requester, search, departmentId, role, active } = {}) {
  const conditions = [];
  const params = [];
  if (requester?.role === 'MANAGER') {
    conditions.push('u.department_id = ?', "r.name = 'PERSONNEL'");
    params.push(requester.department?.id || -1);
  } else if (requester?.role === 'PERSONNEL') {
    conditions.push('u.id = ?');
    params.push(requester.id);
  }
  if (search) {
    conditions.push("(u.first_name || ' ' || u.last_name LIKE ? OR u.email LIKE ? OR u.position LIKE ?)");
    const value = `%${search}%`;
    params.push(value, value, value);
  }
  if (departmentId) {
    conditions.push('u.department_id = ?');
    params.push(departmentId);
  }
  if (role) {
    conditions.push('r.name = ?');
    params.push(role);
  }
  if (active !== undefined) {
    conditions.push('u.is_active = ?');
    params.push(active ? 1 : 0);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return getDatabase().prepare(`${USER_SELECT} ${where} ORDER BY u.first_name, u.last_name`)
    .all(...params).map((row) => mapUser(row));
}

function create(data) {
  const db = getDatabase();
  const roleId = db.prepare('SELECT id FROM roles WHERE name = ?').get(data.role).id;
  const result = db.prepare(`
    INSERT INTO users
      (first_name, last_name, email, password_hash, birth_date, phone, address,
       department_id, position, role_id, hire_date)
    VALUES
      (@firstName, @lastName, @email, @passwordHash, @birthDate, @phone, @address,
       @departmentId, @position, @roleId, @hireDate)
  `).run({ ...data, roleId });
  return findById(result.lastInsertRowid);
}

function update(id, data) {
  const db = getDatabase();
  const roleId = db.prepare('SELECT id FROM roles WHERE name = ?').get(data.role).id;
  db.transaction(() => {
    db.prepare(`
      UPDATE users SET first_name = @firstName, last_name = @lastName, email = @email,
        birth_date = @birthDate, phone = @phone, address = @address,
        department_id = @departmentId, position = @position, role_id = @roleId,
        hire_date = @hireDate, updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `).run({ ...data, roleId, id });
    if (data.role !== 'MANAGER') {
      db.prepare('UPDATE departments SET manager_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE manager_id = ?').run(id);
    }
  })();
  return findById(id);
}

function updateProfile(id, data) {
  getDatabase().prepare(`
    UPDATE users SET phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(data.phone, data.address, id);
  return findById(id);
}

function setActive(id, isActive) {
  const db = getDatabase();
  db.transaction(() => {
    db.prepare('UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(isActive ? 1 : 0, id);
    if (!isActive) {
      db.prepare('UPDATE departments SET manager_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE manager_id = ?').run(id);
    }
  })();
  return findById(id);
}

function setPassword(id, passwordHash) {
  getDatabase().prepare(
    'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(passwordHash, id);
}

module.exports = { findByEmail, findById, list, create, update, updateProfile, setActive, setPassword };
