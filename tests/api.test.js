const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const request = require('supertest');
const { createApp } = require('../backend/app');
const { getDatabase, closeDatabase } = require('../backend/config/database');

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'izinpro-test-'));
const databaseFile = path.join(tempDirectory, 'test.db');
process.env.SESSION_SECRET = 'test-secret-with-at-least-thirty-two-characters';

let app;

test.before(() => { app = createApp({ databaseFile }); });
test.after(() => {
  closeDatabase();
  fs.rmSync(tempDirectory, { recursive: true, force: true });
});

async function login(email, password) {
  const agent = request.agent(app);
  const response = await agent.post('/api/auth/login').send({ email, password });
  assert.equal(response.status, 200, response.text);
  return agent;
}

test('sağlık kontrolü ve korumalı endpoint davranışı', async () => {
  const health = await request(app).get('/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.data.status, 'ok');

  const unauthorized = await request(app).get('/api/users');
  assert.equal(unauthorized.status, 401);
  assert.equal(unauthorized.body.success, false);

  const loginPage = await request(app).get('/login.html');
  assert.equal(loginPage.status, 200);
  assert.match(loginPage.headers['content-security-policy'], /default-src 'self'/);
  assert.equal(loginPage.headers['x-powered-by'], undefined);
  assert.doesNotMatch(loginPage.text, /Rol Seç/i);
});

test('seed hesaplarının şifreleri hash olarak saklanır', () => {
  const row = getDatabase().prepare('SELECT password_hash FROM users WHERE email = ?').get('admin@izinpro.local');
  assert.notEqual(row.password_hash, 'Admin123!');
  assert.match(row.password_hash, /^\$2[aby]\$/);
});

test('kayıt ekranından rol yükseltilemez ve oturum açılır', async () => {
  const agent = request.agent(app);
  const departments = await request(app).get('/api/public/departments');
  const software = departments.body.data.find((item) => item.name === 'Yazılım Geliştirme');
  const response = await agent.post('/api/auth/register').send({
    firstName: 'Deniz', lastName: 'Arslan', email: 'deniz@izinpro.local',
    password: 'Deniz123!', departmentId: software.id, position: 'Test Uzmanı',
    hireDate: '2026-01-05', role: 'ADMIN'
  });
  assert.equal(response.status, 201, response.text);
  assert.equal(response.body.data.role, 'PERSONNEL');
  const me = await agent.get('/api/auth/me');
  assert.equal(me.body.data.email, 'deniz@izinpro.local');
});

test('personel izin oluşturabilir; süre hafta sonu hariç backendde hesaplanır', async () => {
  const agent = await login('personel@izinpro.local', 'Personel123!');
  const types = await agent.get('/api/leave-types');
  const annual = types.body.data.find((item) => item.code === 'ANNUAL');
  const response = await agent.post('/api/leave-requests').send({
    leaveTypeId: annual.id,
    startDate: '2027-01-07',
    endDate: '2027-01-11',
    employeeComment: 'Yıllık izin talebi'
  });
  assert.equal(response.status, 201, response.text);
  assert.equal(response.body.data.workingDays, 3);
  assert.equal(response.body.data.status, 'PENDING');

  const forbidden = await agent.get('/api/users');
  assert.equal(forbidden.status, 403);
});

test('çakışan izin ve başka personelin kaydına erişim engellenir', async () => {
  const personnel = await login('personel@izinpro.local', 'Personel123!');
  const types = await personnel.get('/api/leave-types');
  const annual = types.body.data.find((item) => item.code === 'ANNUAL');
  const overlap = await personnel.post('/api/leave-requests').send({
    leaveTypeId: annual.id, startDate: '2027-01-08', endDate: '2027-01-12'
  });
  assert.equal(overlap.status, 409);

  const ayse = await login('ayse@izinpro.local', 'Personel123!');
  const ahmetRequests = await personnel.get('/api/leave-requests');
  const foreignId = ahmetRequests.body.data[0].id;
  const foreign = await ayse.get(`/api/leave-requests/${foreignId}`);
  assert.equal(foreign.status, 403);
});

test('takvimde bulunmayan tarihler backend tarafından reddedilir', async () => {
  const personnel = await login('personel@izinpro.local', 'Personel123!');
  const types = await personnel.get('/api/leave-types');
  const invalid = await personnel.post('/api/leave-requests').send({
    leaveTypeId: types.body.data[0].id, startDate: '2027-02-30', endDate: '2027-03-02'
  });
  assert.equal(invalid.status, 400);
});

test('yönetici yalnızca kendi departmanındaki talebi görür ve onaylar', async () => {
  const manager = await login('yonetici@izinpro.local', 'Yonetici123!');
  const employees = await manager.get('/api/users');
  assert.ok(employees.body.data.length >= 1);
  assert.ok(employees.body.data.every((user) => user.role === 'PERSONNEL' && user.department.name === 'Yazılım Geliştirme'));
  const pending = await manager.get('/api/leave-requests?status=PENDING');
  assert.equal(pending.status, 200);
  assert.ok(pending.body.data.length >= 1);
  assert.ok(pending.body.data.every((item) => item.department.name === 'Yazılım Geliştirme'));

  const target = pending.body.data.find((item) => item.startDate === '2027-01-07');
  const approved = await manager.post(`/api/leave-requests/${target.id}/approve`).send({ managerComment: 'Uygundur.' });
  assert.equal(approved.status, 200, approved.text);
  assert.equal(approved.body.data.status, 'APPROVED');

  const personnel = await login('personel@izinpro.local', 'Personel123!');
  const edit = await personnel.put(`/api/leave-requests/${target.id}`).send({
    leaveTypeId: target.leaveType.id, startDate: '2027-01-07', endDate: '2027-01-08'
  });
  assert.equal(edit.status, 409);

  const secondDecision = await manager.post(`/api/leave-requests/${target.id}/approve`).send({});
  assert.equal(secondDecision.status, 409);
  const historyRows = getDatabase().prepare('SELECT COUNT(*) AS count FROM approval_history WHERE leave_request_id = ?').get(target.id);
  assert.equal(historyRows.count, 1);
});

test('başka departmanın talebi yöneticiye görünmez ve yönetilemez', async () => {
  const admin = await login('admin@izinpro.local', 'Admin123!');
  const departments = await admin.get('/api/departments');
  const accounting = departments.body.data.find((item) => item.name === 'Muhasebe');
  const created = await admin.post('/api/users').send({
    firstName: 'Ece', lastName: 'Yıldız', email: 'ece@izinpro.local', password: 'EceTest123!',
    departmentId: accounting.id, position: 'Muhasebe Uzmanı', role: 'PERSONNEL', hireDate: '2025-06-02'
  });
  assert.equal(created.status, 201, created.text);

  const ece = await login('ece@izinpro.local', 'EceTest123!');
  const types = await ece.get('/api/leave-types');
  const type = types.body.data[0];
  const leave = await ece.post('/api/leave-requests').send({ leaveTypeId: type.id, startDate: '2027-03-01', endDate: '2027-03-02' });
  assert.equal(leave.status, 201, leave.text);

  const manager = await login('yonetici@izinpro.local', 'Yonetici123!');
  const detail = await manager.get(`/api/leave-requests/${leave.body.data.id}`);
  assert.equal(detail.status, 403);
  const decision = await manager.post(`/api/leave-requests/${leave.body.data.id}/approve`).send({});
  assert.equal(decision.status, 403);
});

test('red işlemi açıklama ister ve işlem geçmişe kaydolur', async () => {
  const personnel = await login('ayse@izinpro.local', 'Personel123!');
  const types = await personnel.get('/api/leave-types');
  const response = await personnel.post('/api/leave-requests').send({
    leaveTypeId: types.body.data[0].id, startDate: '2027-04-05', endDate: '2027-04-05'
  });
  const manager = await login('yonetici@izinpro.local', 'Yonetici123!');
  const withoutComment = await manager.post(`/api/leave-requests/${response.body.data.id}/reject`).send({});
  assert.equal(withoutComment.status, 400);
  const rejected = await manager.post(`/api/leave-requests/${response.body.data.id}/reject`).send({ managerComment: 'Ekip planıyla çakışıyor.' });
  assert.equal(rejected.status, 200, rejected.text);
  const history = await manager.get('/api/leave-requests/history');
  assert.ok(history.body.data.some((item) => item.leaveRequestId === response.body.data.id && item.decision === 'REJECTED'));
});

test('personel bekleyen talebini düzenleyebilir ve fiziksel silmeden iptal edebilir', async () => {
  const personnel = await login('personel@izinpro.local', 'Personel123!');
  const requests = await personnel.get('/api/leave-requests?status=PENDING');
  const pending = requests.body.data[0];
  const update = await personnel.put(`/api/leave-requests/${pending.id}`).send({
    leaveTypeId: pending.leaveType.id,
    startDate: '2026-09-14',
    endDate: '2026-09-15',
    employeeComment: 'Güncellenmiş açıklama'
  });
  assert.equal(update.status, 200, update.text);
  assert.equal(update.body.data.workingDays, 2);
  const cancel = await personnel.patch(`/api/leave-requests/${pending.id}/cancel`).send({});
  assert.equal(cancel.status, 200, cancel.text);
  assert.equal(cancel.body.data.status, 'CANCELLED');
  assert.ok(getDatabase().prepare('SELECT id FROM leave_requests WHERE id = ?').get(pending.id));
});

test('kullanıcı profilini ve kendi şifresini güncelleyebilir', async () => {
  const deniz = await login('deniz@izinpro.local', 'Deniz123!');
  const profile = await deniz.patch('/api/users/profile').send({ phone: '0555 999 88 77', address: 'Ankara' });
  assert.equal(profile.status, 200, profile.text);
  assert.equal(profile.body.data.phone, '0555 999 88 77');
  const wrong = await deniz.post('/api/auth/change-password').send({ currentPassword: 'Yanlis123!', newPassword: 'YeniDeniz123!' });
  assert.equal(wrong.status, 400);
  const changed = await deniz.post('/api/auth/change-password').send({ currentPassword: 'Deniz123!', newPassword: 'YeniDeniz123!' });
  assert.equal(changed.status, 200, changed.text);
});

test('admin departman oluşturabilir, yönetici atayabilir ve pasifleştirebilir', async () => {
  const admin = await login('admin@izinpro.local', 'Admin123!');
  const departmentResponse = await admin.post('/api/departments').send({ name: 'Kalite Güvence' });
  assert.equal(departmentResponse.status, 201, departmentResponse.text);
  const department = departmentResponse.body.data;
  const managerResponse = await admin.post('/api/users').send({
    firstName: 'Bora', lastName: 'Akın', email: 'bora@izinpro.local', password: 'BoraTest123!',
    departmentId: department.id, position: 'Kalite Yöneticisi', role: 'MANAGER', hireDate: '2024-01-08'
  });
  assert.equal(managerResponse.status, 201, managerResponse.text);
  const assignment = await admin.put(`/api/departments/${department.id}`).send({ name: department.name, managerId: managerResponse.body.data.id });
  assert.equal(assignment.status, 200, assignment.text);
  assert.equal(assignment.body.data.managerId, managerResponse.body.data.id);

  const deactivate = await admin.patch(`/api/users/${managerResponse.body.data.id}/status`).send({ isActive: false });
  assert.equal(deactivate.status, 200, deactivate.text);
  const departments = await admin.get('/api/departments');
  assert.equal(departments.body.data.find((item) => item.id === department.id).managerId, null);
  const departmentDeactivate = await admin.patch(`/api/departments/${department.id}/status`).send({ isActive: false });
  assert.equal(departmentDeactivate.body.data.isActive, false);
});

test('admin izin türü oluşturabilir, düzenleyebilir ve pasifleştirebilir', async () => {
  const admin = await login('admin@izinpro.local', 'Admin123!');
  const created = await admin.post('/api/leave-types').send({ name: 'Eğitim İzni', code: 'TRAINING', color: '#4267B2' });
  assert.equal(created.status, 201, created.text);
  const updated = await admin.put(`/api/leave-types/${created.body.data.id}`).send({
    name: 'Eğitim ve Seminer İzni', code: 'TRAINING', color: '#4267B2', isActive: false
  });
  assert.equal(updated.status, 200, updated.text);
  assert.equal(updated.body.data.isActive, false);
  const personnel = await login('personel@izinpro.local', 'Personel123!');
  const visibleTypes = await personnel.get('/api/leave-types');
  assert.equal(visibleTypes.body.data.some((item) => item.code === 'TRAINING'), false);
});

test('dashboard sayaçları doğrudan veritabanındaki kayıtları yansıtır', async () => {
  const admin = await login('admin@izinpro.local', 'Admin123!');
  const summary = await admin.get('/api/dashboard/summary');
  const expectedUsers = getDatabase().prepare('SELECT COUNT(*) AS count FROM users WHERE is_active = 1').get().count;
  const expectedPending = getDatabase().prepare("SELECT COUNT(*) AS count FROM leave_requests WHERE status = 'PENDING'").get().count;
  assert.equal(summary.body.data.users, expectedUsers);
  assert.equal(summary.body.data.pending, expectedPending);
});

test('logout oturumu geçersiz kılar', async () => {
  const personnel = await login('ayse@izinpro.local', 'Personel123!');
  const logout = await personnel.post('/api/auth/logout').send({});
  assert.equal(logout.status, 200);
  const me = await personnel.get('/api/auth/me');
  assert.equal(me.status, 401);
});

test('admin kullanıcı şifresini sıfırlayabilir', async () => {
  const admin = await login('admin@izinpro.local', 'Admin123!');
  const users = await admin.get('/api/users?search=deniz');
  const deniz = users.body.data[0];
  const reset = await admin.post(`/api/users/${deniz.id}/reset-password`).send({ newPassword: 'YeniDeniz123!' });
  assert.equal(reset.status, 200, reset.text);
  const loginResponse = await request(app).post('/api/auth/login').send({ email: 'deniz@izinpro.local', password: 'YeniDeniz123!' });
  assert.equal(loginResponse.status, 200, loginResponse.text);
});

test('veriler aynı SQLite dosyası yeniden açıldığında korunur', async () => {
  const before = getDatabase().prepare('SELECT COUNT(*) AS count FROM users').get().count;
  closeDatabase();
  app = createApp({ databaseFile });
  const after = getDatabase().prepare('SELECT COUNT(*) AS count FROM users').get().count;
  assert.equal(after, before);
  const health = await request(app).get('/api/health');
  assert.equal(health.status, 200);
});
