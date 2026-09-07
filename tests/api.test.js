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

const credentials = {
  admin: ['admin@izinpro.com', 'Admin123!'],
  manager: ['mehmet.kaya@izinpro.com', 'Manager123!'],
  personnel: ['ayse.isik@izinpro.com', 'Personel123!']
};

let app;
let softwareDepartmentId;
let managerId;
let personnelId;
let annualTypeId;
let managerPositionId;
let employeePositionId;

test.before(() => { app = createApp({ databaseFile }); });
test.after(() => {
  closeDatabase();
  fs.rmSync(tempDirectory, { recursive: true, force: true });
});

async function login(email, password) {
  const agent = request.agent(app);
  const response = await agent.post('/api/auth/login').send({ email, password });
  assert.equal(response.status, 200, response.text);
  return { agent, user: response.body.data };
}

test('boş veritabanı ilk kurulum ekranıyla açılır ve dış kayıt kapalıdır', async () => {
  const status = await request(app).get('/api/setup/status');
  assert.equal(status.status, 200);
  assert.equal(status.body.data.isConfigured, false);
  assert.equal(status.body.data.settings.loginDomain, 'izinpro.com');

  const root = await request(app).get('/');
  assert.equal(root.status, 200);
  assert.match(root.text, /İLK KURULUM/);

  const registerPage = await request(app).get('/register.html');
  assert.equal(registerPage.status, 302);
  const registerApi = await request(app).post('/api/auth/register').send({});
  assert.equal(registerApi.status, 404);
  assert.match(registerApi.body.message, /yalnızca admin/i);

  const unauthorized = await request(app).get('/api/users');
  assert.equal(unauthorized.status, 401);
  assert.equal(getDatabase().prepare('SELECT COUNT(*) AS count FROM users').get().count, 0);
  assert.equal(getDatabase().prepare('SELECT COUNT(*) AS count FROM leave_requests').get().count, 0);
});

test('ilk kurulum gerçek admini oluşturur ve örnek veri üretmez', async () => {
  const agent = request.agent(app);
  const response = await agent.post('/api/setup/complete').send({
    organizationName: 'Şirin Teknoloji',
    firstName: 'Enes',
    lastName: 'Şirin',
    position: 'Admin',
    hireDate: '2026-09-05',
    password: 'Admin123!'
  });
  assert.equal(response.status, 201, response.text);
  assert.equal(response.body.data.email, 'admin@izinpro.com');
  assert.equal(response.body.data.role, 'ADMIN');
  assert.equal(response.body.data.mustChangePassword, false);

  const row = getDatabase().prepare('SELECT password_hash FROM users WHERE email = ?').get(credentials.admin[0]);
  assert.match(row.password_hash, /^(?:\$2[aby]\$|pbkdf2-sha256\$)/);
  assert.notEqual(row.password_hash, credentials.admin[1]);
  assert.equal(getDatabase().prepare('SELECT COUNT(*) AS count FROM departments').get().count, 0);
  assert.equal(getDatabase().prepare('SELECT COUNT(*) AS count FROM positions').get().count, 1);
  assert.equal(getDatabase().prepare('SELECT COUNT(*) AS count FROM leave_requests').get().count, 0);
  assert.equal(getDatabase().prepare('SELECT COUNT(*) AS count FROM leave_types').get().count, 5);

  const repeated = await request(app).post('/api/setup/complete').send({
    organizationName: 'Başka Kurum', firstName: 'Başka', lastName: 'Admin',
    position: 'Admin', hireDate: '2026-09-05', password: 'Other123!'
  });
  assert.equal(repeated.status, 409);
});

