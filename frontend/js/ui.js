(function () {
  const statusMap = {
    PENDING: ['Bekliyor', 'pending'], APPROVED: ['Onaylandı', 'approved'],
    REJECTED: ['Reddedildi', 'rejected'], CANCELLED: ['İptal edildi', 'cancelled']
  };
  const roleMap = { PERSONNEL: 'PERSONEL', MANAGER: 'YÖNETİCİ', ADMIN: 'SİSTEM YÖNETİCİSİ' };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[char]);
  }

  function icon(name, className = '') {
    return `<img src="/icons/${escapeHtml(name)}.svg" alt=""${className ? ` class="${escapeHtml(className)}"` : ''}>`;
  }

  function initials(name) {
    return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('tr-TR');
  }

  function formatDate(value) {
    if (!value) return '—';
    const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
    return new Intl.DateTimeFormat('tr-TR').format(new Date(Date.UTC(year, month - 1, day)));
  }

  function formatDateTime(value) {
    if (!value) return '—';
    const normalized = String(value).includes('T') ? value : `${String(value).replace(' ', 'T')}Z`;
    return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(normalized));
  }

  function statusBadge(status) {
    const [label, type] = statusMap[status] || [status, 'cancelled'];
    return `<span class="status-badge status-${type}">${escapeHtml(label)}</span>`;
  }

  function personCell(user) {
    const name = user.employeeName || user.fullName;
    return `<div class="person-cell"><span class="mini-avatar">${escapeHtml(initials(name))}</span><span><strong>${escapeHtml(name)}</strong><small>${escapeHtml(user.position || user.email || '')}</small></span></div>`;
  }

  function emptyState(title, message, actionLabel, action) {
    return `<div class="empty-state"><span class="empty-icon">${icon('inbox')}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(message)}</p>${actionLabel ? `<button class="button button-primary button-small" data-action="${escapeHtml(action)}">${icon('plus')} ${escapeHtml(actionLabel)}</button>` : ''}</div>`;
  }

  function toast(message, type = 'success') {
    const region = document.getElementById('toast-region');
    if (!region) return;
    const item = document.createElement('div');
    item.className = `toast ${type === 'error' ? 'error' : ''}`;
    item.innerHTML = `${icon(type === 'error' ? 'circle-alert' : 'circle-check')}<span>${escapeHtml(message)}</span>`;
    region.appendChild(item);
    window.setTimeout(() => {
      item.classList.add('leaving');
      window.setTimeout(() => item.remove(), 220);
    }, 3400);
  }

  function setButtonLoading(button, loading, label = 'Kaydediliyor…') {
    if (!button) return;
    if (loading) {
      button.dataset.original = button.innerHTML;
      button.textContent = label;
      button.disabled = true;
    } else {
      button.innerHTML = button.dataset.original || button.innerHTML;
      button.disabled = false;
    }
  }

  function openDrawer({ title, eyebrow = 'İZİNPRO', content, onOpen }) {
    const drawer = document.getElementById('drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    document.getElementById('drawer-title').textContent = title;
    document.getElementById('drawer-eyebrow').textContent = eyebrow;
    document.getElementById('drawer-body').innerHTML = content;
    drawer.hidden = false;
    backdrop.hidden = false;
    requestAnimationFrame(() => { drawer.classList.add('open'); backdrop.classList.add('open'); });
    document.body.classList.add('drawer-open');
    if (onOpen) onOpen(document.getElementById('drawer-body'));
    const firstControl = document.getElementById('drawer-body').querySelector('input, select, textarea, button');
    if (firstControl) firstControl.focus();
  }

  function closeDrawer() {
    const drawer = document.getElementById('drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.classList.remove('drawer-open');
    window.setTimeout(() => { drawer.hidden = true; backdrop.hidden = true; }, 220);
  }

  function confirmAction(message, confirmLabel = 'Onayla') {
    return new Promise((resolve) => {
      const backdrop = document.getElementById('modal-backdrop');
      const ok = document.getElementById('confirm-ok');
      const cancel = document.getElementById('confirm-cancel');
      document.getElementById('confirm-message').textContent = message;
      ok.textContent = confirmLabel;
      backdrop.hidden = false;
      const finish = (result) => {
        backdrop.hidden = true;
        ok.removeEventListener('click', approve);
        cancel.removeEventListener('click', reject);
        resolve(result);
      };
      const approve = () => finish(true);
      const reject = () => finish(false);
      ok.addEventListener('click', approve);
      cancel.addEventListener('click', reject);
    });
  }

  window.UI = { escapeHtml, icon, initials, formatDate, formatDateTime, statusBadge, roleMap, personCell, emptyState, toast, setButtonLoading, openDrawer, closeDrawer, confirmAction };
})();
