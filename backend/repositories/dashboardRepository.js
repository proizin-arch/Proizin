const { getDatabase } = require('../config/database');

function count(sql, params = []) {
  return getDatabase().prepare(sql).get(...params).count;
}

function personnelSummary(user) {
  const params = [user.id];
  return {
    totalRequests: count('SELECT COUNT(*) AS count FROM leave_requests WHERE user_id = ?', params),
    pending: count("SELECT COUNT(*) AS count FROM leave_requests WHERE user_id = ? AND status = 'PENDING'", params),
    approved: count("SELECT COUNT(*) AS count FROM leave_requests WHERE user_id = ? AND status = 'APPROVED'", params),
    rejected: count("SELECT COUNT(*) AS count FROM leave_requests WHERE user_id = ? AND status = 'REJECTED'", params)
  };
}

function managerSummary(user) {
  const departmentId = user.department?.id || -1;
  const requestParams = [departmentId, user.id];
  return {
    employees: count(
      "SELECT COUNT(*) AS count FROM users u JOIN roles r ON r.id = u.role_id WHERE u.department_id = ? AND u.is_active = 1 AND r.name = 'PERSONNEL'",
      [departmentId]
    ),
    pending: count("SELECT COUNT(*) AS count FROM leave_requests lr JOIN users u ON u.id = lr.user_id WHERE u.department_id = ? AND lr.user_id != ? AND lr.status = 'PENDING'", requestParams),
    approved: count("SELECT COUNT(*) AS count FROM leave_requests lr JOIN users u ON u.id = lr.user_id WHERE u.department_id = ? AND lr.user_id != ? AND lr.status = 'APPROVED'", requestParams),
    rejected: count("SELECT COUNT(*) AS count FROM leave_requests lr JOIN users u ON u.id = lr.user_id WHERE u.department_id = ? AND lr.user_id != ? AND lr.status = 'REJECTED'", requestParams)
  };
}

function adminSummary() {
  return {
    users: count('SELECT COUNT(*) AS count FROM users WHERE is_active = 1'),
    departments: count('SELECT COUNT(*) AS count FROM departments WHERE is_active = 1'),
    pending: count("SELECT COUNT(*) AS count FROM leave_requests WHERE status = 'PENDING'"),
    approved: count("SELECT COUNT(*) AS count FROM leave_requests WHERE status = 'APPROVED'"),
    rejected: count("SELECT COUNT(*) AS count FROM leave_requests WHERE status = 'REJECTED'")
  };
}

function summary(user) {
  if (user.role === 'ADMIN') return adminSummary();
  if (user.role === 'MANAGER') return managerSummary(user);
  return personnelSummary(user);
}

module.exports = { summary };