test('admin kurum ayarlarını ve departmanları dinamik yönetir', async () => {
  const { agent } = await login(...credentials.admin);
  const settings = await agent.put('/api/settings').send({ organizationName: 'İzinPro Demo Kurumu' });
  assert.equal(settings.status, 200, settings.text);
  assert.equal(settings.body.data.organizationName, 'İzinPro Demo Kurumu');

  const software = await agent.post('/api/departments').send({ name: 'Yazılım Geliştirme' });
  assert.equal(software.status, 201, software.text);
  softwareDepartmentId = software.body.data.id;
  const hr = await agent.post('/api/departments').send({ name: 'İnsan Kaynakları' });
  assert.equal(hr.status, 201, hr.text);

  const duplicate = await agent.post('/api/departments').send({ name: 'yazılım geliştirme' });
  assert.equal(duplicate.status, 409);

  const managerPosition = await agent.post('/api/positions').send({ name: 'Yazılım Yöneticisi' });
  assert.equal(managerPosition.status, 201, managerPosition.text);
  managerPositionId = managerPosition.body.data.id;
  const employeePosition = await agent.post('/api/positions').send({ name: 'Yazılım Uzmanı' });
  assert.equal(employeePosition.status, 201, employeePosition.text);
  employeePositionId = employeePosition.body.data.id;
  const duplicatePosition = await agent.post('/api/positions').send({ name: 'yazılım uzmanı' });
  assert.equal(duplicatePosition.status, 409);
});

test('kullanıcı adresi ad-soyaddan üretilir, çakışmada sayı eklenir ve departman doğrulanır', async () => {
  const { agent } = await login(...credentials.admin);
  const withoutDepartment = await agent.post('/api/users').send({
    firstName: 'Eksik', lastName: 'Kullanıcı', email: 'manuel@baska.com',
    password: 'Eksik123!', role: 'PERSONNEL', positionId: employeePositionId, hireDate: '2026-01-01'
  });
  assert.equal(withoutDepartment.status, 400);

  const manager = await agent.post('/api/users').send({
    firstName: 'Mehmet', lastName: 'Kaya', email: 'degistirilemez@baska.com',
    password: 'Manager123!', role: 'MANAGER', departmentId: softwareDepartmentId,
    positionId: managerPositionId, hireDate: '2024-01-08'
  });
  assert.equal(manager.status, 201, manager.text);
  assert.equal(manager.body.data.email, 'mehmet.kaya@izinpro.com');
  assert.equal(manager.body.data.mustChangePassword, true);
  assert.equal(manager.body.data.temporaryPasswordAvailable, true);
  managerId = manager.body.data.id;
  const managerSecret = getDatabase().prepare('SELECT temporary_password_secret FROM users WHERE id = ?').get(managerId);
  assert.ok(managerSecret.temporary_password_secret);
  assert.notEqual(managerSecret.temporary_password_secret, credentials.manager[1]);
  const managerCredentials = await agent.get(`/api/users/${managerId}/temporary-credentials`);
  assert.equal(managerCredentials.status, 200, managerCredentials.text);
  assert.deepEqual(managerCredentials.body.data, {
    email: credentials.manager[0], temporaryPassword: credentials.manager[1]
  });

  const personnel = await agent.post('/api/users').send({
    firstName: 'Ayşe', lastName: 'Işık', password: 'Personel123!',
    role: 'PERSONNEL', departmentId: softwareDepartmentId,
    positionId: employeePositionId, hireDate: '2025-02-03'
  });
  assert.equal(personnel.status, 201, personnel.text);
  assert.equal(personnel.body.data.email, 'ayse.isik@izinpro.com');
  personnelId = personnel.body.data.id;

  const duplicateName = await agent.post('/api/users').send({
    firstName: 'Ayşe', lastName: 'Işık', password: 'Duplicate123!',
    role: 'PERSONNEL', departmentId: softwareDepartmentId,
    positionId: employeePositionId, hireDate: '2026-02-03'
  });
  assert.equal(duplicateName.body.data.email, 'ayse.isik2@izinpro.com');
  const removed = await agent.delete(`/api/users/${duplicateName.body.data.id}`);
  assert.equal(removed.status, 200, removed.text);
  assert.equal(getDatabase().prepare('SELECT id FROM users WHERE id = ?').get(duplicateName.body.data.id), undefined);
});

