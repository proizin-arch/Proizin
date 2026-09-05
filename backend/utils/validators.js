const AppError = require('./AppError');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function requiredText(value, label, { min = 1, max = 255 } = {}) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized.length < min || normalized.length > max) {
    throw new AppError(`${label} ${min}-${max} karakter arasında olmalıdır.`, 400);
  }
  return normalized;
}

function optionalText(value, label, max = 500) {
  if (value === undefined || value === null || value === '') return null;
  return requiredText(value, label, { min: 1, max });
}

function email(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalized) || normalized.length > 160) {
    throw new AppError('Geçerli bir e-posta adresi giriniz.', 400);
  }
  return normalized;
}

function password(value, label = 'Şifre') {
  if (typeof value !== 'string' || value.length < 8 || value.length > 72 ||
      !/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value) || !/[^A-Za-z0-9]/.test(value)) {
    throw new AppError(`${label} en az 8 karakter, büyük harf, küçük harf, rakam ve özel karakter içermelidir.`, 400);
  }
  return value;
}

function date(value, label, { optional = false } = {}) {
  if (optional && !value) return null;
  const normalized = String(value || '');
  const match = normalized.match(DATE_PATTERN);
  const parsed = match ? new Date(`${normalized}T00:00:00Z`) : null;
  const [year, month, day] = match ? normalized.split('-').map(Number) : [];
  if (!match || Number.isNaN(parsed.getTime()) || parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() + 1 !== month || parsed.getUTCDate() !== day) {
    throw new AppError(`${label} geçerli bir tarih olmalıdır.`, 400);
  }
  return normalized;
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new AppError(`${label} geçerli olmalıdır.`, 400);
  }
  return number;
}

function boolean(value, label) {
  if (typeof value !== 'boolean') throw new AppError(`${label} true veya false olmalıdır.`, 400);
  return value;
}

module.exports = { requiredText, optionalText, email, password, date, positiveInteger, boolean };
