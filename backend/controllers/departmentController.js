const departmentService = require('../services/departmentService');

async function list(req, res) {
  const activeOnly = req.user.role !== 'ADMIN' || req.query.activeOnly === 'true';
  res.json({ success: true, data: await departmentService.list(activeOnly) });
}

async function publicList(_req, res) {
  res.json({ success: true, data: await departmentService.list(true) });
}

async function create(req, res) {
  res.status(201).json({ success: true, data: await departmentService.create(req.body) });
}

async function update(req, res) {
  res.json({ success: true, data: await departmentService.update(req.params.id, req.body) });
}

async function setStatus(req, res) {
  res.json({ success: true, data: await departmentService.setStatus(req.params.id, req.body.isActive) });
}

async function remove(req, res) {
  await departmentService.remove(req.params.id);
  res.json({ success: true, data: null, message: 'Departman kalıcı olarak silindi.' });
}

module.exports = { list, publicList, create, update, setStatus, remove };
