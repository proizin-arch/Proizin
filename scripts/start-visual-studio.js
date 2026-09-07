const http = require('node:http');
const { spawn } = require('node:child_process');

const port = Number(process.env.PORT) || 3000;
const demoUrls = [
  `http://admin.localhost:${port}`,
  `http://manager.localhost:${port}`,
  `http://personel.localhost:${port}`
];

function openUrl(url) {
  let command;
  let args;

  if (process.platform === 'win32') {
    command = 'cmd.exe';
    args = ['/d', '/s', '/c', `start "" "${url}"`];
  } else if (process.platform === 'darwin') {
    command = 'open';
    args = [url];
  } else {
    command = 'xdg-open';
    args = [url];
  }

  const child = spawn(command, args, { detached: true, stdio: 'ignore' });
  child.on('error', () => {});
  child.unref();
}

function waitForServer(attempt = 0) {
  const request = http.get(`http://127.0.0.1:${port}/api/setup/status`, (response) => {
    response.resume();
    if (response.statusCode && response.statusCode < 500) {
      demoUrls.forEach(openUrl);
      console.log('\nUc bagimsiz oturum acildi:');
      demoUrls.forEach((url) => console.log(`- ${url}`));
      return;
    }
    retry(attempt);
  });

  request.setTimeout(1000, () => request.destroy());
  request.on('error', () => retry(attempt));
}

function retry(attempt) {
  if (attempt >= 39) {
    console.warn('\nTarayici otomatik acilamadi. Adresleri elle acabilirsiniz:');
    demoUrls.forEach((url) => console.warn(`- ${url}`));
    return;
  }
  setTimeout(() => waitForServer(attempt + 1), 250);
}

if (process.env.IZINPRO_NO_BROWSER !== '1') {
  waitForServer();
}

require('../backend/server');
