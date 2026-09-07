import { createServer } from 'node:http';
import { httpServerHandler } from 'cloudflare:node';
import appModule from '../backend/app.js';
import d1Module from './d1Adapter.js';

const { createApp } = appModule;
const D1Database = d1Module;
let apiHandler;

function configureRuntime(env) {
  process.env.SESSION_SECRET = env.SESSION_SECRET;
  process.env.TEMP_PASSWORD_KEY = env.TEMP_PASSWORD_KEY;
  process.env.PASSWORD_PEPPER = env.PASSWORD_PEPPER;
  process.env.CONTEXT = 'production';
}

function getApiHandler(env) {
  if (!apiHandler) {
    configureRuntime(env);
    const app = createApp({
      database: new D1Database(env.DB),
      databasePath: 'cloudflare-d1',
      trustProxy: true,
      secureCookies: true,
      asciiJson: true,
      apiOnly: true
    });
    apiHandler = httpServerHandler(createServer(app));
  }
  return apiHandler;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      const headers = new Headers(request.headers);
      headers.set('x-forwarded-proto', 'https');
      headers.set('x-forwarded-host', url.host);
      return getApiHandler(env).fetch(new Request(request, { headers }), env, ctx);
    }

    return env.ASSETS.fetch(request);
  }
};