test('geçici şifre değiştirilmeden korumalı ekranlar kullanılamaz', async () => {
  const { agent, user } = await login(...credentials.manager);
  assert.equal(user.mustChangePassword, true);
  const blocked = await agent.get('/api/dashboard/summary');
  assert.equal(blocked.status, 403);
  assert.match(blocked.body.message, /geçici şifrenizi değiştir/i);

  const changed = await agent.post('/api/auth/change-password').send({
    newPassword: 'ManagerYeni123!'
  });
  assert.equal(changed.status, 200, changed.text);
  credentials.manager[1] = 'ManagerYeni123!';
  assert.equal(getDatabase().prepare('SELECT temporary_password_secret FROM users WHERE id = ?').get(managerId).temporary_password_secret, null);
  const summary = await agent.get('/api/dashboard/summary');
  assert.equal(summary.status, 200);

  const withoutCurrentPassword = await agent.post('/api/auth/change-password').send({ newPassword: 'ManagerAgain123!' });
  assert.equal(withoutCurrentPassword.status, 400);

  const adminLogin = await login(...credentials.admin);
  const hiddenCredentials = await adminLogin.agent.get(`/api/users/${managerId}/temporary-credentials`);
  assert.equal(hiddenCredentials.status, 409);

  const personnelLogin = await login(...credentials.personnel);
  const changedPersonnel = await personnelLogin.agent.post('/api/auth/change-password').send({
    newPassword: 'PersonelYeni123!'
  });
  assert.equal(changedPersonnel.status, 200, changedPersonnel.text);
  credentials.personnel[1] = 'PersonelYeni123!';
});

test('kullanıcı profilindeki ad ve soyad kalıcı olarak güncellenir', async () => {
  const { agent } = await login(...credentials.personnel);
  const updated = await agent.patch('/api/users/profile').send({
    firstName: 'Ayşenur', lastName: 'Işık', phone: '0555 111 22 33', address: 'Ankara'
  });
  assert.equal(updated.status, 200, updated.text);
  assert.equal(updated.body.data.fullName, 'Ayşenur Işık');
  assert.equal(updated.body.data.email, credentials.personnel[0]);
  const stored = getDatabase().prepare('SELECT first_name, last_name FROM users WHERE id = ?').get(personnelId);
  assert.deepEqual(stored, { first_name: 'Ayşenur', last_name: 'Işık' });
});

test('yönetici departmana atanır; yönetici ve admin kendi izinlerini oluşturabilir', async () => {
  const { agent: admin } = await login(...credentials.admin);
  const assigned = await admin.put(`/api/departments/${softwareDepartmentId}`).send({
    name: 'Yazılım Geliştirme', managerId
  });
  assert.equal(assigned.status, 200, assigned.text);
  assert.equal(assigned.body.data.managerId, managerId);

  const types = await admin.get('/api/leave-types');
  annualTypeId = types.body.data.find((item) => item.code === 'ANNUAL').id;
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const pastLeave = await admin.post('/api/leave-requests').send({
    leaveTypeId: annualTypeId, startDate: yesterday.toISOString().slice(0, 10),
    endDate: yesterday.toISOString().slice(0, 10)
  });
  assert.equal(pastLeave.status, 400);
  assert.match(pastLeave.body.message, /Geçmiş tarih/);
  const reversedLeave = await admin.post('/api/leave-requests').send({
    leaveTypeId: annualTypeId, startDate: '2099-05-10', endDate: '2099-05-09'
  });
  assert.equal(reversedLeave.status, 400);
  assert.match(reversedLeave.body.message, /Bitiş tarihi başlangıç tarihinden önce/);
  const adminLeave = await admin.post('/api/leave-requests').send({
    leaveTypeId: annualTypeId, startDate: '2027-01-04', endDate: '2027-01-05',
    employeeComment: 'Admin kişisel izin talebi'
  });
  assert.equal(adminLeave.status, 201, adminLeave.text);
  assert.equal(adminLeave.body.data.userId, 1);

  const { agent: manager } = await login(...credentials.manager);
  const managerLeave = await manager.post('/api/leave-requests').send({
    leaveTypeId: annualTypeId, startDate: '2027-02-01', endDate: '2027-02-03',
    employeeComment: 'Yönetici kişisel izin talebi'
  });
  assert.equal(managerLeave.status, 201, managerLeave.text);
  const mine = await manager.get('/api/leave-requests?scope=mine');
  assert.ok(mine.body.data.some((item) => item.id === managerLeave.body.data.id));
  const team = await manager.get('/api/leave-requests?scope=team');
  assert.equal(team.body.data.some((item) => item.id === managerLeave.body.data.id), false);
});

