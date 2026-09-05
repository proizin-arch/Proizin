(function () {
  const menus = {
    PERSONNEL: [
      { section: 'GENEL', items: [
        { id: 'overview', label: 'Ana Sayfa', icon: 'house' },
        { id: 'requests', label: 'İzin Taleplerim', icon: 'calendar-check' }
      ]},
      { section: 'HESABIM', items: [{ id: 'profile', label: 'Kişisel Bilgiler', icon: 'user-round' }] }
    ],
    MANAGER: [
      { section: 'YÖNETİM', items: [
        { id: 'overview', label: 'Ana Sayfa', icon: 'house' },
        { id: 'requests', label: 'İzin Talepleri', icon: 'clipboard-check' },
        { id: 'employees', label: 'Çalışanlar', icon: 'users' },
        { id: 'history', label: 'Onay Geçmişi', icon: 'history' }
      ]},
      { section: 'HESABIM', items: [{ id: 'profile', label: 'Kişisel Bilgiler', icon: 'user-round' }] }
    ],
    ADMIN: [
      { section: 'YÖNETİM', items: [
        { id: 'overview', label: 'Ana Sayfa', icon: 'house' },
        { id: 'users', label: 'Kullanıcılar', icon: 'users' },
        { id: 'departments', label: 'Departmanlar', icon: 'building-2' },
        { id: 'requests', label: 'İzin Talepleri', icon: 'clipboard-check' },
        { id: 'leave-types', label: 'İzin Türleri', icon: 'tags' }
      ]},
      { section: 'HESABIM', items: [{ id: 'profile', label: 'Kişisel Bilgiler', icon: 'user-round' }] }
    ]
  };
  const pageNames = { overview: 'Ana Sayfa', requests: 'İzin Talepleri', employees: 'Çalışanlar', history: 'Onay Geçmişi', users: 'Kullanıcılar', departments: 'Departmanlar', 'leave-types': 'İzin Türleri', profile: 'Kişisel Bilgiler' };
  const content = document.getElementById('main-content');

  window.App = {
    me: null,
    currentPage: 'overview',
    navigate,
    updateMe(user) { this.me = user; renderAccount(); }
  };

  function renderAccount() {
    const user = App.me;
    document.getElementById('account-name').textContent = user.fullName;
    document.getElementById('account-position').textContent = user.position;
    document.getElementById('role-badge').textContent = UI.roleMap[user.role];
    document.getElementById('account-avatar').textContent = UI.initials(user.fullName);
  }

  function renderMenu() {
    document.getElementById('side-nav').innerHTML = menus[App.me.role].map((group) => `<section class="nav-section"><span class="nav-label">${UI.escapeHtml(group.section)}</span>${group.items.map((item) => `<button class="nav-item" type="button" data-page="${item.id}">${UI.icon(item.icon)}<span>${UI.escapeHtml(item.label)}</span></button>`).join('')}</section>`).join('');
  }

  async function navigate(page) {
    if (!menus[App.me.role].some((group) => group.items.some((item) => item.id === page))) page = 'overview';
    App.currentPage = page;
    document.querySelectorAll('[data-page]').forEach((button) => button.classList.toggle('active', button.dataset.page === page));
    document.getElementById('page-title').textContent = pageNames[page];
    document.getElementById('page-eyebrow').textContent = UI.roleMap[App.me.role];
    closeMobileMenu();
    content.innerHTML = '<div class="page-loading"><span class="spinner"></span><p>Bilgiler yükleniyor…</p></div>';
    try {
      if (page === 'overview') await showOverview();
      else if (page === 'requests') await LeavePages.showRequests(content);
      else if (page === 'history') await LeavePages.showHistory(content);
      else if (page === 'employees') await AdminPages.showEmployees(content);
      else if (page === 'users') await AdminPages.showUsers(content);
      else if (page === 'departments') await AdminPages.showDepartments(content);
      else if (page === 'leave-types') await AdminPages.showLeaveTypes(content);
      else if (page === 'profile') await ProfilePage.showProfile(content);
    } catch (error) {
      if (error.status === 401) return window.location.replace('/login.html');
      content.innerHTML = UI.emptyState('Sayfa yüklenemedi', error.message);
    }
  }

  function statCard(label, value, icon, tone = '') {
    return `<article class="stat-card"><div class="stat-copy"><span>${UI.escapeHtml(label)}</span><strong>${Number(value) || 0}</strong></div><span class="stat-icon ${tone}">${UI.icon(icon)}</span></article>`;
  }

  async function showOverview() {
    const [summary, requests] = await Promise.all([Api.get('/api/dashboard/summary'), Api.get('/api/leave-requests')]);
    const role = App.me.role;
    const stats = role === 'PERSONNEL'
      ? [statCard('Toplam talep', summary.totalRequests, 'files'), statCard('Bekleyen', summary.pending, 'clock-3', 'warning'), statCard('Onaylanan', summary.approved, 'circle-check', 'success'), statCard('Reddedilen', summary.rejected, 'circle-x', 'danger')]
      : role === 'MANAGER'
        ? [statCard('Departman çalışanı', summary.employees, 'users'), statCard('Bekleyen talep', summary.pending, 'clock-3', 'warning'), statCard('Onaylanan', summary.approved, 'circle-check', 'success'), statCard('Reddedilen', summary.rejected, 'circle-x', 'danger')]
        : [statCard('Aktif kullanıcı', summary.users, 'users'), statCard('Aktif departman', summary.departments, 'building-2'), statCard('Bekleyen talep', summary.pending, 'clock-3', 'warning'), statCard('Onaylanan', summary.approved, 'circle-check', 'success')];
    const recent = requests.slice(0, 5);
    content.innerHTML = `<section class="welcome-panel"><div><span class="eyebrow">${role === 'PERSONNEL' ? 'İYİ ÇALIŞMALAR' : 'YÖNETİM ÖZETİ'}</span><h2>Hoş geldiniz, ${UI.escapeHtml(App.me.firstName)}</h2><p>${UI.escapeHtml(App.me.department?.name || 'İzinPro')} · ${UI.escapeHtml(App.me.position)}</p></div><span class="welcome-mark">${UI.icon(role === 'PERSONNEL' ? 'calendar-check' : role === 'MANAGER' ? 'users' : 'shield-check')}</span></section>
      <section class="stats-grid">${stats.join('')}</section>
      <div class="content-grid"><section class="panel"><header class="panel-header"><div><h3>Son izin talepleri</h3><p>En son oluşturulan talepler ve güncel durumları</p></div><button class="button button-ghost button-small" data-page="requests">Tümünü gör</button></header>${recent.length ? `<div class="table-wrap"><table class="data-table"><thead><tr>${role === 'PERSONNEL' ? '' : '<th>PERSONEL</th>'}<th>İZİN TÜRÜ</th><th>TARİH</th><th>SÜRE</th><th>DURUM</th></tr></thead><tbody>${recent.map((request) => `<tr>${role === 'PERSONNEL' ? '' : `<td>${UI.personCell(request)}</td>`}<td><span class="type-dot type-${UI.escapeHtml(request.leaveType.code.toLowerCase())}"></span>${UI.escapeHtml(request.leaveType.name)}</td><td>${UI.formatDate(request.startDate)} – ${UI.formatDate(request.endDate)}</td><td>${request.workingDays} gün</td><td>${UI.statusBadge(request.status)}</td></tr>`).join('')}</tbody></table></div>` : UI.emptyState('Henüz talep bulunmuyor', role === 'PERSONNEL' ? 'İlk izin talebinizi oluşturarak başlayabilirsiniz.' : 'Görüntülenecek izin talebi bulunmuyor.', role === 'PERSONNEL' ? 'Yeni İzin Talebi' : null, 'new-leave')}</section>
      <section class="panel"><header class="panel-header"><div><h3>Hızlı işlemler</h3><p>Sık kullanılan ekranlara geçin</p></div></header><div class="panel-body quick-actions">${quickActions(role)}</div></section></div>`;
  }

  function quickActions(role) {
    const actions = role === 'PERSONNEL'
      ? [{ action: 'new-leave', label: 'Yeni izin talebi', icon: 'calendar-plus' }, { page: 'requests', label: 'Taleplerimi görüntüle', icon: 'calendar-check' }, { page: 'profile', label: 'Bilgilerimi güncelle', icon: 'user-round' }]
      : role === 'MANAGER'
        ? [{ page: 'requests', label: 'Bekleyen talepler', icon: 'clipboard-check' }, { page: 'employees', label: 'Departman çalışanları', icon: 'users' }, { page: 'history', label: 'Onay geçmişi', icon: 'history' }]
        : [{ action: 'new-user', label: 'Yeni kullanıcı', icon: 'user-plus' }, { page: 'departments', label: 'Departmanlar', icon: 'building-2' }, { page: 'requests', label: 'İzin talepleri', icon: 'clipboard-check' }];
    return actions.map((item) => `<button class="quick-action" ${item.page ? `data-page="${item.page}"` : `data-action="${item.action}"`}>${UI.icon(item.icon)}<span>${UI.escapeHtml(item.label)}</span>${UI.icon('chevron-right', 'arrow')}</button>`).join('');
  }

  function closeMobileMenu() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-scrim').classList.remove('open'); }

  document.addEventListener('click', (event) => {
    const pageButton = event.target.closest('[data-page]');
    if (pageButton) { navigate(pageButton.dataset.page); return; }
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) return;
    const action = actionButton.dataset.action; const id = Number(actionButton.dataset.id);
    if (action === 'close-drawer') UI.closeDrawer();
    else if (action === 'new-leave') LeavePages.openForm();
    else if (action === 'edit-leave') LeavePages.openForm(id);
    else if (action === 'request-detail') LeavePages.openDetail(id);
    else if (action === 'cancel-leave') LeavePages.cancel(id);
    else if (action === 'new-user') AdminPages.openUserForm();
    else if (action === 'edit-user') AdminPages.openUserForm(id);
    else if (action === 'toggle-user') AdminPages.toggleUser(id, actionButton.dataset.active === 'true');
    else if (action === 'reset-password') AdminPages.openPasswordReset(id);
    else if (action === 'new-department') AdminPages.openDepartmentForm();
    else if (action === 'edit-department') AdminPages.openDepartmentForm(id);
    else if (action === 'toggle-department') AdminPages.toggleDepartment(id, actionButton.dataset.active === 'true');
    else if (action === 'new-leave-type') AdminPages.openLeaveTypeForm();
    else if (action === 'edit-leave-type') AdminPages.openLeaveTypeForm(id);
  });

  document.getElementById('drawer-close').addEventListener('click', UI.closeDrawer);
  document.getElementById('drawer-backdrop').addEventListener('click', UI.closeDrawer);
  document.getElementById('mobile-menu').addEventListener('click', () => { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebar-scrim').classList.add('open'); });
  document.getElementById('sidebar-scrim').addEventListener('click', closeMobileMenu);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !document.getElementById('drawer').hidden) UI.closeDrawer(); });
  document.getElementById('logout-button').addEventListener('click', async () => { try { await Api.post('/api/auth/logout'); } finally { window.location.replace('/login.html'); } });

  Api.get('/api/auth/me').then((user) => { App.me = user; renderAccount(); renderMenu(); navigate('overview'); }).catch(() => window.location.replace('/login.html'));
})();
