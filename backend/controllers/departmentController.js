const departmentService = require('../services/departmentService');

function list(req, res) {
  const activeOnly = req.user.role !== 'ADMIN' || req.query.activeOnly === 'true';
  res.json({ success: true, data: departmentService.list(activeOnly) });
}

function publicList(_req, res) {
  res.json({ success: true, data: departmentService.list(true) });
}

function create(req, res) {
  res.status(201).json({ success: true, data: departmentService.create(req.body) });
}

function update(req, res) {
  res.json({ success: true, data: departmentService.update(req.params.id, req.body) });
}

function setStatus(req, res) {
  res.json({ success: true, data: departmentService.setStatus(req.params.id, req.body.isActive) });
}

module.exports = { list, publicList, create, update, setStatus };
