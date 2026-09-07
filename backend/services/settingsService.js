const bcrypt = require('bcrypt');
const settingsRepository = require('../repositories/settingsRepository');
const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/AppError');
const validate = require('../utils/validators');

async function status() {
  const settings = await settingsRepository.get();
  return {
    isConfigured: Boolean(settings?.isConfigured),
    settings: settings ? {
      organizationName: settings.organizationName,
      loginDomain: settings.loginDomain
    } : null
  };
}

async function get() {
  return settingsRepository.get();
}

async function update(input) {
  return settingsRepository.update({
    organizationName: validate.requiredText(input.organizationName, 'Kurum adı', { min: 2, max: 100 })
  });
}

async function verifyAdminPassword(userId, password) {
  const user = await userRepository.findById(userId, true);
  if (!user || user.role !== 'ADMIN' || !(await bcrypt.compare(String(password || ''), user.passwordHash))) {
    throw new AppError('Admin şifresi hatalı.', 400);
  }
}

async function clearOperations(user, password, currentSessionId) {
  await verifyAdminPassword(user.id, password);
  await settingsRepository.clearOperations(currentSessionId);
}

async function factoryReset(user, password, confirmation, currentSessionId) {
  if (String(confirmation || '').trim().toLocaleUpperCase('tr-TR') !== 'SIFIRLA') {
    throw new AppError('Onay alanına SIFIRLA yazınız.', 400);
  }
  await verifyAdminPassword(user.id, password);
  await settingsRepository.factoryReset(user.id, currentSessionId);
}

module.exports = { status, get, update, clearOperations, factoryReset };
