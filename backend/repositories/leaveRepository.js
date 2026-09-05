const { getDatabase } = require('../config/database');
const AppError = require('../utils/AppError');

const BASE_SELECT = `
  SELECT lr.id, lr.user_id, lr.leave_type_id, lr.start_date, lr.end_date,
         lr.working_days, lr.employee_comment, lr.manager_comment, lr.status,
         lr.approved_by, lr.decision_at, lr.created_at, lr.updated_at,
         u.first_name || ' ' || u.last_name AS employee_name,
         u.position, u.department_id, d.name AS department_name,
         lt.name AS leave_type_name, lt.code AS leave_type_code, lt.color AS leave_type_color,
         a.first_name || ' ' || a.last_name AS approver_name
  FROM leave_requests lr
  JOIN users u ON u.id = lr.user_id
  LEFT JOIN departments d ON d.id = u.department_id
  JOIN leave_types lt ON lt.id = lr.leave_type_id
  LEFT JOIN users a ON a.id = lr.approved_by
`;

function map(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    employeeName: row.employee_name,
    position: row.position,
    department: row.department_id ? { id: row.department_id, name: row.department_name } : null,
    leaveType: {
      id: row.leave_type_id,
      name: row.leave_type_name,
      code: row.leave_type_code,
      color: row.leave_type_color
    },
    startDate: row.start_date,
    endDate: row.end_date,
    workingDays: row.working_days,
    employeeComment: row.employee_comment,
    managerComment: row.manager_comment,
    status: row.status,
    approvedBy: row.approved_by ? { id: row.approved_by, name: row.approver_name } : null,
    decisionAt: row.decision_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function list({ requester, status, leaveTypeId, startDate, endDate, search } = {}) {
  const conditions = [];
  const params = [];

  if (requester.role === 'PERSONNEL') {
    conditions.push('lr.user_id = ?');
    params.push(requester.id);
  } else if (requester.role === 'MANAGER') {
    conditions.push('u.department_id = ?', 'lr.user_id != ?');
    params.push(requester.department?.id || -1, requester.id);
  }

  if (status) {
    conditions.push('lr.status = ?');
    params.push(status);
  }
  if (leaveTypeId) {
    conditions.push('lr.leave_type_id = ?');
    params.push(leaveTypeId);
  }
  if (startDate) {
    conditions.push('lr.end_date >= ?');
    params.push(startDate);
  }
  if (endDate) {
    conditions.push('lr.start_date <= ?');
    params.push(endDate);
  }
  if (search) {
    conditions.push("(u.first_name || ' ' || u.last_name LIKE ? OR lr.employee_comment LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return getDatabase().prepare(`${BASE_SELECT} ${where} ORDER BY lr.created_at DESC, lr.id DESC`)
    .all(...params).map(map);
}

function findById(id) {
  return map(getDatabase().prepare(`${BASE_SELECT} WHERE lr.id = ?`).get(id));
}

function hasOverlap(userId, startDate, endDate, excludeId = null) {
  const params = [userId, endDate, startDate];
  let exclude = '';
  if (excludeId) {
    exclude = 'AND id != ?';
    params.push(excludeId);
  }
  const row = getDatabase().prepare(`
    SELECT 1 FROM leave_requests
    WHERE user_id = ? AND status IN ('PENDING', 'APPROVED')
      AND start_date <= ? AND end_date >= ? ${exclude}
    LIMIT 1
  `).get(...params);
  return Boolean(row);
}

function create(data) {
  const result = getDatabase().prepare(`
    INSERT INTO leave_requests
      (user_id, leave_type_id, start_date, end_date, working_days, employee_comment)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    data.userId, data.leaveTypeId, data.startDate, data.endDate,
    data.workingDays, data.employeeComment
  );
  return findById(result.lastInsertRowid);
}

function update(id, data) {
  getDatabase().prepare(`
    UPDATE leave_requests SET leave_type_id = ?, start_date = ?, end_date = ?,
      working_days = ?, employee_comment = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND status = 'PENDING'
  `).run(data.leaveTypeId, data.startDate, data.endDate, data.workingDays, data.employeeComment, id);
  return findById(id);
}

function cancel(id) {
  getDatabase().prepare(`
    UPDATE leave_requests SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND status = 'PENDING'
  `).run(id);
  return findById(id);
}

function decide(id, managerId, decision, comment) {
  const db = getDatabase();
  const transaction = db.transaction(() => {
    const current = db.prepare('SELECT status FROM leave_requests WHERE id = ?').get(id);
    if (!current) throw new AppError('İzin talebi bulunamadı.', 404);
    if (current.status !== 'PENDING') {
      throw new AppError('Yalnızca bekleyen talepler için karar verilebilir.', 409);
    }
    db.prepare(`
      UPDATE leave_requests SET status = ?, manager_comment = ?, approved_by = ?,
        decision_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'PENDING'
    `).run(decision, comment, managerId, id);
    db.prepare(`
      INSERT INTO approval_history (leave_request_id, manager_id, decision, comment)
      VALUES (?, ?, ?, ?)
    `).run(id, managerId, decision, comment);
  });
  transaction();
  return findById(id);
}

function history({ requester } = {}) {
  const conditions = ["ah.decision IN ('APPROVED', 'REJECTED')"];
  const params = [];
  if (requester.role === 'MANAGER') {
    conditions.push('u.department_id = ?');
    params.push(requester.department?.id || -1);
  } else if (requester.role === 'PERSONNEL') {
    conditions.push('lr.user_id = ?');
    params.push(requester.id);
  }
  return getDatabase().prepare(`
    SELECT ah.id, ah.decision, ah.comment, ah.created_at,
           lr.id AS leave_request_id, u.first_name || ' ' || u.last_name AS employee_name,
           lt.name AS leave_type_name, m.first_name || ' ' || m.last_name AS manager_name
    FROM approval_history ah
    JOIN leave_requests lr ON lr.id = ah.leave_request_id
    JOIN users u ON u.id = lr.user_id
    JOIN leave_types lt ON lt.id = lr.leave_type_id
    JOIN users m ON m.id = ah.manager_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY ah.created_at DESC, ah.id DESC
  `).all(...params).map((row) => ({
    id: row.id,
    leaveRequestId: row.leave_request_id,
    employeeName: row.employee_name,
    leaveTypeName: row.leave_type_name,
    managerName: row.manager_name,
    decision: row.decision,
    comment: row.comment,
    createdAt: row.created_at
  }));
}

module.exports = { list, findById, hasOverlap, create, update, cancel, decide, history };
