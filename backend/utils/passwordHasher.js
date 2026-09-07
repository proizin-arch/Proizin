const ALGORITHM = 'PBKDF2';
const DIGEST = 'SHA-256';
// Cloudflare Workers Free has a 10 ms CPU budget. A server-side pepper keeps
// Worker hashes protected while PBKDF2 stays within that runtime budget.
const ITERATIONS = 25000;
const MIN_ITERATIONS = 25000;
const KEY_BYTES = 32;
const PREFIX = 'pbkdf2-sha256';
const PEPPERED_PREFIX = 'pbkdf2-sha256p';

function getPepper() {
  return String(process.env.PASSWORD_PEPPER || '');
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function derive(password, salt, iterations) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(String(password)),
    ALGORITHM,
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: ALGORITHM, hash: DIGEST, salt, iterations },
    key,
    KEY_BYTES * 8
  );
  return new Uint8Array(bits);
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

async function hash(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const pepper = getPepper();
  const derived = await derive(`${password}${pepper}`, salt, ITERATIONS);
  return [pepper ? PEPPERED_PREFIX : PREFIX, ITERATIONS, bytesToBase64Url(salt), bytesToBase64Url(derived)].join('$');
}

async function compare(password, encoded) {
  const value = String(encoded || '');
  if (value.startsWith(`${PREFIX}$`) || value.startsWith(`${PEPPERED_PREFIX}$`)) {
    const [prefix, iterationsText, saltText, hashText] = value.split('$');
    const iterations = Number(iterationsText);
    if (![PREFIX, PEPPERED_PREFIX].includes(prefix) || !Number.isSafeInteger(iterations) || iterations < MIN_ITERATIONS || !saltText || !hashText) {
      return false;
    }
    const pepper = prefix === PEPPERED_PREFIX ? getPepper() : '';
    if (prefix === PEPPERED_PREFIX && !pepper) return false;
    const actual = await derive(`${password}${pepper}`, base64UrlToBytes(saltText), iterations);
    return constantTimeEqual(actual, base64UrlToBytes(hashText));
  }

  // Existing local databases can still contain bcrypt hashes. They remain
  // valid and are transparently accepted during the transition.
  if (/^\$2[aby]\$/.test(value)) {
    const legacyBcrypt = require('bcryptjs');
    return legacyBcrypt.compare(String(password), value);
  }

  return false;
}

module.exports = { hash, compare };
