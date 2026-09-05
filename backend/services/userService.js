const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');
const departmentRepository = require('../repositories/departmentRepository');
const AppError = require('../utils/AppError');
const validate = require('../utils/validators');

const ROLES = ['PERSONNEL', 'MANAGER', 'ADMIN'];

function ensureRole(role) {
  if (!ROLES.includes(role)) throw new AppError('Geçersiz kullanıcı rolü.', 400);
  return role;
}

function ensureDepartment(departmentId, { optional = false } = {}) {
  if (optional && !departmentId) return null;
  const id = validate.positiveInteger(departmentId, 'Departman');
  const department = departmentRepository.findById(id);
  if (!department || !department.isActive) throw new AppError('Geçerli bir departman seçiniz.', 400);
  return id;
}

function list(requester, query) {
  return userRepository.list({
    requester,
    search: validate.optionalText(query.search, 'Arama', 100),
    departmentId: query.departmentId ? validate.positiveInteger(query.departmentId, 'Departman') : null,
    role: query.role ? ensureRole(query.role) : null,
    active: query.active === undefined ? undefined : query.active === 'true'
  });
}

function get(requester, idInput) {
  const id = validate.positiveInteger(idInput, 'Kullanıcı');
  const user = userRepository.findById(id);
  if (!user) throw new AppError('Kullanıcı bulunamadı.', 404);
  const allowed = requester.role === 'ADMIN' || requester.id === id ||
    (requester.role === 'MANAGER' && requester.department?.id === user.department?.id);
  if (!allowed) throw new AppError('Bu kullanıcıyı görüntüleme yetkiniz bulunmuyor.', 403);
  return user;
}

async function create(input) {
  const email = validate.email(input.email);
  if (userRepository.findByEmail(email)) throw new AppError('Bu e-posta adresi zaten kullanılıyor.', 409);
  const role = ensureRole(input.role || 'PERSONNEL');
  return userRepository.create({
    firstName: validate.requiredText(input.firstName, 'Ad', { min: 2, max: 60 }),
    lastName: validate.requiredText(input.lastName, 'Soyad', { min: 2, max: 60 }),
    email,
    passwordHash: await bcrypt.hash(validate.password(input.password), 10),
    birthDate: validate.date(input.birthDate, 'Doğum tarihi', { optional: true }),
    phone: validate.optionalText(input.phone, 'Telefon', 30),
    address: validate.optionalText(input.address, 'Adres', 300),
    departmentId: ensureDepartment(input.departmentId, { optional: role === 'ADMIN' }),
    position: validate.requiredText(input.position, 'Pozisyon', { min: 2, max: 100 }),
    role,
    hireDate: validate.date(input.hireDate, 'İşe giriş tarihi')
  });
}

function update(requester, idInput, input) {
  const id = validate.positiveInteger(idInput, 'Kullanıcı');
  const existing = userRepository.findById(id);
  if (!existing) throw new AppError('Kullanıcı bulunamadı.', 404);
  const email = validate.email(input.email);
  const duplicate = userRepository.findByEmail(email);
  if (duplicate && duplicate.id !== id) throw new AppError('Bu e-posta adresi zaten kullanılıyor.', 409);
  const role = ensureRole(input.role);
  if (requester.id === id && role !== 'ADMIN') {
    throw new AppError('Kendi admin rolünüzü kaldıramazsınız.', 409);
  }
  return userRepository.update(id, {
    firstName: validate.requiredText(input.firstName, 'Ad', { min: 2, max: 60 }),
    lastName: validate.requiredText(input.lastName, 'Soyad', { min: 2, max: 60 }),
    email,
    birthDate: validate.date(input.birthDate, 'Doğum tarihi', { optional: true }),
    phone: validate.optionalText(input.phone, 'Telefon', 30),
    address: validate.optionalText(input.address, 'Adres', 300),
    departmentId: ensureDepartment(input.departmentId, { optional: role === 'ADMIN' }),
    position: validate.requiredText(input.position, 'Pozisyon', { min: 2, max: 100 }),
    role,
    hireDate: validate.date(input.hireDate, 'İşe giriş tarihi')
  });
}

function updateProfile(userId, input) {
  return userRepository.updateProfile(userId, {
    phone: validate.optionalText(input.phone, 'Telefon', 30),
    address: validate.optionalText(input.address, 'Adres', 300)
  });
}

function setStatus(requester, idInput, active) {
  const id = validate.positiveInteger(idInput, 'Kullanıcı');
  const isActive = validate.boolean(active, 'Kullanıcı durumu');
  if (requester.id === id && !isActive) throw new AppError('Kendi hesabınızı pasif yapamazsınız.', 409);
  if (!userRepository.findById(id)) throw new AppError('Kullanıcı bulunamadı.', 404);
  return userRepository.setActive(id, isActive);
}

async function resetPassword(idInput, newPassword) {
  const id = validate.positiveInteger(idInput, 'Kullanıcı');
  if (!userRepository.findById(id)) throw new AppError('Kullanıcı bulunamadı.', 404);
  userRepository.setPassword(id, await bcrypt.hash(validate.password(newPassword, 'Yeni şifre'), 10));
}

module.exports = { list, get, create, update, updateProfile, setStatus, resetPassword };
