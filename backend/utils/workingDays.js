const AppError = require('./AppError');

function parseDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function calculateWorkingDays(startDate, endDate) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (end < start) {
    throw new AppError('Bitiş tarihi başlangıç tarihinden önce olamaz.', 400);
  }

  let count = 0;
  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) count += 1;
  }

  if (count === 0) {
    throw new AppError('Seçilen tarih aralığında iş günü bulunmuyor.', 400);
  }
  return count;
}

module.exports = { calculateWorkingDays };