test('personel talebi departman yöneticisine görünür; kendi talebi onaylanamaz', async () => {
  const { agent: personnel } = await login(...credentials.personnel);
  const leave = await personnel.post('/api/leave-requests').send({
    leaveTypeId: annualTypeId, startDate: '2027-03-08', endDate: '2027-03-10',
    employeeComment: 'Personel izin talebi'
  });
  assert.equal(leave.status, 201, leave.text);

  const { agent: manager } = await login(...credentials.manager);
  const team = await manager.get('/api/leave-requests?scope=team');
  assert.ok(team.body.data.some((item) => item.id === leave.body.data.id));
  const approved = await manager.post(`/api/leave-requests/${leave.body.data.id}/approve`).send({ managerComment: 'Uygundur.' });
  assert.equal(approved.status, 200, approved.text);
  assert.equal(approved.body.data.status, 'APPROVED');

  const own = await manager.get('/api/leave-requests?scope=mine');
  const ownRequest = own.body.data[0];
  const selfDecision = await manager.post(`/api/leave-requests/${ownRequest.id}/approve`).send({});
  assert.equal(selfDecision.status, 403);
  const allForbidden = await manager.get('/api/leave-requests?scope=all');
  assert.equal(allForbidden.status, 403);
});

test('talep sahibi bekleyen talebini siler; yönetici ve admin başkasının talebini iptal durumuna getirir', async () => {
  const { agent: personnel } = await login(...credentials.personnel);
  const removable = await personnel.post('/api/leave-requests').send({
    leaveTypeId: annualTypeId, startDate: '2027-04-05', endDate: '2027-04-06',
    employeeComment: 'Personelin sileceği talep'
  });
  assert.equal(removable.status, 201, removable.text);

  const personnelCannotCancel = await personnel.patch(`/api/leave-requests/${removable.body.data.id}/cancel`);
  assert.equal(personnelCannotCancel.status, 403);
  const removed = await personnel.delete(`/api/leave-requests/${removable.body.data.id}/mine`);
  assert.equal(removed.status, 200, removed.text);
  assert.equal(getDatabase().prepare('SELECT id FROM leave_requests WHERE id = ?').get(removable.body.data.id), undefined);

  const managedRequest = await personnel.post('/api/leave-requests').send({
    leaveTypeId: annualTypeId, startDate: '2027-05-03', endDate: '2027-05-04',
    employeeComment: 'Yöneticinin iptal edeceği talep'
  });
  assert.equal(managedRequest.status, 201, managedRequest.text);

  const { agent: manager } = await login(...credentials.manager);
  const managerCannotDeleteOther = await manager.delete(`/api/leave-requests/${managedRequest.body.data.id}/mine`);
  assert.equal(managerCannotDeleteOther.status, 403);
  const managerCancelled = await manager.patch(`/api/leave-requests/${managedRequest.body.data.id}/cancel`);
  assert.equal(managerCancelled.status, 200, managerCancelled.text);
  assert.equal(managerCancelled.body.data.status, 'CANCELLED');

  const adminTarget = await personnel.post('/api/leave-requests').send({
    leaveTypeId: annualTypeId, startDate: '2027-06-07', endDate: '2027-06-08',
    employeeComment: 'Adminin iptal edeceği talep'
  });
  assert.equal(adminTarget.status, 201, adminTarget.text);
  const { agent: admin } = await login(...credentials.admin);
  const adminCancelled = await admin.patch(`/api/leave-requests/${adminTarget.body.data.id}/cancel`);
  assert.equal(adminCancelled.status, 200, adminCancelled.text);
  assert.equal(adminCancelled.body.data.status, 'CANCELLED');
});

test('admin kullanıcıları ve izin taleplerini departmana göre filtreleyebilir', async () => {
  const { agent: admin } = await login(...credentials.admin);
  const users = await admin.get(`/api/users?departmentId=${softwareDepartmentId}`);
  assert.equal(users.status, 200, users.text);
  assert.ok(users.body.data.length >= 2);
  assert.ok(users.body.data.every((user) => user.department?.id === softwareDepartmentId));

  const requests = await admin.get(`/api/leave-requests?scope=all&departmentId=${softwareDepartmentId}`);
  assert.equal(requests.status, 200, requests.text);
  assert.ok(requests.body.data.length >= 2);
  assert.ok(requests.body.data.every((item) => item.department?.id === softwareDepartmentId));
});

