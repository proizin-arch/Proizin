const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');
const departmentRepository = require('../repositories/departmentRepository');
const AppError = require('../utils/AppError');
const validate = require('../utils/validators');

async function register(input) {
  const email = validate.email(input.email);
  if (userRepository.findByEmail(email)) {
    throw new AppError('Bu e-posta adresi zaten kullanılıyor.', 409);
  }

  const departmentId = validate.positiveInteger(input.departmentId, 'Departman');
  const department = departmentRepository.findById(departmentId);
  if (!department || !department.isActive) {
    throw new AppError('Seçilen departman aktif değil.', 400);
  }

  const password = validate.password(input.password);
  const user = {
    firstName: validate.requiredText(input.firstName, 'Ad', { min: 2, max: 60 }),
    lastName: validate.requiredText(input.lastName, 'Soyad', { min: 2, max: 60 }),
    email,
    passwordHash: await bcrypt.hash(password, 10),
    birthDate: validate.date(input.birthDate, 'Doğum tarihi', { optional: true }),
    phone: validate.optionalText(input.phone, 'Telefon', 30),
    address: validate.optionalText(input.address, 'Adres', 300),
    departmentId,
    position: validate.requiredText(input.position, 'Pozisyon', { min: 2, max: 100 }),
    role: 'PERSONNEL',
    hireDate: validate.date(input.hireDate, 'İşe giriş tarihi')
  };
  return userRepository.create(user);
}

async function login(emailInput, passwordInput) {
  const email = validate.email(emailInput);
  const user = userRepository.findByEmail(email);
  if (!user || !(await bcrypt.compare(String(passwordInput || ''), user.passwordHash))) {
    throw new AppError('E-posta veya şifre hatalı.', 401);
  }
  if (!user.isActive) {
    throw new AppError('Hesabınız pasif durumda. Yöneticiyle iletişime geçiniz.', 403);
  }
  delete user.passwordHash;
  return user;
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = userRepository.findById(userId, true);
  if (!user || !(await bcrypt.compare(String(currentPassword || ''), user.passwordHash))) {
    throw new AppError('Mevcut şifreniz hatalı.', 400);
  }
  const validated = validate.password(newPassword, 'Yeni şifre');
  if (await bcrypt.compare(validated, user.passwordHash)) {
    throw new AppError('Yeni şifre mevcut şifreden farklı olmalıdır.', 400);
  }
  userRepository.setPassword(userId, await bcrypt.hash(validated, 10));
}

module.exports = { register, login, changePassword };
