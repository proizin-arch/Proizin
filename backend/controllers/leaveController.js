const leaveService = require('../services/leaveService');

async function list(req, res) {
  res.json({ success: true, data: await leaveService.list(req.user, req.query) });
}

async function get(req, res) {
  res.json({ success: true, data: await leaveService.get(req.user, req.params.id) });
}

async function create(req, res) {
  res.status(201).json({ success: true, data: await leaveService.create(req.user, req.body) });
}

async function update(req, res) {
  res.json({ success: true, data: await leaveService.update(req.user, req.params.id, req.body) });
}

async function cancel(req, res) {
  res.json({ success: true, data: await leaveService.cancel(req.user, req.params.id) });
}

async function removeOwn(req, res) {
  await leaveService.removeOwn(req.user, req.params.id);
  res.json({ success: true, data: null, message: 'İzin talebiniz kalıcı olarak silindi.' });
}

async function approve(req, res) {
  res.json({ success: true, data: await leaveService.decide(req.user, req.params.id, 'APPROVED', req.body) });
}

async function reject(req, res) {
  res.json({ success: true, data: await leaveService.decide(req.user, req.params.id, 'REJECTED', req.body) });
}

async function history(req, res) {
  res.json({ success: true, data: await leaveService.history(req.user) });
}

async function remove(req, res) {
  await leaveService.remove(req.user, req.params.id);
  res.json({ success: true, data: null, message: 'İzin talebi kalıcı olarak silindi.' });
}

module.exports = { list, get, create, update, cancel, removeOwn, approve, reject, history, remove };
