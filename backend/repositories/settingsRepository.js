const { getDatabase } = require('../config/database');
const { leaveTypes, seedSystemDefaults } = require('../database/seed');

function map(row) {
  if (!row) return null;
  return {
    organizationName: row.organization_name,
    loginDomain: row.login_domain,
    isConfigured: Boolean(row.is_configured),
    updatedAt: row.updated_at
  };
}

async function get() {
  return map(await getDatabase().prepare('SELECT * FROM app_settings WHERE id = 1').get());
}

async function seedDefaults(db) {
  for (const [id, name] of [[1, 'PERSONNEL'], [2, 'MANAGER'], [3, 'ADMIN']]) {
    await db.prepare('INSERT OR IGNORE INTO roles (id, name) VALUES (?, ?)').run(id, name);
  }
  for (const type of leaveTypes) {
    await db.prepare('INSERT OR IGNORE INTO leave_types (name, code, color) VALUES (?, ?, ?)').run(...type);
  }
  await db.prepare(`
    INSERT OR IGNORE INTO app_settings
      (id, organization_name, login_domain, is_configured)
    VALUES (1, 'İzinPro', 'izinpro.com', 0)
  `).run();
}

async function completeSetup(data) {
  const db = getDatabase();
  if (!db.isPostgres) {
    return db.transaction(() => {
      const settings = db.prepare('SELECT is_configured FROM app_settings WHERE id = 1').get();
      const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
      if (settings?.is_configured || userCount > 0) return null;
      const roleId = db.prepare("SELECT id FROM roles WHERE name = 'ADMIN'").get().id;
      db.prepare('INSERT OR IGNORE INTO positions (name) VALUES (?)').run(data.position);
      const positionId = db.prepare('SELECT id FROM positions WHERE name = ? COLLATE NOCASE').get(data.position).id;
      const result = db.prepare(`
        INSERT INTO users
          (first_name, last_name, email, password_hash, department_id, position, position_id,
           role_id, hire_date, must_change_password)
        VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, 0)
      `).run(
        data.firstName, data.lastName, data.email, data.passwordHash,
        data.position, positionId, roleId, data.hireDate
      );
      db.prepare(`
        UPDATE app_settings
        SET organization_name = ?, login_domain = 'izinpro.com', is_configured = 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `).run(data.organizationName);
      return Number(result.lastInsertRowid);
    })();
  }
  const transaction = db.transaction(async () => {
    const settings = await db.prepare('SELECT is_configured FROM app_settings WHERE id = 1').get();
    const userCount = Number((await db.prepare('SELECT COUNT(*) AS count FROM users').get()).count);
    if (settings?.is_configured || userCount > 0) return null;
    const roleId = (await db.prepare("SELECT id FROM roles WHERE name = 'ADMIN'").get()).id;
    await db.prepare('INSERT OR IGNORE INTO positions (name) VALUES (?)').run(data.position);
    const positionId = (await db.prepare('SELECT id FROM positions WHERE name = ? COLLATE NOCASE').get(data.position)).id;
    const result = await db.prepare(`
      INSERT INTO users
        (first_name, last_name, email, password_hash, department_id, position, position_id,
         role_id, hire_date, must_change_password)
      VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, 0)
    `).run(
      data.firstName, data.lastName, data.email, data.passwordHash,
      data.position, positionId, roleId, data.hireDate
    );
    await db.prepare(`
      UPDATE app_settings
      SET organization_name = ?, login_domain = 'izinpro.com', is_configured = 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(data.organizationName);
    return Number(result.lastInsertRowid);
  });
  return transaction();
}

async function update({ organizationName }) {
  await getDatabase().prepare(`
    UPDATE app_settings SET organization_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1
  `).run(organizationName);
  return get();
}

async function clearOperations(currentSessionId) {
  const db = getDatabase();
  if (!db.isPostgres) {
    db.transaction(() => {
      db.prepare('DELETE FROM approval_history').run();
      db.prepare('DELETE FROM leave_requests').run();
      if (currentSessionId) db.prepare('DELETE FROM sessions WHERE sid != ?').run(currentSessionId);
      else db.prepare('DELETE FROM sessions').run();
      db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('leave_requests', 'approval_history')").run();
    })();
    return;
  }
  await db.transaction(async () => {
    await db.prepare('DELETE FROM approval_history').run();
    await db.prepare('DELETE FROM leave_requests').run();
    if (currentSessionId) await db.prepare('DELETE FROM sessions WHERE sid != ?').run(currentSessionId);
    else await db.prepare('DELETE FROM sessions').run();
    await db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('leave_requests', 'approval_history')").run();
  })();
}

async function factoryReset(adminId, currentSessionId) {
  const db = getDatabase();
  if (!db.isPostgres) {
    db.transaction(() => {
      const admin = db.prepare(`
        SELECT u.id, u.position, u.position_id
        FROM users u JOIN roles r ON r.id = u.role_id
        WHERE u.id = ? AND r.name = 'ADMIN'
      `).get(adminId);
      if (!admin) throw new Error('Korunacak admin hesabı bulunamadı.');
      db.prepare('DELETE FROM approval_history').run();
      db.prepare('DELETE FROM leave_requests').run();
      if (currentSessionId) db.prepare('DELETE FROM sessions WHERE sid != ?').run(currentSessionId);
      else db.prepare('DELETE FROM sessions').run();
      db.prepare('UPDATE departments SET manager_id = NULL').run();
      db.prepare('UPDATE users SET department_id = NULL WHERE id = ?').run(adminId);
      db.prepare('DELETE FROM users WHERE id != ?').run(adminId);
      db.prepare('DELETE FROM departments').run();
      if (admin.position_id) {
        db.prepare('DELETE FROM positions WHERE id != ?').run(admin.position_id);
      } else {
        db.prepare('DELETE FROM positions').run();
        const positionId = db.prepare('INSERT INTO positions (name) VALUES (?)').run(admin.position || 'Admin').lastInsertRowid;
        db.prepare('UPDATE users SET position_id = ? WHERE id = ?').run(positionId, adminId);
      }
      db.prepare('DELETE FROM leave_types').run();
      db.prepare(`
        UPDATE app_settings
        SET organization_name = 'İzinPro', login_domain = 'izinpro.com', is_configured = 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `).run();
      db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('departments', 'leave_types', 'leave_requests', 'approval_history')").run();
    })();
    seedSystemDefaults(db);
    return;
  }
  await db.transaction(async () => {
    const admin = await db.prepare(`
      SELECT u.id, u.position, u.position_id
      FROM users u JOIN roles r ON r.id = u.role_id
      WHERE u.id = ? AND r.name = 'ADMIN'
    `).get(adminId);
    if (!admin) throw new Error('Korunacak admin hesabı bulunamadı.');

    await db.prepare('DELETE FROM approval_history').run();
    await db.prepare('DELETE FROM leave_requests').run();
    if (currentSessionId) await db.prepare('DELETE FROM sessions WHERE sid != ?').run(currentSessionId);
    else await db.prepare('DELETE FROM sessions').run();
    await db.prepare('UPDATE departments SET manager_id = NULL').run();
    await db.prepare('UPDATE users SET department_id = NULL WHERE id = ?').run(adminId);
    await db.prepare('DELETE FROM users WHERE id != ?').run(adminId);
    await db.prepare('DELETE FROM departments').run();
    if (admin.position_id) {
      await db.prepare('DELETE FROM positions WHERE id != ?').run(admin.position_id);
    } else {
      await db.prepare('DELETE FROM positions').run();
      const positionId = (await db.prepare('INSERT INTO positions (name) VALUES (?)').run(admin.position || 'Admin')).lastInsertRowid;
      await db.prepare('UPDATE users SET position_id = ? WHERE id = ?').run(positionId, adminId);
    }
    await db.prepare('DELETE FROM leave_types').run();
    await db.prepare(`
      UPDATE app_settings
      SET organization_name = 'İzinPro', login_domain = 'izinpro.com', is_configured = 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run();
    await db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('departments', 'leave_types', 'leave_requests', 'approval_history')").run();
  })();
  await seedDefaults(db);
}

module.exports = { get, completeSetup, update, clearOperations, factoryReset };
