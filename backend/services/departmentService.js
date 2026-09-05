const departmentRepository = require('../repositories/departmentRepository');
const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/AppError');
const validate = require('../utils/validators');

function list(activeOnly = false) {
  return departmentRepository.list(activeOnly);
}

function validateManager(managerId, departmentId) {
  if (!managerId) return null;
  const id = validate.positiveInteger(managerId, 'Yönetici');
  const manager = userRepository.findById(id);
  if (!manager || !manager.isActive || manager.role !== 'MANAGER') {
    throw new AppError('Seçilen kullanıcı aktif bir yönetici olmalıdır.', 400);
  }
  if (departmentId && manager.department?.id !== departmentId) {
    throw new AppError('Yönetici seçilen departmanda görev yapmalıdır.', 400);
  }
  return id;
}

function create(input) {
  const name = validate.requiredText(input.name, 'Departman adı', { min: 2, max: 100 });
  if (departmentRepository.findByName(name)) throw new AppError('Bu departman zaten bulunuyor.', 409);
  const department = departmentRepository.create({ name, managerId: null });
  if (input.managerId) {
    return departmentRepository.update(department.id, {
      name,
      managerId: validateManager(input.managerId, department.id)
    });
  }
  return department;
}

function update(idInput, input) {
  const id = validate.positiveInteger(idInput, 'Departman');
  const existing = departmentRepository.findById(id);
  if (!existing) throw new AppError('Departman bulunamadı.', 404);
  const name = validate.requiredText(input.name, 'Departman adı', { min: 2, max: 100 });
  const duplicate = departmentRepository.findByName(name);
  if (duplicate && duplicate.id !== id) throw new AppError('Bu departman zaten bulunuyor.', 409);
  return departmentRepository.update(id, {
    name,
    managerId: validateManager(input.managerId, id)
  });
}

function setStatus(idInput, active) {
  const id = validate.positiveInteger(idInput, 'Departman');
  const isActive = validate.boolean(active, 'Departman durumu');
  if (!departmentRepository.findById(id)) throw new AppError('Departman bulunamadı.', 404);
  return departmentRepository.setActive(id, isActive);
}

module.exports = { list, create, update, setStatus };
