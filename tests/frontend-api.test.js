const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('portal API istekleri kendi yolunu kullanır ve değişikliği diğer sekmelere yayınlar', async () => {
  const requests = [];
  const messages = [];
  let channel;

  class FakeBroadcastChannel {
    constructor(name) {
      this.name = name;
      channel = this;
    }
    addEventListener(type, listener) { this.listener = type === 'message' ? listener : null; }
    postMessage(message) { messages.push(message); }
  }

  const window = {
    location: { pathname: '/admin/Dashboard' },
    BroadcastChannel: FakeBroadcastChannel,
    addEventListener() {},
    localStorage: { setItem() {} }
  };
  const context = vm.createContext({
    window,
    FormData,
    fetch: async (url, options) => {
      requests.push({ url, options });
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, data: { ok: true } })
      };
    }
  });
  const source = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'js', 'api.js'), 'utf8');
  vm.runInContext(source, context);

  let incoming;
  window.Api.onChange((change) => { incoming = change; });
  await window.Api.get('/api/dashboard/summary');
  await window.Api.post('/api/leave-requests', { leaveTypeId: 1 });

  assert.equal(requests[0].url, '/admin/api/dashboard/summary');
  assert.equal(requests[1].url, '/admin/api/leave-requests');
  assert.equal(messages.length, 1);
  assert.equal(messages[0].path, '/api/leave-requests');
  assert.equal(messages[0].method, 'POST');

  channel.listener({ data: { path: '/api/leave-requests', method: 'POST' } });
  assert.deepEqual(incoming, { path: '/api/leave-requests', method: 'POST' });
});

test('panelde elle veri yenileme düğmesi bulunur', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'Dashboard.html'), 'utf8');
  const script = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'js', 'dashboard.js'), 'utf8');
  assert.match(html, /id="refresh-data-button"/);
  assert.match(html, /refresh-cw\.svg/);
  assert.match(script, /refreshCurrentPage\(\{ force: true \}\)/);
});
