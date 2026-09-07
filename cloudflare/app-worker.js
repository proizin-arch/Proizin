import { createServer } from 'node:http';
import { httpServerHandler } from 'cloudflare:node';
import appModule from '../backend/app.js';
import d1Module from './d1Adapter.js';

const { createApp } = appModule;
const D1Database = d1Module;
const apiHandlers = new Map();

const PORTALS = {
  admin: { role: 'ADMIN', cookie: 'izinpro.admin.sid' },
  yonetici: { role: 'MANAGER', cookie: 'izinpro.manager.sid' },
  personel: { role: 'PERSONNEL', cookie: 'izinpro.personnel.sid' }
};

function configureRuntime(env) {
  process.env.SESSION_SECRET = env.SESSION_SECRET;
  process.env.TEMP_PASSWORD_KEY = env.TEMP_PASSWORD_KEY;
  process.env.PASSWORD_PEPPER = env.PASSWORD_PEPPER;
  process.env.CONTEXT = 'production';
}

function getApiHandler(env, portalName = '') {
  if (!apiHandlers.has(portalName)) {
    configureRuntime(env);
    const portal = PORTALS[portalName];
    const app = createApp({
      database: new D1Database(env.DB),
      databasePath: 'cloudflare-d1',
      trustProxy: true,
      secureCookies: true,
      asciiJson: true,
      apiOnly: true,
      sessionName: portal?.cookie || 'izinpro.sid',
      sessionPath: portal ? `/${portalName}` : '/',
      apiPrefix: portal ? `/${portalName}/api` : '/api',
      portalRole: portal?.role || null
    });
    apiHandlers.set(portalName, httpServerHandler(createServer(app)));
  }
  return apiHandlers.get(portalName);
}

function portalRequest(url) {
  const match = url.pathname.match(/^\/(admin|yonetici|personel)(?:\/|$)/);
  if (!match) return null;
  const portalName = match[1];
  const path = url.pathname.slice(portalName.length + 1) || '/';
  return { portalName, path: path === '/' ? '/login.html' : path };
}

function rewriteRequest(request, url, path) {
  const rewrittenUrl = new URL(url);
  rewrittenUrl.pathname = path;
  return new Request(rewrittenUrl, request);
}

async function portalAssetResponse(env, request, url, portalName, path) {
  const response = await env.ASSETS.fetch(rewriteRequest(request, url, path));
  const location = response.headers.get('location');
  if (!location?.startsWith('/')) return response;
  const headers = new Headers(response.headers);
  headers.set('location', `/${portalName}${location}`);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const portal = portalRequest(url);

    if (portal) {
      if (portal.path.startsWith('/api/')) {
        const headers = new Headers(request.headers);
        headers.set('x-forwarded-proto', 'https');
        headers.set('x-forwarded-host', url.host);
        return getApiHandler(env, portal.portalName).fetch(new Request(request, { headers }), env, ctx);
      }
      return portalAssetResponse(env, request, url, portal.portalName, portal.path);
    }

    if (url.pathname.startsWith('/api/')) {
      const headers = new Headers(request.headers);
      headers.set('x-forwarded-proto', 'https');
      headers.set('x-forwarded-host', url.host);
      return getApiHandler(env).fetch(new Request(request, { headers }), env, ctx);
    }

    return env.ASSETS.fetch(request);
  }
};
