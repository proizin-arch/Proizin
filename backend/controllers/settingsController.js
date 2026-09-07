const settingsService = require('../services/settingsService');

async function status(_req, res) {
  res.json({ success: true, data: await settingsService.status() });
}

async function get(_req, res) {
  res.json({ success: true, data: await settingsService.get() });
}

async function update(req, res) {
  res.json({ success: true, data: await settingsService.update(req.body) });
}

async function clearOperations(req, res) {
  await settingsService.clearOperations(req.user, req.body.password, req.sessionID);
  res.json({ success: true, data: null, message: 'İşlem verileri temizlendi.' });
}

async function factoryReset(req, res) {
  await settingsService.factoryReset(req.user, req.body.password, req.body.confirmation, req.sessionID);
  res.json({ success: true, data: null, message: 'Sistem sıfırlandı; admin hesabınız korundu.' });
}

module.exports = { status, get, update, clearOperations, factoryReset };