test('admin talep ve bağlı onay geçmişini kalıcı silebilir', async () => {
  const { agent: admin } = await login(...credentials.admin);
  const all = await admin.get('/api/leave-requests?scope=all');
  const approved = all.body.data.find((item) => item.userId === personnelId && item.status === 'APPROVED');
  assert.ok(approved);
  assert.equal(getDatabase().prepare('SELECT COUNT(*) AS count FROM approval_history WHERE leave_request_id = ?').get(approved.id).count, 1);

  const removed = await admin.delete(`/api/leave-requests/${approved.id}`);
  assert.equal(removed.status, 200, removed.text);
  assert.equal(getDatabase().prepare('SELECT id FROM leave_requests WHERE id = ?').get(approved.id), undefined);
  assert.equal(getDatabase().prepare('SELECT COUNT(*) AS count FROM approval_history WHERE leave_request_id = ?').get(approved.id).count, 0);
});

test('kullanılan kayıtlar yanlışlıkla silinmez; kullanılmayan kayıtlar kalıcı silinir', async () => {
  const { agent: admin } = await login(...credentials.admin);
  const usedUser = await admin.delete(`/api/users/${managerId}`);
  assert.equal(usedUser.status, 409);

  const unusedDepartment = await admin.post('/api/departments').send({ name: 'Geçici Departman' });
  const removedDepartment = await admin.delete(`/api/departments/${unusedDepartment.body.data.id}`);
  assert.equal(removedDepartment.status, 200, removedDepartment.text);

  const unusedType = await admin.post('/api/leave-types').send({ name: 'Geçici İzin' });
  assert.equal(unusedType.body.data.code, 'GECICI_IZIN');
  assert.equal(unusedType.body.data.color, '#3977D3');
  const removedType = await admin.delete(`/api/leave-types/${unusedType.body.data.id}`);
  assert.equal(removedType.status, 200, removedType.text);

  const usedType = await admin.delete(`/api/leave-types/${annualTypeId}`);
  assert.equal(usedType.status, 409);
  const unusedPosition = await admin.post('/api/positions').send({ name: 'Geçici Pozisyon' });
  const removedPosition = await admin.delete(`/api/positions/${unusedPosition.body.data.id}`);
  assert.equal(removedPosition.status, 200, removedPosition.text);
  const usedPosition = await admin.delete(`/api/positions/${employeePositionId}`);
  assert.equal(usedPosition.status, 409);
  const ownDelete = await admin.delete('/api/users/1');
  assert.equal(ownDelete.status, 409);
});

test('admin şifre sıfırladığında kullanıcı yeniden şifre değiştirmek zorundadır', async () => {
  const { agent: admin } = await login(...credentials.admin);
  const reset = await admin.post(`/api/users/${personnelId}/reset-password`).send({ newPassword: 'YeniGecici123!' });
  assert.equal(reset.status, 200, reset.text);
  const visibleCredentials = await admin.get(`/api/users/${personnelId}/temporary-credentials`);
  assert.equal(visibleCredentials.status, 200, visibleCredentials.text);
  assert.equal(visibleCredentials.body.data.temporaryPassword, 'YeniGecici123!');

  const { agent: personnel, user } = await login(credentials.personnel[0], 'YeniGecici123!');
  assert.equal(user.mustChangePassword, true);
  const blocked = await personnel.get('/api/leave-types');
  assert.equal(blocked.status, 403);
  const changed = await personnel.post('/api/auth/change-password').send({
    newPassword: 'PersonelSon123!'
  });
  assert.equal(changed.status, 200, changed.text);
  const noLongerVisible = await admin.get(`/api/users/${personnelId}/temporary-credentials`);
  assert.equal(noLongerVisible.status, 409);
  assert.equal(getDatabase().prepare('SELECT temporary_password_secret FROM users WHERE id = ?').get(personnelId).temporary_password_secret, null);
  credentials.personnel[1] = 'PersonelSon123!';
});

