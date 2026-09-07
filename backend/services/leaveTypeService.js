const leaveTypeRepository = require('../repositories/leaveTypeRepository');
const AppError = require('../utils/AppError');
const validate = require('../utils/validators');

const trCharacters = { Ç: 'C', Ğ: 'G', İ: 'I', I: 'I', Ö: 'O', Ş: 'S', Ü: 'U' };

function codeBase(name) {
  const normalized = name.toLocaleUpperCase('tr-TR').split('').map((character) => trCharacters[character] || character).join('')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return (normalized || 'IZIN').slice(0, 30);
}

async function uniqueCode(name, currentId = null) {
  const base = codeBase(name);
  let candidate = base;
  let suffix = 2;
  while (true) {
    const duplicate = await leaveTypeRepository.findByCode(candidate);
    if (!duplicate || duplicate.id === currentId) return candidate;
    const number = `_${suffix}`;
    candidate = `${base.slice(0, 30 - number.length)}${number}`;
    suffix += 1;
  }
}

async function list(activeOnly = false) {
  return leaveTypeRepository.list(activeOnly);
}

async function create(input) {
  const name = validate.requiredText(input.name, 'İzin türü adı', { min: 2, max: 80 });
  if (await leaveTypeRepository.findByName(name)) throw new AppError('Bu izin türü zaten bulunuyor.', 409);
  return leaveTypeRepository.create({ name, code: await uniqueCode(name), color: '#3977D3' });
}

async function update(idInput, input) {
  const id = validate.positiveInteger(idInput, 'İzin türü');
  const existing = await leaveTypeRepository.findById(id);
  if (!existing) throw new AppError('İzin türü bulunamadı.', 404);
  const name = validate.requiredText(input.name, 'İzin türü adı', { min: 2, max: 80 });
  const duplicate = await leaveTypeRepository.findByName(name);
  if (duplicate && duplicate.id !== id) throw new AppError('Bu izin türü zaten bulunuyor.', 409);
  return leaveTypeRepository.update(id, {
    name,
    code: existing.code,
    color: existing.color,
    isActive: input.isActive === undefined ? existing.isActive : input.isActive !== false
  });
}

async function remove(idInput) {
  const id = validate.positiveInteger(idInput, 'İzin türü');
  if (!await leaveTypeRepository.findById(id)) throw new AppError('İzin türü bulunamadı.', 404);
  if (await leaveTypeRepository.usageCount(id) > 0) {
    throw new AppError('Bu izin türü geçmiş kayıtlarda kullanılıyor. Geçmişi korumak için pasifleştirin.', 409);
  }
  await leaveTypeRepository.remove(id);
}

module.exports = { list, create, update, remove };
