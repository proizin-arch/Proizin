const leaveTypes = [
  ['Yıllık İzin', 'ANNUAL', '#2E8B67'],
  ['Mazeret İzni', 'EXCUSE', '#D7863B'],
  ['Hastalık İzni', 'SICK', '#D05A63'],
  ['Babalık İzni', 'PATERNITY', '#7357B7'],
  ['Evlenme İzni', 'MARRIAGE', '#3977D3']
];

function seedSystemDefaults(db) {
  const seed = db.transaction(() => {
    const insertRole = db.prepare('INSERT OR IGNORE INTO roles (id, name) VALUES (?, ?)');
    insertRole.run(1, 'PERSONNEL');
    insertRole.run(2, 'MANAGER');
    insertRole.run(3, 'ADMIN');

    const insertLeaveType = db.prepare(
      'INSERT OR IGNORE INTO leave_types (name, code, color) VALUES (?, ?, ?)'
    );
    leaveTypes.forEach((type) => insertLeaveType.run(...type));

    db.prepare(`
      INSERT OR IGNORE INTO app_settings
        (id, organization_name, login_domain, is_configured)
      VALUES (1, 'İzinPro', 'izinpro.com', 0)
    `).run();

    const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
    if (userCount > 0) {
      db.prepare(`
        UPDATE app_settings SET is_configured = 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1 AND is_configured = 0
      `).run();
    }
  });

  seed();
}

module.exports = { seedSystemDefaults, leaveTypes };
