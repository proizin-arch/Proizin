const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, '.netlify-dist');

fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(path.join(root, 'frontend'), output, { recursive: true });
fs.cpSync(
  path.join(root, 'node_modules', 'lucide-static', 'icons'),
  path.join(output, 'icons'),
  { recursive: true }
);
fs.cpSync(
  path.join(root, 'node_modules', '@fontsource', 'inter'),
  path.join(output, 'vendor', 'inter'),
  { recursive: true }
);
fs.copyFileSync(path.join(root, 'frontend', 'login.html'), path.join(output, 'index.html'));

console.log('Netlify yayın klasörü hazır: .netlify-dist');
