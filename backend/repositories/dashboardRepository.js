const { getDatabase } = require('../config/database');

async function count(sql, params = []) {
  return Number((await getDatabase().prepare(sql).get(...params)).count);
}

async function personnelSummary(user) {
  const params = [user.id];
  return {
    totalRequests: await count('SELECT COUNT(*) AS count FROM leave_requests WHERE user_id = ?', params),
    pending: await count("SELECT COUNT(*) AS count FROM leave_requests WHERE user_id = ? AND status = 'PENDING'", params),
    approved: await count("SELECT COUNT(*) AS count FROM leave_requests WHERE user_id = ? AND status = 'APPROVED'", params),
    rejected: await count("SELECT COUNT(*) AS count FROM leave_requests WHERE user_id = ? AND status = 'REJECTED'", params)
  };
}

async function managerSummary(user) {
  const departmentId = user.department?.id || -1;
  const requestParams = [departmentId, user.id];
  return {
    employees: await count(
      'SELECT COUNT(*) AS count FROM users u WHERE u.department_id = ? AND u.is_active = 1 AND u.id != ?',
      [departmentId, user.id]
    ),
    pending: await count("SELECT COUNT(*) AS count FROM leave_requests lr JOIN users u ON u.id = lr.user_id WHERE u.department_id = ? AND lr.user_id != ? AND lr.status = 'PENDING'", requestParams),
    approved: await count("SELECT COUNT(*) AS count FROM leave_requests lr JOIN users u ON u.id = lr.user_id WHERE u.department_id = ? AND lr.user_id != ? AND lr.status = 'APPROVED'", requestParams),
    rejected: await count("SELECT COUNT(*) AS count FROM leave_requests lr JOIN users u ON u.id = lr.user_id WHERE u.department_id = ? AND lr.user_id != ? AND lr.status = 'REJECTED'", requestParams)
  };
}

async function adminSummary() {
  return {
    users: await count('SELECT COUNT(*) AS count FROM users WHERE is_active = 1'),
    departments: await count('SELECT COUNT(*) AS count FROM departments WHERE is_active = 1'),
    pending: await count("SELECT COUNT(*) AS count FROM leave_requests WHERE status = 'PENDING'"),
    approved: await count("SELECT COUNT(*) AS count FROM leave_requests WHERE status = 'APPROVED'"),
    rejected: await count("SELECT COUNT(*) AS count FROM leave_requests WHERE status = 'REJECTED'")
  };
}

async function summary(user) {
  if (user.role === 'ADMIN') return adminSummary();
  if (user.role === 'MANAGER') return managerSummary(user);
  return personnelSummary(user);
}

module.exports = { summary };
