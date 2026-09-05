const userService = require('../services/userService');

function list(req, res) {
  res.json({ success: true, data: userService.list(req.user, req.query) });
}

function get(req, res) {
  res.json({ success: true, data: userService.get(req.user, req.params.id) });
}

async function create(req, res) {
  res.status(201).json({ success: true, data: await userService.create(req.body) });
}

function update(req, res) {
  res.json({ success: true, data: userService.update(req.user, req.params.id, req.body) });
}

function updateProfile(req, res) {
  res.json({ success: true, data: userService.updateProfile(req.user.id, req.body) });
}

function setStatus(req, res) {
  res.json({ success: true, data: userService.setStatus(req.user, req.params.id, req.body.isActive) });
}

async function resetPassword(req, res) {
  await userService.resetPassword(req.params.id, req.body.newPassword);
  res.json({ success: true, data: null, message: 'Kullanıcı şifresi sıfırlandı.' });
}

module.exports = { list, get, create, update, updateProfile, setStatus, resetPassword };
