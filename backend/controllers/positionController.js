const positionService = require('../services/positionService');

async function list(req, res) {
  const activeOnly = req.user.role !== 'ADMIN' || req.query.activeOnly === 'true';
  res.json({ success: true, data: await positionService.list(activeOnly) });
}

async function create(req, res) {
  res.status(201).json({ success: true, data: await positionService.create(req.body) });
}

async function update(req, res) {
  res.json({ success: true, data: await positionService.update(req.params.id, req.body) });
}

async function setStatus(req, res) {
  res.json({ success: true, data: await positionService.setStatus(req.params.id, req.body.isActive) });
}

async function remove(req, res) {
  await positionService.remove(req.params.id);
  res.json({ success: true, data: null, message: 'Pozisyon kalıcı olarak silindi.' });
}

module.exports = { list, create, update, setStatus, remove };
