const bcrypt = require('../utils/passwordHasher');
const userRepository = require('../repositories/userRepository');
const departmentRepository = require('../repositories/departmentRepository');
const positionService = require('./positionService');
const AppError = require('../utils/AppError');
const validate = require('../utils/validators');
const { generateAddress } = require('../utils/userAddress');
const credentialVault = require('../utils/credentialVault');

const ROLES = ['PERSONNEL', 'MANAGER', 'ADMIN'];

function ensureRole(role) {
  if (!ROLES.includes(role)) throw new AppError('Geçersiz kullanıcı rolü.', 400);
  return role;
}

async function ensureDepartment(departmentId, { optional = false } = {}) {
  if (optional && !departmentId) return null;
  const id = validate.positiveInteger(departmentId, 'Departman');
  const department = await departmentRepository.findById(id);
  if (!department || !department.isActive) throw new AppError('Geçerli bir departman seçiniz.', 400);
  return id;
}

async function list(requester, query) {
  return userRepository.list({
    requester,
    search: validate.optionalText(query.search, 'Arama', 100),
    departmentId: query.departmentId ? validate.positiveInteger(query.departmentId, 'Departman') : null,
    role: query.role ? ensureRole(query.role) : null,
    active: query.active === undefined ? undefined : query.active === 'true'
  });
}

async function get(requester, idInput) {
  const id = validate.positiveInteger(idInput, 'Kullanıcı');
  const user = await userRepository.findById(id);
  if (!user) throw new AppError('Kullanıcı bulunamadı.', 404);
  const allowed = requester.role === 'ADMIN' || requester.id === id ||
    (requester.role === 'MANAGER' && requester.department?.id === user.department?.id);
  if (!allowed) throw new AppError('Bu kullanıcıyı görüntüleme yetkiniz bulunmuyor.', 403);
  return user;
}

async function create(input) {
  const firstName = validate.requiredText(input.firstName, 'Ad', { min: 2, max: 60 });
  const lastName = validate.requiredText(input.lastName, 'Soyad', { min: 2, max: 60 });
  const email = await generateAddress(firstName, lastName, async (candidate) => Boolean(await userRepository.findByEmail(candidate)));
  const role = ensureRole(input.role || 'PERSONNEL');
  const position = await positionService.getActive(input.positionId);
  return userRepository.create({
    firstName,
    lastName,
    email,
    passwordHash: await bcrypt.hash(validate.password(input.password), 10),
    birthDate: validate.date(input.birthDate, 'Doğum tarihi', { optional: true }),
    phone: validate.optionalText(input.phone, 'Telefon', 30),
    address: validate.optionalText(input.address, 'Adres', 300),
    departmentId: await ensureDepartment(input.departmentId, { optional: role === 'ADMIN' }),
    position: position.name,
    positionId: position.id,
    role,
    hireDate: validate.date(input.hireDate, 'İşe giriş tarihi'),
    mustChangePassword: true,
    temporaryPasswordSecret: credentialVault.encrypt(input.password)
  });
}

async function update(requester, idInput, input) {
  const id = validate.positiveInteger(idInput, 'Kullanıcı');
  const existing = await userRepository.findById(id);
  if (!existing) throw new AppError('Kullanıcı bulunamadı.', 404);
  const role = ensureRole(input.role);
  const position = await positionService.getActive(input.positionId);
  if (requester.id === id && role !== 'ADMIN') {
    throw new AppError('Kendi admin rolünüzü kaldıramazsınız.', 409);
  }
  return userRepository.update(id, {
    firstName: validate.requiredText(input.firstName, 'Ad', { min: 2, max: 60 }),
    lastName: validate.requiredText(input.lastName, 'Soyad', { min: 2, max: 60 }),
    email: existing.email,
    birthDate: validate.date(input.birthDate, 'Doğum tarihi', { optional: true }),
    phone: validate.optionalText(input.phone, 'Telefon', 30),
    address: validate.optionalText(input.address, 'Adres', 300),
    departmentId: await ensureDepartment(input.departmentId, { optional: role === 'ADMIN' }),
    position: position.name,
    positionId: position.id,
    role,
    hireDate: validate.date(input.hireDate, 'İşe giriş tarihi')
  });
}

async function updateProfile(userId, input) {
  return userRepository.updateProfile(userId, {
    firstName: validate.requiredText(input.firstName, 'Ad', { min: 2, max: 60 }),
    lastName: validate.requiredText(input.lastName, 'Soyad', { min: 2, max: 60 }),
    phone: validate.optionalText(input.phone, 'Telefon', 30),
    address: validate.optionalText(input.address, 'Adres', 300)
  });
}

async function setStatus(requester, idInput, active) {
  const id = validate.positiveInteger(idInput, 'Kullanıcı');
  const isActive = validate.boolean(active, 'Kullanıcı durumu');
  if (requester.id === id && !isActive) throw new AppError('Kendi hesabınızı pasif yapamazsınız.', 409);
  const user = await userRepository.findById(id);
  if (!user) throw new AppError('Kullanıcı bulunamadı.', 404);
  if (!isActive && user.role === 'ADMIN' && await userRepository.countActiveAdmins() <= 1) {
    throw new AppError('Sistemdeki son aktif admin pasifleştirilemez.', 409);
  }
  return userRepository.setActive(id, isActive);
}

async function resetPassword(idInput, newPassword) {
  const id = validate.positiveInteger(idInput, 'Kullanıcı');
  if (!await userRepository.findById(id)) throw new AppError('Kullanıcı bulunamadı.', 404);
  const validated = validate.password(newPassword, 'Yeni şifre');
  await userRepository.setPassword(id, await bcrypt.hash(validated, 10), true, credentialVault.encrypt(validated));
}

async function getTemporaryCredentials(idInput) {
  const id = validate.positiveInteger(idInput, 'Kullanıcı');
  const user = await userRepository.findById(id, true);
  if (!user) throw new AppError('Kullanıcı bulunamadı.', 404);
  if (!user.mustChangePassword) throw new AppError('Bu kullanıcı geçici şifresini daha önce değiştirmiş.', 409);
  if (!user.temporaryPasswordSecret) {
    throw new AppError('Bu eski kaydın geçici şifresi görüntülenemiyor. Yeni bir geçici şifre oluşturun.', 409);
  }
  try {
    return { email: user.email, temporaryPassword: credentialVault.decrypt(user.temporaryPasswordSecret) };
  } catch (_error) {
    throw new AppError('Geçici şifre çözülemedi. Kullanıcı için yeni bir geçici şifre oluşturun.', 409);
  }
}

async function remove(requester, idInput) {
  const id = validate.positiveInteger(idInput, 'Kullanıcı');
  if (requester.id === id) throw new AppError('Kendi hesabınızı silemezsiniz.', 409);
  const user = await userRepository.findById(id);
  if (!user) throw new AppError('Kullanıcı bulunamadı.', 404);
  if (user.role === 'ADMIN' && user.isActive && await userRepository.countActiveAdmins() <= 1) {
    throw new AppError('Sistemdeki son aktif admin silinemez.', 409);
  }
  const references = await userRepository.referenceCounts(id);
  if (references.ownRequests || references.approvals || references.approvedRequests) {
    throw new AppError('Bu kullanıcının işlem geçmişi bulunuyor. Geçmişi korumak için hesabı pasifleştirin veya önce işlem verilerini temizleyin.', 409);
  }
  await userRepository.remove(id);
}

module.exports = { list, get, create, update, updateProfile, setStatus, resetPassword, getTemporaryCredentials, remove };
