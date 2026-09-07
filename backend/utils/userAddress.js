const DOMAIN = 'izinpro.com';

function slugPart(value) {
  const trMap = { ç: 'c', ğ: 'g', ı: 'i', i: 'i', ö: 'o', ş: 's', ü: 'u' };
  return String(value || '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .split('')
    .map((character) => trMap[character] || character)
    .join('')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

function baseAddress(firstName, lastName) {
  const first = slugPart(firstName);
  const last = slugPart(lastName);
  return `${first || 'kullanici'}.${last || 'hesap'}`;
}

async function generateAddress(firstName, lastName, exists) {
  const base = baseAddress(firstName, lastName);
  let suffix = 1;
  let candidate = `${base}@${DOMAIN}`;
  while (await exists(candidate)) {
    suffix += 1;
    candidate = `${base}${suffix}@${DOMAIN}`;
  }
  return candidate;
}

module.exports = { DOMAIN, slugPart, baseAddress, generateAddress };
