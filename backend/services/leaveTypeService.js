const leaveTypeRepository = require('../repositories/leaveTypeRepository');
const AppError = require('../utils/AppError');
const validate = require('../utils/validators');

function normalize(input) {
  const code = validate.requiredText(input.code, 'İzin türü kodu', { min: 2, max: 30 }).toUpperCase();
  if (!/^[A-Z_]+$/.test(code)) throw new AppError('İzin türü kodu yalnızca harf ve alt çizgi içerebilir.', 400);
  const color = String(input.color || '#3977D3').toUpperCase();
  if (!/^#[0-9A-F]{6}$/.test(color)) throw new AppError('Geçerli bir renk kodu giriniz.', 400);
  return {
    name: validate.requiredText(input.name, 'İzin türü adı', { min: 2, max: 80 }),
    code,
    color,
    isActive: input.isActive !== false
  };
}

function list(activeOnly = false) {
  return leaveTypeRepository.list(activeOnly);
}

function create(input) {
  const data = normalize(input);
  if (leaveTypeRepository.findByCode(data.code)) throw new AppError('Bu izin türü kodu zaten kullanılıyor.', 409);
  return leaveTypeRepository.create(data);
}

function update(idInput, input) {
  const id = validate.positiveInteger(idInput, 'İzin türü');
  if (!leaveTypeRepository.findById(id)) throw new AppError('İzin türü bulunamadı.', 404);
  const data = normalize(input);
  const duplicate = leaveTypeRepository.findByCode(data.code);
  if (duplicate && duplicate.id !== id) throw new AppError('Bu izin türü kodu zaten kullanılıyor.', 409);
  return leaveTypeRepository.update(id, data);
}

module.exports = { list, create, update };