test('admin, yönetici ve personel ayrı oturumlarda aynı anda çalışabilir', async () => {
  const [admin, manager, personnel] = await Promise.all([
    login(...credentials.admin), login(...credentials.manager), login(...credentials.personnel)
  ]);
  const responses = await Promise.all([
    admin.agent.get('/api/auth/me'),
    manager.agent.get('/api/auth/me'),
    personnel.agent.get('/api/auth/me')
  ]);
  assert.deepEqual(responses.map((response) => response.status), [200, 200, 200]);
  assert.deepEqual(responses.map((response) => response.body.data.role), ['ADMIN', 'MANAGER', 'PERSONNEL']);
});

test('işlem verilerini temizleme kullanıcıları ve ayarları korur', async () => {
  const { agent: admin } = await login(...credentials.admin);
  const wrong = await admin.post('/api/settings/clear-operations').send({ password: 'Wrong123!' });
  assert.equal(wrong.status, 400);
  const cleared = await admin.post('/api/settings/clear-operations').send({ password: credentials.admin[1] });
  assert.equal(cleared.status, 200, cleared.text);
  assert.equal(getDatabase().prepare('SELECT COUNT(*) AS count FROM leave_requests').get().count, 0);
  assert.equal(getDatabase().prepare('SELECT COUNT(*) AS count FROM approval_history').get().count, 0);
  assert.ok(getDatabase().prepare('SELECT COUNT(*) AS count FROM users').get().count >= 3);
  assert.equal(getDatabase().prepare('SELECT organization_name FROM app_settings WHERE id = 1').get().organization_name, 'İzinPro Demo Kurumu');
  const stillLoggedIn = await admin.get('/api/settings');
  assert.equal(stillLoggedIn.status, 200);
});

test('sistem sıfırlama işlemi mevcut admini korur ve diğer verileri temizler', async () => {
  const { agent: admin } = await login(...credentials.admin);
  const missingConfirmation = await admin.post('/api/settings/factory-reset').send({
    password: credentials.admin[1], confirmation: 'EVET'
  });
  assert.equal(missingConfirmation.status, 400);

  const reset = await admin.post('/api/settings/factory-reset').send({
    password: credentials.admin[1], confirmation: 'SIFIRLA'
  });
  assert.equal(reset.status, 200, reset.text);
  const status = await request(app).get('/api/setup/status');
  assert.equal(status.body.data.isConfigured, true);
  assert.equal(status.body.data.settings.organizationName, 'İzinPro');
  assert.equal(getDatabase().prepare('SELECT COUNT(*) AS count FROM users').get().count, 1);
  assert.equal(getDatabase().prepare('SELECT email FROM users').get().email, credentials.admin[0]);
  assert.equal(getDatabase().prepare('SELECT COUNT(*) AS count FROM departments').get().count, 0);
  assert.equal(getDatabase().prepare('SELECT COUNT(*) AS count FROM positions').get().count, 1);
  assert.equal(getDatabase().prepare('SELECT COUNT(*) AS count FROM leave_requests').get().count, 0);
  assert.equal(getDatabase().prepare('SELECT COUNT(*) AS count FROM leave_types').get().count, 5);
  const stillLoggedIn = await admin.get('/api/settings');
  assert.equal(stillLoggedIn.status, 200);
  const root = await request(app).get('/');
  assert.match(root.text, /Hesabınıza giriş yapın/);
});

test('sıfırlama sonrasında korunan admin ve veritabanı kalıcıdır', async () => {
  closeDatabase();
  app = createApp({ databaseFile });
  const row = getDatabase().prepare('SELECT email FROM users').get();
  assert.equal(row.email, 'admin@izinpro.com');
  const status = await request(app).get('/api/setup/status');
  assert.equal(status.body.data.isConfigured, true);
  assert.equal(status.body.data.settings.organizationName, 'İzinPro');
  assert.equal(getDatabase().prepare('SELECT COUNT(*) AS count FROM positions').get().count, 1);
  const { user } = await login(...credentials.admin);
  assert.equal(user.role, 'ADMIN');
  assert.equal(getDatabase().pragma('integrity_check')[0].integrity_check, 'ok');
  assert.deepEqual(getDatabase().pragma('foreign_key_check'), []);
});
