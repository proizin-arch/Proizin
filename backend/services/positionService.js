const positionRepository = require('../repositories/positionRepository');
const AppError = require('../utils/AppError');
const validate = require('../utils/validators');

async function list(activeOnly = false) {
  return positionRepository.list(activeOnly);
}

async function create(input) {
  const name = validate.requiredText(input.name, 'Pozisyon adı', { min: 2, max: 100 });
  if (await positionRepository.findByName(name)) throw new AppError('Bu pozisyon zaten bulunuyor.', 409);
  return positionRepository.create(name);
}

async function update(idInput, input) {
  const id = validate.positiveInteger(idInput, 'Pozisyon');
  if (!await positionRepository.findById(id)) throw new AppError('Pozisyon bulunamadı.', 404);
  const name = validate.requiredText(input.name, 'Pozisyon adı', { min: 2, max: 100 });
  const duplicate = await positionRepository.findByName(name);
  if (duplicate && duplicate.id !== id) throw new AppError('Bu pozisyon zaten bulunuyor.', 409);
  return positionRepository.update(id, name);
}

async function setStatus(idInput, active) {
  const id = validate.positiveInteger(idInput, 'Pozisyon');
  const isActive = validate.boolean(active, 'Pozisyon durumu');
  if (!await positionRepository.findById(id)) throw new AppError('Pozisyon bulunamadı.', 404);
  return positionRepository.setActive(id, isActive);
}

async function remove(idInput) {
  const id = validate.positiveInteger(idInput, 'Pozisyon');
  const position = await positionRepository.findById(id);
  if (!position) throw new AppError('Pozisyon bulunamadı.', 404);
  if (position.userCount > 0) {
    throw new AppError('Bu pozisyon kullanıcılara atanmış. Önce kullanıcıların pozisyonunu değiştirin veya pozisyonu pasifleştirin.', 409);
  }
  await positionRepository.remove(id);
}

async function getActive(idInput) {
  const id = validate.positiveInteger(idInput, 'Pozisyon');
  const position = await positionRepository.findById(id);
  if (!position || !position.isActive) throw new AppError('Geçerli bir pozisyon seçiniz.', 400);
  return position;
}

module.exports = { list, create, update, setStatus, remove, getActive };
