const bcrypt = require('bcrypt');
const settingsRepository = require('../repositories/settingsRepository');
const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/AppError');
const validate = require('../utils/validators');

async function complete(input) {
  const current = await settingsRepository.get();
  if (current?.isConfigured) throw new AppError('İlk kurulum daha önce tamamlanmış.', 409);

  const firstName = validate.requiredText(input.firstName, 'Ad', { min: 2, max: 60 });
  const lastName = validate.requiredText(input.lastName, 'Soyad', { min: 2, max: 60 });
  const password = validate.password(input.password, 'Admin şifresi');
  const email = 'admin@izinpro.com';
  const userId = await settingsRepository.completeSetup({
    organizationName: validate.requiredText(input.organizationName, 'Kurum adı', { min: 2, max: 100 }),
    firstName,
    lastName,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    position: validate.optionalText(input.position, 'Pozisyon', 100) || 'Admin',
    hireDate: validate.date(input.hireDate, 'İşe giriş tarihi')
  });
  if (!userId) throw new AppError('İlk kurulum başka bir oturumda tamamlanmış.', 409);
  return userRepository.findById(userId);
}

module.exports = { complete };
