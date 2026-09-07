const leaveRepository = require('../repositories/leaveRepository');
const leaveTypeRepository = require('../repositories/leaveTypeRepository');
const AppError = require('../utils/AppError');
const validate = require('../utils/validators');
const { calculateWorkingDays } = require('../utils/workingDays');

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
const SCOPES = ['mine', 'team', 'all'];

function todayInIstanbul() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

async function normalizeRequest(input) {
  const leaveTypeId = validate.positiveInteger(input.leaveTypeId, 'İzin türü');
  const leaveType = await leaveTypeRepository.findById(leaveTypeId);
  if (!leaveType || !leaveType.isActive) throw new AppError('Seçilen izin türü aktif değil.', 400);
  const startDate = validate.date(input.startDate, 'Başlangıç tarihi');
  const endDate = validate.date(input.endDate, 'Bitiş tarihi');
  if (startDate < todayInIstanbul()) {
    throw new AppError('Geçmiş tarih için izin talebi oluşturulamaz.', 400);
  }
  return {
    leaveTypeId,
    startDate,
    endDate,
    workingDays: calculateWorkingDays(startDate, endDate),
    employeeComment: validate.optionalText(input.employeeComment, 'Açıklama', 500)
  };
}

async function list(requester, query) {
  if (query.status && !STATUSES.includes(query.status)) throw new AppError('Geçersiz izin durumu.', 400);
  let scope = query.scope || (requester.role === 'PERSONNEL' ? 'mine' : requester.role === 'MANAGER' ? 'team' : 'all');
  if (!SCOPES.includes(scope)) throw new AppError('Geçersiz talep kapsamı.', 400);
  if (requester.role === 'PERSONNEL' && scope !== 'mine') throw new AppError('Bu talep kapsamı için yetkiniz bulunmuyor.', 403);
  if (requester.role === 'MANAGER' && scope === 'all') throw new AppError('Bu talep kapsamı için yetkiniz bulunmuyor.', 403);
  return leaveRepository.list({
    requester,
    scope,
    departmentId: query.departmentId ? validate.positiveInteger(query.departmentId, 'Departman') : null,
    status: query.status || null,
    leaveTypeId: query.leaveTypeId ? validate.positiveInteger(query.leaveTypeId, 'İzin türü') : null,
    startDate: query.startDate ? validate.date(query.startDate, 'Başlangıç tarihi') : null,
    endDate: query.endDate ? validate.date(query.endDate, 'Bitiş tarihi') : null,
    search: validate.optionalText(query.search, 'Arama', 100)
  });
}

function canView(requester, request) {
  if (requester.id === request.userId) return true;
  if (requester.role === 'ADMIN') return true;
  if (requester.role === 'PERSONNEL') return false;
  return requester.department?.id === request.department?.id && requester.id !== request.userId;
}

async function get(requester, idInput) {
  const id = validate.positiveInteger(idInput, 'İzin talebi');
  const request = await leaveRepository.findById(id);
  if (!request) throw new AppError('İzin talebi bulunamadı.', 404);
  if (!canView(requester, request)) throw new AppError('Bu izin talebini görüntüleme yetkiniz bulunmuyor.', 403);
  return request;
}

async function create(user, input) {
  const data = await normalizeRequest(input);
  if (await leaveRepository.hasOverlap(user.id, data.startDate, data.endDate)) {
    throw new AppError('Bu tarih aralığıyla çakışan başka bir izin talebiniz bulunuyor.', 409);
  }
  return leaveRepository.create({ ...data, userId: user.id });
}

async function update(user, idInput, input) {
  const id = validate.positiveInteger(idInput, 'İzin talebi');
  const request = await leaveRepository.findById(id);
  if (!request) throw new AppError('İzin talebi bulunamadı.', 404);
  if (request.userId !== user.id) throw new AppError('Yalnızca kendi izin talebinizi değiştirebilirsiniz.', 403);
  if (request.status !== 'PENDING') throw new AppError('Yalnızca bekleyen talepler değiştirilebilir.', 409);
  const data = await normalizeRequest(input);
  if (await leaveRepository.hasOverlap(user.id, data.startDate, data.endDate, id)) {
    throw new AppError('Bu tarih aralığıyla çakışan başka bir izin talebiniz bulunuyor.', 409);
  }
  return leaveRepository.update(id, data);
}

async function cancel(user, idInput) {
  const id = validate.positiveInteger(idInput, 'İzin talebi');
  const request = await leaveRepository.findById(id);
  if (!request) throw new AppError('İzin talebi bulunamadı.', 404);
  if (!['MANAGER', 'ADMIN'].includes(user.role)) throw new AppError('Bu işlem için yetkiniz bulunmuyor.', 403);
  if (request.userId === user.id) throw new AppError('Kendi izin talebinizi iptal etmek yerine silebilirsiniz.', 403);
  if (user.role === 'MANAGER' && user.department?.id !== request.department?.id) {
    throw new AppError('Yalnızca kendi departmanınızdaki talepleri iptal edebilirsiniz.', 403);
  }
  if (request.status !== 'PENDING') throw new AppError('Yalnızca bekleyen talepler iptal edilebilir.', 409);
  return leaveRepository.cancel(id);
}

async function removeOwn(user, idInput) {
  const id = validate.positiveInteger(idInput, 'İzin talebi');
  const request = await leaveRepository.findById(id);
  if (!request) throw new AppError('İzin talebi bulunamadı.', 404);
  if (request.userId !== user.id) throw new AppError('Yalnızca kendi izin talebinizi silebilirsiniz.', 403);
  if (request.status !== 'PENDING') throw new AppError('Yalnızca bekleyen talepler silinebilir.', 409);
  await leaveRepository.remove(id);
}

async function decide(user, idInput, decision, input) {
  const id = validate.positiveInteger(idInput, 'İzin talebi');
  const request = await leaveRepository.findById(id);
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

async function history(requester) {
  const scope = requester.role === 'PERSONNEL' ? 'mine' : requester.role === 'MANAGER' ? 'team' : 'all';
  return leaveRepository.history({ requester, scope });
}

async function remove(user, idInput) {
  const id = validate.positiveInteger(idInput, 'İzin talebi');
  if (user.role !== 'ADMIN') throw new AppError('Bu işlem için yetkiniz bulunmuyor.', 403);
  const request = await leaveRepository.findById(id);
  if (!request) throw new AppError('İzin talebi bulunamadı.', 404);
  await leaveRepository.remove(id);
}

module.exports = { list, get, create, update, cancel, removeOwn, decide, history, remove };
