const userService = require('../services/userService');

async function list(req, res) {
  res.json({ success: true, data: await userService.list(req.user, req.query) });
}

async function get(req, res) {
  res.json({ success: true, data: await userService.get(req.user, req.params.id) });
}

async function create(req, res) {
  res.status(201).json({ success: true, data: await userService.create(req.body) });
}

async function update(req, res) {
  res.json({ success: true, data: await userService.update(req.user, req.params.id, req.body) });
}

async function updateProfile(req, res) {
  res.json({ success: true, data: await userService.updateProfile(req.user.id, req.body) });
}

async function setStatus(req, res) {
  res.json({ success: true, data: await userService.setStatus(req.user, req.params.id, req.body.isActive) });
}

async function resetPassword(req, res) {
  await userService.resetPassword(req.params.id, req.body.newPassword);
  res.json({ success: true, data: null, message: 'Kullanıcı şifresi sıfırlandı.' });
}

async function getTemporaryCredentials(req, res) {
  res.json({ success: true, data: await userService.getTemporaryCredentials(req.params.id) });
}

async function remove(req, res) {
  await userService.remove(req.user, req.params.id);
  res.json({ success: true, data: null, message: 'Kullanıcı kalıcı olarak silindi.' });
}

module.exports = { list, get, create, update, updateProfile, setStatus, resetPassword, getTemporaryCredentials, remove };
