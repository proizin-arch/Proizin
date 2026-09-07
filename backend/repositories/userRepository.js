const { getDatabase } = require('../config/database');

const USER_SELECT = `
  SELECT u.id, u.first_name, u.last_name, u.email, u.password_hash, u.birth_date,
         u.phone, u.address, u.department_id, u.position_id,
         COALESCE(p.name, u.position) AS position, u.hire_date, u.is_active,
         u.must_change_password, u.temporary_password_secret, u.created_at, u.updated_at, r.name AS role,
         d.name AS department_name
  FROM users u
  JOIN roles r ON r.id = u.role_id
  LEFT JOIN departments d ON d.id = u.department_id
  LEFT JOIN positions p ON p.id = u.position_id
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
    positionId: row.position_id,
    position: row.position,
    role: row.role,
    hireDate: row.hire_date,
    mustChangePassword: Boolean(row.must_change_password),
    temporaryPasswordAvailable: Boolean(row.temporary_password_secret),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (includePassword) {
    user.passwordHash = row.password_hash;
    user.temporaryPasswordSecret = row.temporary_password_secret;
  }
  return user;
}

async function findByEmail(email) {
  return mapUser(await getDatabase().prepare(`${USER_SELECT} WHERE u.email = ? COLLATE NOCASE`).get(email), true);
}

async function findById(id, includePassword = false) {
  return mapUser(await getDatabase().prepare(`${USER_SELECT} WHERE u.id = ?`).get(id), includePassword);
}

async function list({ requester, search, departmentId, role, active } = {}) {
  const conditions = [];
  const params = [];
  if (requester?.role === 'MANAGER') {
    conditions.push('u.department_id = ?', 'u.id != ?');
    params.push(requester.department?.id || -1, requester.id);
  } else if (requester?.role === 'PERSONNEL') {
    conditions.push('u.id = ?');
    params.push(requester.id);
  }
  if (search) {
    conditions.push("(u.first_name || ' ' || u.last_name LIKE ? OR u.email LIKE ? OR COALESCE(p.name, u.position) LIKE ?)");
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
  return (await getDatabase().prepare(`${USER_SELECT} ${where} ORDER BY u.first_name, u.last_name`)
    .all(...params)).map((row) => mapUser(row));
}

async function create(data) {
  const db = getDatabase();
  const roleId = (await db.prepare('SELECT id FROM roles WHERE name = ?').get(data.role)).id;
  const result = await db.prepare(`
    INSERT INTO users
      (first_name, last_name, email, password_hash, birth_date, phone, address,
       department_id, position, position_id, role_id, hire_date, must_change_password, temporary_password_secret)
    VALUES
      (@firstName, @lastName, @email, @passwordHash, @birthDate, @phone, @address,
       @departmentId, @position, @positionId, @roleId, @hireDate, @mustChangePassword, @temporaryPasswordSecret)
  `).run({ ...data, roleId, mustChangePassword: data.mustChangePassword ? 1 : 0 });
  return findById(result.lastInsertRowid);
}

async function update(id, data) {
  const db = getDatabase();
  const roleId = (await db.prepare('SELECT id FROM roles WHERE name = ?').get(data.role)).id;
  if (!db.isPostgres) {
    db.transaction(() => {
      db.prepare(`
        UPDATE users SET first_name = @firstName, last_name = @lastName, email = @email,
          birth_date = @birthDate, phone = @phone, address = @address,
          department_id = @departmentId, position = @position, position_id = @positionId, role_id = @roleId,
          hire_date = @hireDate, updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `).run({ ...data, roleId, id });
      if (!['MANAGER', 'ADMIN'].includes(data.role)) {
        db.prepare('UPDATE departments SET manager_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE manager_id = ?').run(id);
      }
    })();
    return findById(id);
  }
  await db.transaction(async () => {
    await db.prepare(`
      UPDATE users SET first_name = @firstName, last_name = @lastName, email = @email,
        birth_date = @birthDate, phone = @phone, address = @address,
        department_id = @departmentId, position = @position, position_id = @positionId, role_id = @roleId,
        hire_date = @hireDate, updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `).run({ ...data, roleId, id });
    if (!['MANAGER', 'ADMIN'].includes(data.role)) {
      await db.prepare('UPDATE departments SET manager_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE manager_id = ?').run(id);
    }
  })();
  return findById(id);
}

async function updateProfile(id, data) {
  await getDatabase().prepare(`
    UPDATE users SET first_name = ?, last_name = ?, phone = ?, address = ?,
      updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(data.firstName, data.lastName, data.phone, data.address, id);
  return findById(id);
}

async function setActive(id, isActive) {
  const db = getDatabase();
  if (!db.isPostgres) {
    db.transaction(() => {
      db.prepare('UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(isActive ? 1 : 0, id);
      if (!isActive) {
        db.prepare('UPDATE departments SET manager_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE manager_id = ?').run(id);
      }
    })();
    return findById(id);
  }
  await db.transaction(async () => {
    await db.prepare('UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(isActive ? 1 : 0, id);
    if (!isActive) {
      await db.prepare('UPDATE departments SET manager_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE manager_id = ?').run(id);
    }
  })();
  return findById(id);
}

async function setPassword(id, passwordHash, mustChangePassword = false, temporaryPasswordSecret = null) {
  await getDatabase().prepare(
    'UPDATE users SET password_hash = ?, must_change_password = ?, temporary_password_secret = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(passwordHash, mustChangePassword ? 1 : 0, temporaryPasswordSecret, id);
}

async function countActiveAdmins() {
  return Number((await getDatabase().prepare(`
    SELECT COUNT(*) AS count FROM users u JOIN roles r ON r.id = u.role_id
    WHERE r.name = 'ADMIN' AND u.is_active = 1
  `).get()).count);
}

async function referenceCounts(id) {
  const db = getDatabase();
  return {
    ownRequests: Number((await db.prepare('SELECT COUNT(*) AS count FROM leave_requests WHERE user_id = ?').get(id)).count),
    approvals: Number((await db.prepare('SELECT COUNT(*) AS count FROM approval_history WHERE manager_id = ?').get(id)).count),
    approvedRequests: Number((await db.prepare('SELECT COUNT(*) AS count FROM leave_requests WHERE approved_by = ?').get(id)).count),
    managedDepartments: Number((await db.prepare('SELECT COUNT(*) AS count FROM departments WHERE manager_id = ?').get(id)).count)
  };
}

async function remove(id) {
  const db = getDatabase();
  if (!db.isPostgres) {
    db.transaction(() => {
      db.prepare('UPDATE departments SET manager_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE manager_id = ?').run(id);
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
    })();
    return;
  }
  await db.transaction(async () => {
    await db.prepare('UPDATE departments SET manager_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE manager_id = ?').run(id);
    await db.prepare('DELETE FROM users WHERE id = ?').run(id);
  })();
}

module.exports = {
  findByEmail, findById, list, create, update, updateProfile, setActive, setPassword,
  countActiveAdmins, referenceCounts, remove
};
