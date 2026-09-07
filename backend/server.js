require('dotenv').config({ quiet: true });
const { createApp } = require('./app');
const { closeDatabase } = require('./config/database');

const port = Number(process.env.PORT) || 3000;
const app = createApp();
const host = process.env.HOST || '127.0.0.1';
const server = app.listen(port, host, () => {
  console.log(`İzinPro running at http://localhost:${port}`);
});

function shutdown(signal) {
  console.log(`\n${signal} alındı, İzinPro kapatılıyor...`);
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
