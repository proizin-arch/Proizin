const crypto = require('node:crypto');
const fs = require('node:fs');

let encryptionKey;

function configure(databasePath) {
  if (process.env.TEMP_PASSWORD_KEY) {
    encryptionKey = crypto.createHash('sha256').update(process.env.TEMP_PASSWORD_KEY).digest();
    return;
  }

  if (databasePath === 'postgresql') {
    throw new Error('Canlı ortamda TEMP_PASSWORD_KEY tanımlanmalıdır.');
  }

  const keyPath = `${databasePath}.key`;
  if (!fs.existsSync(keyPath)) {
    fs.writeFileSync(keyPath, crypto.randomBytes(32), { mode: 0o600, flag: 'wx' });
  }
  encryptionKey = fs.readFileSync(keyPath);
  if (encryptionKey.length !== 32) throw new Error('Geçici şifre anahtarı geçersiz.');
}

function requireKey() {
  if (!encryptionKey) throw new Error('Geçici şifre kasası başlatılmadı.');
  return encryptionKey;
}

function encrypt(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', requireKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join('.');
}

function decrypt(payload) {
  const [version, iv, tag, encrypted] = String(payload || '').split('.');
  if (version !== 'v1' || !iv || !tag || !encrypted) throw new Error('Geçici şifre kaydı geçersiz.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', requireKey(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64url')), decipher.final()]).toString('utf8');
}

module.exports = { configure, encrypt, decrypt };
