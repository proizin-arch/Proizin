const authService = require('../services/authService');
const AppError = require('../utils/AppError');

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => error ? reject(error) : resolve());
  });
}

async function login(req, res) {
  const user = await authService.login(req.body.email, req.body.password);
  if (req.portalRole && user.role !== req.portalRole) {
    throw new AppError('Bu giriş ekranı hesabınızın rolüyle eşleşmiyor.', 403);
  }
  await regenerateSession(req);
  req.session.userId = user.id;
  req.session.cookie.maxAge = req.body.remember ? 1000 * 60 * 60 * 24 * 14 : 1000 * 60 * 60 * 8;
  res.json({ success: true, data: user });
}

function logout(req, res, next) {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie(req.sessionCookieName || 'izinpro.sid', { path: req.sessionCookiePath || '/' });
    res.json({ success: true, data: null });
  });
}

function me(req, res) {
  res.json({ success: true, data: req.user });
}

async function changePassword(req, res) {
  await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  res.json({ success: true, data: null, message: 'Şifreniz güncellendi.' });
}

module.exports = { login, logout, me, changePassword };
