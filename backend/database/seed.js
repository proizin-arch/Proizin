const bcrypt = require('bcrypt');

const departments = [
  'İnsan Kaynakları',
  'Yazılım Geliştirme',
  'Muhasebe',
  'Ar-Ge',
  'Satış ve Pazarlama',
  'Destek ve Müşteri Hizmetleri'
];

const leaveTypes = [
  ['Yıllık İzin', 'ANNUAL', '#2E8B67'],
  ['Mazeret İzni', 'EXCUSE', '#D7863B'],
  ['Hastalık İzni', 'SICK', '#D05A63'],
  ['Babalık İzni', 'PATERNITY', '#7357B7'],
  ['Evlenme İzni', 'MARRIAGE', '#3977D3']
];

function seedDatabase(db) {
  const seed = db.transaction(() => {
    const insertRole = db.prepare('INSERT OR IGNORE INTO roles (id, name) VALUES (?, ?)');
    insertRole.run(1, 'PERSONNEL');
    insertRole.run(2, 'MANAGER');
    insertRole.run(3, 'ADMIN');

    const insertDepartment = db.prepare('INSERT OR IGNORE INTO departments (name) VALUES (?)');
    departments.forEach((name) => insertDepartment.run(name));

    const insertLeaveType = db.prepare(
      'INSERT OR IGNORE INTO leave_types (name, code, color) VALUES (?, ?, ?)'
    );
    leaveTypes.forEach((type) => insertLeaveType.run(...type));

    const roleId = db.prepare('SELECT id FROM roles WHERE name = ?');
    const departmentId = db.prepare('SELECT id FROM departments WHERE name = ?');
    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users
        (first_name, last_name, email, password_hash, birth_date, phone, address,
         department_id, position, role_id, hire_date)
      VALUES
        (@firstName, @lastName, @email, @passwordHash, @birthDate, @phone, @address,
         @departmentId, @position, @roleId, @hireDate)
    `);

    const softwareDepartmentId = departmentId.get('Yazılım Geliştirme').id;
    const peopleDepartmentId = departmentId.get('İnsan Kaynakları').id;
    const users = [
      {
        firstName: 'Selim', lastName: 'Yılmaz', email: 'admin@izinpro.local',
        password: 'Admin123!', birthDate: '1988-02-14', phone: '0555 100 10 10',
        address: 'İstanbul', departmentId: peopleDepartmentId, position: 'Sistem Yöneticisi',
        roleId: roleId.get('ADMIN').id, hireDate: '2018-01-08'
      },
      {
        firstName: 'Mehmet', lastName: 'Kaya', email: 'yonetici@izinpro.local',
        password: 'Yonetici123!', birthDate: '1986-06-21', phone: '0555 200 20 20',
        address: 'İstanbul', departmentId: softwareDepartmentId,
        position: 'Yazılım Geliştirme Yöneticisi', roleId: roleId.get('MANAGER').id,
        hireDate: '2017-04-17'
      },
      {
        firstName: 'Ahmet', lastName: 'Demir', email: 'personel@izinpro.local',
        password: 'Personel123!', birthDate: '1995-03-12', phone: '0555 300 30 30',
        address: 'İstanbul', departmentId: softwareDepartmentId, position: 'Frontend Developer',
        roleId: roleId.get('PERSONNEL').id, hireDate: '2022-08-01'
      },
      {
        firstName: 'Ayşe', lastName: 'Kaya', email: 'ayse@izinpro.local',
        password: 'Personel123!', birthDate: '1994-10-09', phone: '0555 400 40 40',
        address: 'İstanbul', departmentId: softwareDepartmentId, position: 'Backend Developer',
        roleId: roleId.get('PERSONNEL').id, hireDate: '2021-02-15'
      }
    ];

    users.forEach((user) => {
      insertUser.run({ ...user, passwordHash: bcrypt.hashSync(user.password, 10) });
    });

    const manager = db.prepare('SELECT id FROM users WHERE email = ?').get('yonetici@izinpro.local');
    db.prepare(`
      UPDATE departments
      SET manager_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND (manager_id IS NULL OR manager_id != ?)
    `).run(manager.id, softwareDepartmentId, manager.id);

    const requestCount = db.prepare('SELECT COUNT(*) AS count FROM leave_requests').get().count;
    if (requestCount === 0) {
      const personnel = db.prepare('SELECT id FROM users WHERE email = ?').get('personel@izinpro.local');
      const annual = db.prepare('SELECT id FROM leave_types WHERE code = ?').get('ANNUAL');
      db.prepare(`
        INSERT INTO leave_requests
          (user_id, leave_type_id, start_date, end_date, working_days, employee_comment)
        VALUES (?, ?, '2026-09-10', '2026-09-11', 2, ?)
      `).run(personnel.id, annual.id, 'Aile ziyareti için izin talep ediyorum.');
    }
  });

  seed();
}

module.exports = { seedDatabase };
