const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/AppError');

function requireAuth(req, _res, next) {
  if (!req.session?.userId) return next(new AppError('Oturum açmanız gerekiyor.', 401));
  const user = userRepository.findById(req.session.userId);
  if (!user || !user.isActive) {
    return req.session.destroy(() => next(new AppError('Oturumunuz geçersiz. Lütfen tekrar giriş yapın.', 401)));
  }
  req.user = user;
  next();
}

function requireRole(...roles) {
  return function roleGuard(req, _res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Bu işlem için yetkiniz bulunmuyor.', 403));
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
