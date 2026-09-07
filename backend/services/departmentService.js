const departmentRepository = require('../repositories/departmentRepository');
const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/AppError');
const validate = require('../utils/validators');

async function list(activeOnly = false) {
  return departmentRepository.list(activeOnly);
}

async function validateManager(managerId, departmentId) {
  if (!managerId) return null;
  const id = validate.positiveInteger(managerId, 'Yönetici');
  const manager = await userRepository.findById(id);
  if (!manager || !manager.isActive || !['MANAGER', 'ADMIN'].includes(manager.role)) {
    throw new AppError('Seçilen kullanıcı aktif bir yönetici veya admin olmalıdır.', 400);
  }
  if (departmentId && manager.department?.id !== departmentId) {
    throw new AppError('Yönetici seçilen departmanda görev yapmalıdır.', 400);
  }
  return id;
}

async function create(input) {
  const name = validate.requiredText(input.name, 'Departman adı', { min: 2, max: 100 });
  if (await departmentRepository.findByName(name)) throw new AppError('Bu departman zaten bulunuyor.', 409);
  const department = await departmentRepository.create({ name, managerId: null });
  if (input.managerId) {
    return departmentRepository.update(department.id, {
      name,
      managerId: await validateManager(input.managerId, department.id)
    });
  }
  return department;
}

async function update(idInput, input) {
  const id = validate.positiveInteger(idInput, 'Departman');
  const existing = await departmentRepository.findById(id);
  if (!existing) throw new AppError('Departman bulunamadı.', 404);
  const name = validate.requiredText(input.name, 'Departman adı', { min: 2, max: 100 });
  const duplicate = await departmentRepository.findByName(name);
  if (duplicate && duplicate.id !== id) throw new AppError('Bu departman zaten bulunuyor.', 409);
  return departmentRepository.update(id, {
    name,
    managerId: await validateManager(input.managerId, id)
  });
}

async function setStatus(idInput, active) {
  const id = validate.positiveInteger(idInput, 'Departman');
  const isActive = validate.boolean(active, 'Departman durumu');
  if (!await departmentRepository.findById(id)) throw new AppError('Departman bulunamadı.', 404);
  return departmentRepository.setActive(id, isActive);
}

async function remove(idInput) {
  const id = validate.positiveInteger(idInput, 'Departman');
  const department = await departmentRepository.findById(id);
  if (!department) throw new AppError('Departman bulunamadı.', 404);
  if (await departmentRepository.userCount(id) > 0) {
    throw new AppError('Bu departmanda kullanıcılar bulunuyor. Önce kullanıcıları başka departmana taşıyın veya departmanı pasifleştirin.', 409);
  }
  await departmentRepository.remove(id);
}

module.exports = { list, create, update, setStatus, remove };
