const leaveRepository = require('../repositories/leaveRepository');
const leaveTypeRepository = require('../repositories/leaveTypeRepository');
const AppError = require('../utils/AppError');
const validate = require('../utils/validators');
const { calculateWorkingDays } = require('../utils/workingDays');

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

function normalizeRequest(input) {
  const leaveTypeId = validate.positiveInteger(input.leaveTypeId, 'İzin türü');
  const leaveType = leaveTypeRepository.findById(leaveTypeId);
  if (!leaveType || !leaveType.isActive) throw new AppError('Seçilen izin türü aktif değil.', 400);
  const startDate = validate.date(input.startDate, 'Başlangıç tarihi');
  const endDate = validate.date(input.endDate, 'Bitiş tarihi');
  return {
    leaveTypeId,
    startDate,
    endDate,
    workingDays: calculateWorkingDays(startDate, endDate),
    employeeComment: validate.optionalText(input.employeeComment, 'Açıklama', 500)
  };
}

function list(requester, query) {
  if (query.status && !STATUSES.includes(query.status)) throw new AppError('Geçersiz izin durumu.', 400);
  return leaveRepository.list({
    requester,
    status: query.status || null,
    leaveTypeId: query.leaveTypeId ? validate.positiveInteger(query.leaveTypeId, 'İzin türü') : null,
    startDate: query.startDate ? validate.date(query.startDate, 'Başlangıç tarihi') : null,
    endDate: query.endDate ? validate.date(query.endDate, 'Bitiş tarihi') : null,
    search: validate.optionalText(query.search, 'Arama', 100)
  });
}

function canView(requester, request) {
  if (requester.role === 'ADMIN') return true;
  if (requester.role === 'PERSONNEL') return requester.id === request.userId;
  return requester.department?.id === request.department?.id && requester.id !== request.userId;
}

function get(requester, idInput) {
  const id = validate.positiveInteger(idInput, 'İzin talebi');
  const request = leaveRepository.findById(id);
  if (!request) throw new AppError('İzin talebi bulunamadı.', 404);
  if (!canView(requester, request)) throw new AppError('Bu izin talebini görüntüleme yetkiniz bulunmuyor.', 403);
  return request;
}

function create(user, input) {
  const data = normalizeRequest(input);
  if (leaveRepository.hasOverlap(user.id, data.startDate, data.endDate)) {
    throw new AppError('Bu tarih aralığıyla çakışan başka bir izin talebiniz bulunuyor.', 409);
  }
  return leaveRepository.create({ ...data, userId: user.id });
}

function update(user, idInput, input) {
  const id = validate.positiveInteger(idInput, 'İzin talebi');
  const request = leaveRepository.findById(id);
  if (!request) throw new AppError('İzin talebi bulunamadı.', 404);
  if (request.userId !== user.id) throw new AppError('Yalnızca kendi izin talebinizi değiştirebilirsiniz.', 403);
  if (request.status !== 'PENDING') throw new AppError('Yalnızca bekleyen talepler değiştirilebilir.', 409);
  const data = normalizeRequest(input);
  if (leaveRepository.hasOverlap(user.id, data.startDate, data.endDate, id)) {
    throw new AppError('Bu tarih aralığıyla çakışan başka bir izin talebiniz bulunuyor.', 409);
  }
  return leaveRepository.update(id, data);
}

function cancel(user, idInput) {
  const id = validate.positiveInteger(idInput, 'İzin talebi');
  const request = leaveRepository.findById(id);
  if (!request) throw new AppError('İzin talebi bulunamadı.', 404);
  if (request.userId !== user.id) throw new AppError('Yalnızca kendi izin talebinizi iptal edebilirsiniz.', 403);
  if (request.status !== 'PENDING') throw new AppError('Yalnızca bekleyen talepler iptal edilebilir.', 409);
  return leaveRepository.cancel(id);
}

function decide(user, idInput, decision, input) {
  const id = validate.positiveInteger(idInput, 'İzin talebi');
  const request = leaveRepository.findById(id);
  if (!request) throw new AppError('İzin talebi bulunamadı.', 404);
  if (request.status !== 'PENDING') throw new AppError('Yalnızca bekleyen talepler için karar verilebilir.', 409);
  if (user.id === request.userId) throw new AppError('Kendi izin talebiniz için karar veremezsiniz.', 403);
  if (user.role === 'MANAGER' && user.department?.id !== request.department?.id) {
    throw new AppError('Yalnızca kendi departmanınızdaki talepleri yönetebilirsiniz.', 403);
  }
  const comment = validate.optionalText(input.managerComment, 'Yönetici açıklaması', 500);
  if (decision === 'REJECTED' && !comment) throw new AppError('Red işlemi için açıklama yazınız.', 400);
  return leaveRepository.decide(id, user.id, decision, comment);
}

function history(requester) {
  return leaveRepository.history({ requester });
}

module.exports = { list, get, create, update, cancel, decide, history };
