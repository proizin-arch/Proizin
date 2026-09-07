const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const { initDatabase, useDatabase } = require('./config/database');
const credentialVault = require('./utils/credentialVault');
const settingsRepository = require('./repositories/settingsRepository');
const SQLiteSessionStore = require('./config/sessionStore');
const apiRoutes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

function createApp(options = {}) {
  const app = express();
  const initialized = options.database
    ? useDatabase(options.database, options.ready || Promise.resolve())
    : initDatabase(options.databaseFile);
  const { database, ready } = initialized;
  const databasePath = options.databasePath || initialized.databasePath;
  credentialVault.configure(databasePath);
  const sessionStore = new SQLiteSessionStore(database);
  const frontendPath = options.apiOnly ? null : path.join(__dirname, '..', 'frontend');
  const sessionName = options.sessionName || 'izinpro.sid';
  const sessionPath = options.sessionPath || '/';
  const apiPrefix = options.apiPrefix || '/api';

  app.disable('x-powered-by');
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        fontSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"]
      }
    }
  }));
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false }));
  if (options.asciiJson) {
    app.use((_req, res, next) => {
      res.json = (body) => {
        const serialized = JSON.stringify(body).replace(/[\u007f-\uffff]/g, (character) =>
          `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`
        ) + '\n';
        res.type('application/json');
        return res.send(serialized);
      };
      next();
    });
  }
  app.use((req, _res, next) => Promise.resolve(ready).then(() => next(), next));
  if (options.trustProxy) app.set('trust proxy', 1);
  app.use(session({
    name: sessionName,
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: options.secureCookies ?? process.env.CONTEXT === 'production',
      path: sessionPath,
      maxAge: 1000 * 60 * 60 * 8
    }
  }));

  app.use((req, _res, next) => {
    req.sessionCookieName = sessionName;
    req.sessionCookiePath = sessionPath;
    req.portalRole = options.portalRole || null;
    next();
  });

  app.use(apiPrefix, apiRoutes);
  if (!options.apiOnly) {
    app.use('/icons', express.static(path.join(__dirname, '..', 'node_modules', 'lucide-static', 'icons'), { maxAge: '7d' }));
    app.use('/vendor/inter', express.static(path.join(__dirname, '..', 'node_modules', '@fontsource', 'inter'), { maxAge: '7d' }));
    app.get(['/', '/login.html'], async (_req, res) => {
      const file = (await settingsRepository.get())?.isConfigured ? 'login.html' : 'setup.html';
      res.sendFile(path.join(frontendPath, file));
    });
    app.get(['/register', '/register.html'], (_req, res) => res.redirect(302, '/login.html'));
    app.get('/setup.html', async (_req, res) => {
      const file = (await settingsRepository.get())?.isConfigured ? 'login.html' : 'setup.html';
      res.sendFile(path.join(frontendPath, file));
    });
    app.use(express.static(frontendPath, { extensions: ['html'] }));
  }

  app.use(notFound);
  app.use(errorHandler);

  app.locals.databasePath = databasePath;
  app.locals.sessionStore = sessionStore;
  return app;
}

module.exports = { createApp };
