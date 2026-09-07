const leaveTypeService = require('../services/leaveTypeService');

async function list(req, res) {
  res.json({ success: true, data: await leaveTypeService.list(req.user.role !== 'ADMIN') });
}

async function create(req, res) {
  res.status(201).json({ success: true, data: await leaveTypeService.create(req.body) });
}

async function update(req, res) {
  res.json({ success: true, data: await leaveTypeService.update(req.params.id, req.body) });
}

async function remove(req, res) {
  await leaveTypeService.remove(req.params.id);
  res.json({ success: true, data: null, message: 'İzin türü kalıcı olarak silindi.' });
}

module.exports = { list, create, update, remove };
