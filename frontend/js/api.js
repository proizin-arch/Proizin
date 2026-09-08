(function () {
  const portalMatch = window.location.pathname.match(/^\/(admin|yonetici|personel)(?:\/|$)/);
  const portalName = portalMatch?.[1] || '';
  const portalBase = portalName ? `/${portalName}` : '';
  const changeListeners = new Set();
  const changeStorageKey = 'izinpro:last-data-change';
  const changeChannel = 'BroadcastChannel' in window
    ? new window.BroadcastChannel('izinpro-data-changes')
    : null;

  function portalUrl(path) {
    if (!path.startsWith('/') || !portalBase) return path;
    return `${portalBase}${path}`;
  }

  function emitChange(change) {
    changeListeners.forEach((listener) => listener(change));
  }

  function publishChange(path, method) {
    const change = { path, method, at: Date.now(), source: portalName || 'default' };
    if (changeChannel) changeChannel.postMessage(change);
    else {
      try { window.localStorage.setItem(changeStorageKey, JSON.stringify(change)); } catch (_error) {}
    }
  }

  if (changeChannel) changeChannel.addEventListener('message', (event) => emitChange(event.data));
  else {
    window.addEventListener('storage', (event) => {
      if (event.key !== changeStorageKey || !event.newValue) return;
      try { emitChange(JSON.parse(event.newValue)); } catch (_error) {}
    });
  }

  async function request(path, options = {}) {
    const headers = { Accept: 'application/json', ...(options.headers || {}) };
    if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    const response = await fetch(portalUrl(path), { credentials: 'same-origin', ...options, headers });
    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : null;
    if (!response.ok) {
      const message = payload?.message || 'İşlem tamamlanamadı.';
      const error = new Error(window.I18n?.t(message) || message);
      error.status = response.status;
      error.details = payload?.details;
      throw error;
    }
    const method = String(options.method || 'GET').toUpperCase();
    if (!['GET', 'HEAD'].includes(method) && !/\/api\/auth\/(?:login|logout)$/.test(path)) {
      publishChange(path, method);
    }
    return payload?.data;
  }

  window.Api = {
    get: (path) => request(path),
    post: (path, body = {}) => request(path, { method: 'POST', body: JSON.stringify(body) }),
    put: (path, body = {}) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
    patch: (path, body = {}) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (path, body = {}) => request(path, { method: 'DELETE', body: JSON.stringify(body) }),
    onChange(listener) {
      changeListeners.add(listener);
      return () => changeListeners.delete(listener);
    }
  };
  window.Portal = {
    name: portalName,
    base: portalBase,
    url: portalUrl
  };
})();
