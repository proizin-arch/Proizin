const fs = require('node:fs');
const path = require('node:path');
const request = require('supertest');
const { createApp } = require('../backend/app');
const { closeDatabase, getDatabase } = require('../backend/config/database');

const outputArgument = process.argv[2];
if (!outputArgument) {
  console.error('Kullanim: node scripts/create-demo-database.js <cikti.db>');
  process.exit(1);
}

const databaseFile = path.resolve(outputArgument);
const relatedFiles = [databaseFile, `${databaseFile}-wal`, `${databaseFile}-shm`, `${databaseFile}.key`];
if (relatedFiles.some((file) => fs.existsSync(file))) {
  console.error(`HATA: Cikti dosyasi zaten var: ${databaseFile}`);
  process.exit(1);
}

process.env.SESSION_SECRET = 'izinpro-demo-package-session-secret';

function requireStatus(response, expected, operation) {
  if (response.status !== expected) {
    throw new Error(`${operation} basarisiz (${response.status}): ${response.text}`);
  }
  return response.body.data;
}

async function login(app, email, password) {
  const agent = request.agent(app);
  requireStatus(await agent.post('/api/auth/login').send({ email, password }), 200, `${email} girisi`);
  return agent;
}

async function createDemo() {
  fs.mkdirSync(path.dirname(databaseFile), { recursive: true });
  const app = createApp({ databaseFile });
  const admin = request.agent(app);

  requireStatus(await admin.post('/api/setup/complete').send({
    organizationName: 'İzinPro Demo Kurumu',
    firstName: 'Selenay',
    lastName: 'Yılmaz',
    position: 'Admin',
    hireDate: '2024-01-02',
    password: 'Admin123!'
  }), 201, 'Admin kurulumu');

  const department = requireStatus(
    await admin.post('/api/departments').send({ name: 'Yazılım Geliştirme' }),
    201,
    'Departman olusturma'
  );
  const managerPosition = requireStatus(
    await admin.post('/api/positions').send({ name: 'Yazılım Yöneticisi' }),
    201,
    'Yonetici pozisyonu olusturma'
  );
  const personnelPosition = requireStatus(
    await admin.post('/api/positions').send({ name: 'Yazılım Uzmanı' }),
    201,
    'Personel pozisyonu olusturma'
  );

  const manager = requireStatus(await admin.post('/api/users').send({
    firstName: 'Ali',
    lastName: 'Alaya',
    password: 'GeciciYonetici123!',
    role: 'MANAGER',
    departmentId: department.id,
    positionId: managerPosition.id,
    hireDate: '2024-02-05'
  }), 201, 'Yonetici olusturma');

  const personnel = requireStatus(await admin.post('/api/users').send({
    firstName: 'Muhammet',
    lastName: 'Ala',
    password: 'GeciciPersonel123!',
    role: 'PERSONNEL',
    departmentId: department.id,
    positionId: personnelPosition.id,
    hireDate: '2025-01-06'
  }), 201, 'Personel olusturma');

  const managerFirstLogin = await login(app, manager.email, 'GeciciYonetici123!');
  requireStatus(
    await managerFirstLogin.post('/api/auth/change-password').send({ newPassword: 'Yonetici123!' }),
    200,
    'Yonetici sifre degisimi'
  );
  const personnelFirstLogin = await login(app, personnel.email, 'GeciciPersonel123!');
  requireStatus(
    await personnelFirstLogin.post('/api/auth/change-password').send({ newPassword: 'Personel123!' }),
    200,
    'Personel sifre degisimi'
  );

  requireStatus(await admin.put(`/api/departments/${department.id}`).send({
    name: department.name,
    managerId: manager.id
  }), 200, 'Departman yoneticisi atama');

  const leaveTypes = requireStatus(await admin.get('/api/leave-types'), 200, 'Izin turlerini listeleme');
  const annualType = leaveTypes.find((item) => item.code === 'ANNUAL');
  const sickType = leaveTypes.find((item) => item.code === 'SICK');
  const personnelAgent = await login(app, personnel.email, 'Personel123!');

  const approved = requireStatus(await personnelAgent.post('/api/leave-requests').send({
    leaveTypeId: annualType.id,
    startDate: '2027-02-01',
    endDate: '2027-02-03',
    employeeComment: 'Planlı yıllık izin talebi'
  }), 201, 'Onaylanacak izin talebi');
  const rejected = requireStatus(await personnelAgent.post('/api/leave-requests').send({
    leaveTypeId: sickType.id,
    startDate: '2027-03-08',
    endDate: '2027-03-09',
    employeeComment: 'Örnek hastalık izni talebi'
  }), 201, 'Reddedilecek izin talebi');
  requireStatus(await personnelAgent.post('/api/leave-requests').send({
    leaveTypeId: annualType.id,
    startDate: '2027-04-05',
    endDate: '2027-04-07',
    employeeComment: 'Yönetici kararı bekleyen demo talebi'
  }), 201, 'Bekleyen izin talebi');

  const managerAgent = await login(app, manager.email, 'Yonetici123!');
  requireStatus(
    await managerAgent.post(`/api/leave-requests/${approved.id}/approve`).send({ managerComment: 'Plan uygundur.' }),
    200,
    'Izin onaylama'
  );
  requireStatus(
    await managerAgent.post(`/api/leave-requests/${rejected.id}/reject`).send({ managerComment: 'Belge bilgisi eksik.' }),
    200,
    'Izin reddetme'
  );

  const db = getDatabase();
  db.prepare('DELETE FROM sessions').run();
  db.pragma('wal_checkpoint(TRUNCATE)');
  if (db.pragma('integrity_check')[0].integrity_check !== 'ok') {
    throw new Error('Demo veritabani butunluk kontrolunden gecemedi.');
  }
  closeDatabase();

  if (fs.existsSync(`${databaseFile}.key`)) fs.rmSync(`${databaseFile}.key`);
  console.log(`Demo veritabani hazir: ${databaseFile}`);
  console.log('Admin: admin@izinpro.com / Admin123!');
  console.log(`Yonetici: ${manager.email} / Yonetici123!`);
  console.log(`Personel: ${personnel.email} / Personel123!`);
}

createDemo().catch((error) => {
  closeDatabase();
  relatedFiles.forEach((file) => {
    if (fs.existsSync(file)) fs.rmSync(file);
  });
  console.error(error.stack || error.message);
  process.exit(1);
});
