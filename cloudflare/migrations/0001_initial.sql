PRAGMA foreign_keys = ON;

CREATE TABLE roles (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK (name IN ('PERSONNEL', 'MANAGER', 'ADMIN'))
);

CREATE TABLE positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE,
  manager_id INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  birth_date TEXT,
  phone TEXT,
  address TEXT,
  department_id INTEGER,
  position TEXT NOT NULL,
  position_id INTEGER,
  role_id INTEGER NOT NULL,
  hire_date TEXT NOT NULL,
  must_change_password INTEGER NOT NULL DEFAULT 1 CHECK (must_change_password IN (0, 1)),
  temporary_password_secret TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE RESTRICT,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

CREATE TABLE leave_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE,
  code TEXT NOT NULL COLLATE NOCASE UNIQUE,
  color TEXT NOT NULL DEFAULT '#3977D3',
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leave_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  leave_type_id INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  working_days INTEGER NOT NULL CHECK (working_days > 0),
  employee_comment TEXT,
  manager_comment TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  approved_by INTEGER,
  decision_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE RESTRICT,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE approval_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  leave_request_id INTEGER NOT NULL,
  manager_id INTEGER NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('APPROVED', 'REJECTED')),
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (leave_request_id) REFERENCES leave_requests(id) ON DELETE RESTRICT,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE sessions (
  sid TEXT PRIMARY KEY,
  sess TEXT NOT NULL,
  expires INTEGER NOT NULL
);

CREATE TABLE app_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  organization_name TEXT NOT NULL DEFAULT 'İzinPro',
  login_domain TEXT NOT NULL DEFAULT 'izinpro.com',
  is_configured INTEGER NOT NULL DEFAULT 0 CHECK (is_configured IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_position ON users(position_id);
CREATE INDEX idx_leave_requests_user ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_approval_history_request ON approval_history(leave_request_id);
CREATE INDEX idx_sessions_expires ON sessions(expires);

INSERT INTO roles (id, name) VALUES
  (1, 'PERSONNEL'), (2, 'MANAGER'), (3, 'ADMIN');

INSERT INTO leave_types (id, name, code, color) VALUES
  (1, 'Yıllık İzin', 'ANNUAL', '#2E8B67'),
  (2, 'Mazeret İzni', 'EXCUSE', '#D7863B'),
  (3, 'Hastalık İzni', 'SICK', '#D05A63'),
  (4, 'Babalık İzni', 'PATERNITY', '#7357B7'),
  (5, 'Evlenme İzni', 'MARRIAGE', '#3977D3');

INSERT INTO app_settings (id, organization_name, login_domain, is_configured)
VALUES (1, 'İzinPro Demo Kurumu', 'izinpro.com', 1);

INSERT INTO positions (id, name) VALUES
  (1, 'Admin'), (2, 'Yazılım Yöneticisi'), (3, 'Yazılım Uzmanı');

INSERT INTO departments (id, name) VALUES (1, 'Yazılım Geliştirme');

INSERT INTO users
  (id, first_name, last_name, email, password_hash, department_id, position, position_id,
   role_id, hire_date, must_change_password, is_active)
VALUES
  (1, 'Selenay', 'Yılmaz', 'admin@izinpro.com', '$2b$12$l.leyfQ7UN7Gjjc5.Kzi6uwkDuMOM5F9SXnIgDOBL4B6jnzi2qERm', NULL, 'Admin', 1, 3, '2024-01-02', 0, 1),
  (2, 'Ali', 'Alaya', 'ali.alaya@izinpro.com', '$2b$12$OE9r3l36cop32Xq6jCg2yeLSXnpUssiqq6.ARaDvh6QlqONSwgjgi', 1, 'Yazılım Yöneticisi', 2, 2, '2024-02-05', 0, 1),
  (3, 'Muhammet', 'Ala', 'muhammet.ala@izinpro.com', '$2b$12$LtZo7LkINNbFe7LVfxdMZeebRuL1nBwmXxplVffO2uJvzQWuxAm36', 1, 'Yazılım Uzmanı', 3, 1, '2025-01-06', 0, 1);

UPDATE departments SET manager_id = 2 WHERE id = 1;

INSERT INTO leave_requests
  (id, user_id, leave_type_id, start_date, end_date, working_days, employee_comment,
   manager_comment, status, approved_by, decision_at)
VALUES
  (1, 3, 1, '2027-02-01', '2027-02-03', 3, 'Planlı yıllık izin talebi', 'Plan uygundur.', 'APPROVED', 2, CURRENT_TIMESTAMP),
  (2, 3, 3, '2027-03-08', '2027-03-09', 2, 'Örnek hastalık izni talebi', 'Belge bilgisi eksik.', 'REJECTED', 2, CURRENT_TIMESTAMP),
  (3, 3, 1, '2027-04-05', '2027-04-07', 3, 'Yönetici kararı bekleyen demo talebi', NULL, 'PENDING', NULL, NULL);

INSERT INTO approval_history (id, leave_request_id, manager_id, decision, comment)
VALUES
  (1, 1, 2, 'APPROVED', 'Plan uygundur.'),
  (2, 2, 2, 'REJECTED', 'Belge bilgisi eksik.');
