(function () {
  const menus = {
    PERSONNEL: [
      { section: 'GENEL', items: [
        { id: 'overview', label: 'Ana Sayfa', icon: 'house' },
        { id: 'my-requests', label: 'İzin Taleplerim', icon: 'calendar-check' }
      ]},
      { section: 'HESABIM', items: [{ id: 'profile', label: 'Kişisel Bilgiler', icon: 'user-round' }] }
    ],
    MANAGER: [
      { section: 'GENEL', items: [
        { id: 'overview', label: 'Ana Sayfa', icon: 'house' },
        { id: 'my-requests', label: 'İzin Taleplerim', icon: 'calendar-check' }
      ]},
      { section: 'YÖNETİM', items: [
        { id: 'team-requests', label: 'Departman Talepleri', icon: 'clipboard-check' },
        { id: 'employees', label: 'Çalışanlar', icon: 'users' }
      ]},
      { section: 'HESABIM', items: [{ id: 'profile', label: 'Kişisel Bilgiler', icon: 'user-round' }] }
    ],
    ADMIN: [
      { section: 'GENEL', items: [
        { id: 'overview', label: 'Ana Sayfa', icon: 'house' },
        { id: 'my-requests', label: 'İzin Taleplerim', icon: 'calendar-check' }
      ]},
      { section: 'YÖNETİM', items: [
        { id: 'all-requests', label: 'Tüm İzin Talepleri', icon: 'clipboard-check' },
        { id: 'users', label: 'Kullanıcılar', icon: 'users' },
        { id: 'departments', label: 'Departmanlar', icon: 'building-2' },
        { id: 'positions', label: 'Pozisyonlar', icon: 'briefcase-business' },
        { id: 'leave-types', label: 'İzin Türleri', icon: 'tags' }
      ]},
      { section: 'SİSTEM', items: [
        { id: 'settings', label: 'Sistem Ayarları', icon: 'settings' },
        { id: 'profile', label: 'Kişisel Bilgiler', icon: 'user-round' }
      ]}
    ]
  };
  const pageNames = { overview: 'Ana Sayfa', 'my-requests': 'İzin Taleplerim', 'team-requests': 'Departman Talepleri', 'all-requests': 'Tüm İzin Talepleri', employees: 'Çalışanlar', users: 'Kullanıcılar', departments: 'Departmanlar', positions: 'Pozisyonlar', 'leave-types': 'İzin Türleri', settings: 'Sistem Ayarları', profile: 'Kişisel Bilgiler' };
  const content = document.getElementById('main-content');
  let autoRefreshRunning = false;
  let refreshPending = false;
  let lastAutoRefresh = 0;

  window.App = {
    me: null,
    currentPage: 'overview',
    navigate,
    updateMe(user) { this.me = user; renderAccount(); },
    updateSettings(settings) { this.settings = settings; renderOrganization(); }
  };

  function renderOrganization() {
    document.getElementById('sidebar-organization').textContent = App.settings?.organizationName || 'Kurum';
  }

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

  async function navigate(page, options = {}) {
    if (!menus[App.me.role].some((group) => group.items.some((item) => item.id === page))) page = 'overview';
    App.currentPage = page;
    document.querySelectorAll('[data-page]').forEach((button) => button.classList.toggle('active', button.dataset.page === page));
    document.getElementById('page-title').textContent = pageNames[page];
    document.getElementById('page-eyebrow').textContent = UI.roleMap[App.me.role];
    closeMobileMenu();
    if (!options.silent) content.innerHTML = '<div class="page-loading"><span class="spinner"></span><p>Bilgiler yükleniyor…</p></div>';
    try {
      if (page === 'overview') await showOverview();
      else if (page === 'my-requests') await LeavePages.showRequests(content, 'mine');
      else if (page === 'team-requests') await LeavePages.showRequests(content, 'team');
      else if (page === 'all-requests') await LeavePages.showRequests(content, 'all');
      else if (page === 'employees') await AdminPages.showEmployees(content);
      else if (page === 'users') await AdminPages.showUsers(content);
      else if (page === 'departments') await AdminPages.showDepartments(content);
      else if (page === 'positions') await AdminPages.showPositions(content);
      else if (page === 'leave-types') await AdminPages.showLeaveTypes(content);
      else if (page === 'settings') await AdminPages.showSettings(content);
      else if (page === 'profile') await ProfilePage.showProfile(content);
    } catch (error) {
      if (error.status === 401) return window.location.replace(Portal.url('/login.html'));
      content.innerHTML = UI.emptyState('Sayfa yüklenemedi', error.message);
    }
  }

  function hasOpenEditor() {
    const drawerOpen = !document.getElementById('drawer').hidden;
    const decisionOpen = !document.getElementById('decision-modal-backdrop').hidden;
    const confirmationOpen = !document.getElementById('modal-backdrop').hidden;
    const active = document.activeElement;
    const editing = active?.matches?.('input, textarea, select, [contenteditable="true"]');
    return drawerOpen || decisionOpen || confirmationOpen || editing;
  }

  async function refreshCurrentPage(options = {}) {
    if (!App.me || document.hidden || autoRefreshRunning || hasOpenEditor()) {
      refreshPending = true;
      return;
    }
    const now = Date.now();
    if (!options.force && now - lastAutoRefresh < 400) return;
    autoRefreshRunning = true;
    refreshPending = false;
    lastAutoRefresh = now;
    try {
      await navigate(App.currentPage, { silent: true });
    } finally {
      autoRefreshRunning = false;
    }
  }

  Api.onChange(() => {
    refreshPending = true;
    refreshCurrentPage();
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshCurrentPage();
  });
  window.addEventListener('focus', () => refreshCurrentPage());

  const refreshButton = document.getElementById('refresh-data-button');
  refreshButton.addEventListener('click', async () => {
    refreshButton.disabled = true;
    refreshButton.classList.add('is-refreshing');
    try {
      await refreshCurrentPage({ force: true });
      UI.toast('Veriler yenilendi.');
    } finally {
      refreshButton.disabled = false;
      refreshButton.classList.remove('is-refreshing');
    }
  });

  function statCard(label, value, icon, tone = '', page = '') {
    const tag = page ? 'button' : 'article';
    return `<${tag} class="stat-card${page ? ' stat-card-link' : ''}"${page ? ` type="button" data-page="${page}"` : ''}><div class="stat-copy"><span>${UI.escapeHtml(label)}</span><strong>${Number(value) || 0}</strong></div><span class="stat-icon ${tone}">${UI.icon(icon)}</span></${tag}>`;
  }

  async function showOverview() {
    const role = App.me.role;
    const scope = role === 'PERSONNEL' ? 'mine' : role === 'MANAGER' ? 'team' : 'all';
    const [summary, requests] = await Promise.all([Api.get('/api/dashboard/summary'), Api.get(`/api/leave-requests?scope=${scope}`)]);
    const stats = role === 'PERSONNEL'
      ? [statCard('Toplam talep', summary.totalRequests, 'files', '', 'my-requests'), statCard('Bekleyen', summary.pending, 'clock-3', 'warning', 'my-requests'), statCard('Onaylanan', summary.approved, 'circle-check', 'success', 'my-requests'), statCard('Reddedilen', summary.rejected, 'circle-x', 'danger', 'my-requests')]
      : role === 'MANAGER'
        ? [statCard('Departman çalışanı', summary.employees, 'users', '', 'employees'), statCard('Bekleyen talep', summary.pending, 'clock-3', 'warning', 'team-requests'), statCard('Onaylanan', summary.approved, 'circle-check', 'success', 'team-requests'), statCard('Reddedilen', summary.rejected, 'circle-x', 'danger', 'team-requests')]
        : [statCard('Aktif kullanıcı', summary.users, 'users', '', 'users'), statCard('Aktif departman', summary.departments, 'building-2', '', 'departments'), statCard('Bekleyen talep', summary.pending, 'clock-3', 'warning', 'all-requests'), statCard('Onaylanan', summary.approved, 'circle-check', 'success', 'all-requests')];
    const recent = requests.slice(0, 5);
    const organization = App.settings?.organizationName || 'Kurum';
    const context = App.me.department?.name ? `${organization} · ${App.me.department.name}` : organization;
    content.innerHTML = `<section class="welcome-panel"><div><span class="eyebrow">${role === 'PERSONNEL' ? 'İYİ ÇALIŞMALAR' : 'YÖNETİM ÖZETİ'}</span><h2>Hoş geldiniz, ${UI.escapeHtml(App.me.firstName)}</h2><p>${UI.escapeHtml(context)} · ${UI.escapeHtml(App.me.position)}</p></div><span class="welcome-mark">${UI.icon(role === 'PERSONNEL' ? 'calendar-check' : role === 'MANAGER' ? 'users' : 'shield-check')}</span></section>
      <section class="stats-grid">${stats.join('')}</section>
      <div class="content-grid"><section class="panel"><header class="panel-header"><div><h3>Son izin talepleri</h3><p>En son oluşturulan talepler ve güncel durumları</p></div><button class="button button-ghost button-small" data-page="${role === 'PERSONNEL' ? 'my-requests' : role === 'MANAGER' ? 'team-requests' : 'all-requests'}">Tümünü gör</button></header>${recent.length ? `<div class="table-wrap"><table class="data-table overview-requests-table"><thead><tr>${role === 'PERSONNEL' ? '' : '<th>PERSONEL</th>'}<th>İZİN TÜRÜ</th><th>TARİH</th><th>SÜRE</th><th>DURUM</th></tr></thead><tbody>${recent.map((request) => `<tr class="overview-request-row" data-page="${role === 'PERSONNEL' ? 'my-requests' : role === 'MANAGER' ? 'team-requests' : 'all-requests'}" tabindex="0" role="link">${role === 'PERSONNEL' ? '' : `<td>${UI.personCell(request)}</td>`}<td><span class="type-dot type-${UI.escapeHtml(request.leaveType.code.toLowerCase())}"></span>${UI.escapeHtml(request.leaveType.name)}</td><td>${UI.formatDate(request.startDate)} – ${UI.formatDate(request.endDate)}</td><td>${request.workingDays} gün</td><td>${UI.statusBadge(request.status)}</td></tr>`).join('')}</tbody></table></div>` : UI.emptyState('Henüz talep bulunmuyor', role === 'PERSONNEL' ? 'İlk izin talebinizi oluşturarak başlayabilirsiniz.' : 'Görüntülenecek izin talebi bulunmuyor.', role === 'PERSONNEL' ? 'Yeni İzin Talebi' : null, 'new-leave')}</section>
      <section class="panel"><header class="panel-header"><div><h3>Hızlı işlemler</h3><p>Sık kullanılan ekranlara geçin</p></div></header><div class="panel-body quick-actions">${quickActions(role)}</div></section></div>`;
  }

  function quickActions(role) {
    const actions = role === 'PERSONNEL'
      ? [{ action: 'new-leave', label: 'Yeni izin talebi', icon: 'calendar-plus' }, { page: 'my-requests', label: 'Taleplerimi görüntüle', icon: 'calendar-check' }, { page: 'profile', label: 'Bilgilerimi güncelle', icon: 'user-round' }]
      : role === 'MANAGER'
        ? [{ action: 'new-leave', label: 'Kendi izin talebim', icon: 'calendar-plus' }, { page: 'team-requests', label: 'Bekleyen talepler', icon: 'clipboard-check' }, { page: 'employees', label: 'Departman çalışanları', icon: 'users' }]
        : [{ action: 'new-user', label: 'Yeni kullanıcı', icon: 'user-plus' }, { action: 'new-leave', label: 'Kendi izin talebim', icon: 'calendar-plus' }, { page: 'settings', label: 'Sistem ayarları', icon: 'settings' }];
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
    else if (action === 'approve-leave') LeavePages.openDecision(id, 'APPROVED');
    else if (action === 'reject-leave') LeavePages.openDecision(id, 'REJECTED');
    else if (action === 'close-decision-modal') UI.closeDecisionModal();
    else if (action === 'delete-own-leave') LeavePages.removeOwn(id);
    else if (action === 'new-user') AdminPages.openUserForm();
    else if (action === 'edit-user') AdminPages.openUserForm(id);
    else if (action === 'toggle-user') AdminPages.toggleUser(id, actionButton.dataset.active === 'true');
    else if (action === 'delete-user') AdminPages.deleteUser(id);
    else if (action === 'reset-password') AdminPages.openPasswordReset(id);
    else if (action === 'show-credentials') AdminPages.openTemporaryCredentials(id);
    else if (action === 'new-department') AdminPages.openDepartmentForm();
    else if (action === 'edit-department') AdminPages.openDepartmentForm(id);
    else if (action === 'toggle-department') AdminPages.toggleDepartment(id, actionButton.dataset.active === 'true');
    else if (action === 'delete-department') AdminPages.deleteDepartment(id);
    else if (action === 'new-position') AdminPages.openPositionForm();
    else if (action === 'edit-position') AdminPages.openPositionForm(id);
    else if (action === 'toggle-position') AdminPages.togglePosition(id, actionButton.dataset.active === 'true');
    else if (action === 'delete-position') AdminPages.deletePosition(id);
    else if (action === 'new-leave-type') AdminPages.openLeaveTypeForm();
    else if (action === 'edit-leave-type') AdminPages.openLeaveTypeForm(id);
    else if (action === 'delete-leave-type') AdminPages.deleteLeaveType(id);
    else if (action === 'delete-leave') LeavePages.remove(id);
    else if (action === 'clear-operations') AdminPages.openDataAction('clear');
    else if (action === 'factory-reset') AdminPages.openDataAction('factory');
  });

  document.getElementById('drawer-close').addEventListener('click', UI.closeDrawer);
  document.getElementById('drawer-backdrop').addEventListener('click', UI.closeDrawer);
  document.getElementById('decision-modal-close').addEventListener('click', UI.closeDecisionModal);
  document.getElementById('decision-modal-backdrop').addEventListener('click', (event) => { if (event.target === event.currentTarget) UI.closeDecisionModal(); });
  document.getElementById('mobile-menu').addEventListener('click', () => { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebar-scrim').classList.add('open'); });
  document.getElementById('sidebar-scrim').addEventListener('click', closeMobileMenu);
  document.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.overview-request-row[data-page]')) { event.preventDefault(); navigate(event.target.dataset.page); }
    if (event.key === 'Escape' && !document.getElementById('decision-modal-backdrop').hidden) UI.closeDecisionModal();
    else if (event.key === 'Escape' && !document.getElementById('drawer').hidden) UI.closeDrawer();
  });
  document.getElementById('logout-button').addEventListener('click', async () => { try { await Api.post('/api/auth/logout'); } finally { window.location.replace(Portal.url('/login.html')); } });

  Promise.all([Api.get('/api/auth/me'), Api.get('/api/setup/status')]).then(([user, setup]) => {
    if (user.mustChangePassword) return window.location.replace(Portal.url('/change-password.html'));
    App.me = user;
    App.settings = setup.settings;
    renderOrganization(); renderAccount(); renderMenu(); navigate('overview').then(() => {
      if (refreshPending) refreshCurrentPage();
    });
  }).catch(() => window.location.replace(Portal.url('/login.html')));
})();
