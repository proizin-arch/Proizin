const AppError = require('../utils/AppError');

function notFound(req, _res, next) {
  next(new AppError(`İstenen kaynak bulunamadı: ${req.method} ${req.originalUrl}`, 404));
}

function errorHandler(error, req, res, _next) {
  if (res.headersSent) return _next(error);
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Beklenmeyen bir hata oluştu.';

  if (error.code?.startsWith('SQLITE_CONSTRAINT')) {
    statusCode = 409;
    message = 'Bu bilgilerle eşleşen bir kayıt zaten bulunuyor veya kayıt başka veriler tarafından kullanılıyor.';
  }
  if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    message = 'Gönderilen veri geçerli JSON biçiminde değil.';
  }
  if (statusCode >= 500) {
    console.error(`[${new Date().toISOString()}]`, error);
    message = 'İşlem sırasında beklenmeyen bir hata oluştu.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(error.details ? { details: error.details } : {})
  });
}

module.exports = { notFound, errorHandler };
