const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/AppError');
const validate = require('../utils/validators');

async function login(emailInput, passwordInput) {
  const email = validate.email(emailInput);
  const user = await userRepository.findByEmail(email);
  if (!user || !(await bcrypt.compare(String(passwordInput || ''), user.passwordHash))) {
    throw new AppError('Kullanıcı adresi veya şifre hatalı.', 401);
  }
  if (!user.isActive) {
    throw new AppError('Hesabınız pasif durumda. Yöneticiyle iletişime geçiniz.', 403);
  }
  delete user.passwordHash;
  delete user.temporaryPasswordSecret;
  return user;
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await userRepository.findById(userId, true);
  if (!user) throw new AppError('Kullanıcı bulunamadı.', 404);
  if (!user.mustChangePassword && !(await bcrypt.compare(String(currentPassword || ''), user.passwordHash))) {
    throw new AppError('Mevcut şifreniz hatalı.', 400);
  }
  const validated = validate.password(newPassword, 'Yeni şifre');
  if (await bcrypt.compare(validated, user.passwordHash)) {
    throw new AppError('Yeni şifre mevcut şifreden farklı olmalıdır.', 400);
  }
  await userRepository.setPassword(userId, await bcrypt.hash(validated, 10), false);
}

module.exports = { login, changePassword };
