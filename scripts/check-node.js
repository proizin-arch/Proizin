const majorVersion = Number(process.versions.node.split('.')[0]);

if (majorVersion < 24) {
  console.error('\nİzinPro Node.js 24 LTS veya daha yeni bir sürüm gerektirir.');
  console.error('nvm kullanıyorsanız önce "nvm use" komutunu çalıştırın.\n');
  process.exit(1);
}
