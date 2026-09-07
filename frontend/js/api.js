(function () {
  const portalMatch = window.location.pathname.match(/^\/(admin|yonetici|personel)(?:\/|$)/);
  const portalName = portalMatch?.[1] || '';
  const portalBase = portalName ? `/${portalName}` : '';

  function portalUrl(path) {
    if (!path.startsWith('/') || !portalBase) return path;
    return `${portalBase}${path}`;
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
    return payload?.data;
  }

  window.Api = {
    get: (path) => request(path),
    post: (path, body = {}) => request(path, { method: 'POST', body: JSON.stringify(body) }),
    put: (path, body = {}) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
    patch: (path, body = {}) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (path, body = {}) => request(path, { method: 'DELETE', body: JSON.stringify(body) })
  };
  window.Portal = {
    name: portalName,
    base: portalBase,
    url: portalUrl
  };
})();
