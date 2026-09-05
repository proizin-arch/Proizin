(function () {
  const e = UI.escapeHtml;

  async function showEmployees(container) {
    const users = await Api.get('/api/users?active=true&role=PERSONNEL');
    container.innerHTML = `<div class="page-head"><div><h2>Departman çalışanları</h2><p>${e(App.me.department?.name || '')} departmanındaki aktif personel.</p></div></div><section class="panel">${users.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>ÇALIŞAN</th><th>E-POSTA</th><th>POZİSYON</th><th>ROL</th><th>DURUM</th></tr></thead><tbody>${users.map((user) => `<tr><td>${UI.personCell(user)}</td><td>${e(user.email)}</td><td>${e(user.position)}</td><td>${e(UI.roleMap[user.role])}</td><td><span class="status-badge status-active">Aktif</span></td></tr>`).join('')}</tbody></table></div>` : UI.emptyState('Çalışan bulunamadı', 'Departmanınızda listelenecek aktif çalışan bulunmuyor.')}</section>`;
  }

  async function showUsers(container) {
    const users = await Api.get('/api/users');
    container.innerHTML = `<div class="page-head"><div><h2>Kullanıcı yönetimi</h2><p>Kullanıcı hesaplarını, rollerini ve erişim durumlarını yönetin.</p></div><div class="page-actions"><button class="button button-primary" data-action="new-user">${UI.icon('user-plus')} Yeni Kullanıcı</button></div></div>
      <form class="filters" id="user-filters"><div class="filter-search">${UI.icon('search')}<input name="search" placeholder="Ad, e-posta veya pozisyon ara"></div><select name="role"><option value="">Tüm roller</option><option value="PERSONNEL">Personel</option><option value="MANAGER">Yönetici</option><option value="ADMIN">Sistem Yöneticisi</option></select><select name="active"><option value="">Tüm durumlar</option><option value="true">Aktif</option><option value="false">Pasif</option></select><button class="button button-secondary button-small" type="submit">Filtrele</button></form>
      <section class="panel" id="user-results">${renderUsers(users)}</section>`;
    container.querySelector('#user-filters').addEventListener('submit', async (event) => {
      event.preventDefault(); const params = new URLSearchParams();
      new FormData(event.currentTarget).forEach((value, key) => { if (value) params.set(key, value); });
      try { container.querySelector('#user-results').innerHTML = renderUsers(await Api.get(`/api/users?${params}`)); }
      catch (error) { UI.toast(error.message, 'error'); }
    });
  }

  function renderUsers(users) {
    if (!users.length) return UI.emptyState('Kullanıcı bulunamadı', 'Seçilen ölçütlere uygun kullanıcı kaydı bulunmuyor.');
    return `<div class="table-wrap"><table class="data-table"><thead><tr><th>KULLANICI</th><th>E-POSTA</th><th>DEPARTMAN</th><th>ROL</th><th>DURUM</th><th>İŞLEM</th></tr></thead><tbody>${users.map((user) => `<tr><td>${UI.personCell(user)}</td><td>${e(user.email)}</td><td>${e(user.department?.name || '—')}</td><td>${e(UI.roleMap[user.role])}</td><td><span class="status-badge status-${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Aktif' : 'Pasif'}</span></td><td><div class="row-actions"><button class="action-link" data-action="edit-user" data-id="${user.id}">Düzenle</button><button class="action-link" data-action="reset-password" data-id="${user.id}">Şifre</button>${user.id !== App.me.id ? `<button class="action-link ${user.isActive ? 'danger' : 'success'}" data-action="toggle-user" data-id="${user.id}" data-active="${!user.isActive}">${user.isActive ? 'Pasifleştir' : 'Aktifleştir'}</button>` : ''}</div></td></tr>`).join('')}</tbody></table></div>`;
  }

  async function openUserForm(id) {
    try {
      const [departments, user] = await Promise.all([
        Api.get('/api/departments?activeOnly=true'),
        id ? Api.get(`/api/users/${id}`) : Promise.resolve(null)
      ]);
      UI.openDrawer({ title: id ? 'Kullanıcıyı düzenle' : 'Yeni kullanıcı', eyebrow: 'KULLANICI YÖNETİMİ', content: `<form class="drawer-form" id="user-form">
        <div class="field"><label for="firstName">Ad</label><input id="firstName" name="firstName" value="${e(user?.firstName || '')}" required></div>
        <div class="field"><label for="lastName">Soyad</label><input id="lastName" name="lastName" value="${e(user?.lastName || '')}" required></div>
        <div class="field field-wide"><label for="email">E-posta</label><input id="email" name="email" type="email" value="${e(user?.email || '')}" required></div>
        ${id ? '' : `<div class="field field-wide"><label for="password">Geçici şifre</label><input id="password" name="password" type="password" required><small>En az 8 karakter; büyük/küçük harf, rakam ve özel karakter.</small></div>`}
        <div class="field"><label for="role">Rol</label><select id="role" name="role"><option value="PERSONNEL" ${user?.role === 'PERSONNEL' ? 'selected' : ''}>Personel</option><option value="MANAGER" ${user?.role === 'MANAGER' ? 'selected' : ''}>Yönetici</option><option value="ADMIN" ${user?.role === 'ADMIN' ? 'selected' : ''}>Sistem Yöneticisi</option></select></div>
        <div class="field"><label for="departmentId">Departman</label><select id="departmentId" name="departmentId"><option value="">Departmansız</option>${departments.map((d) => `<option value="${d.id}" ${user?.department?.id === d.id ? 'selected' : ''}>${e(d.name)}</option>`).join('')}</select></div>
        <div class="field"><label for="position">Pozisyon</label><input id="position" name="position" value="${e(user?.position || '')}" required></div>
        <div class="field"><label for="hireDate">İşe giriş tarihi</label><input id="hireDate" name="hireDate" type="date" value="${e(user?.hireDate || '')}" required></div>
        <div class="field"><label for="birthDate">Doğum tarihi</label><input id="birthDate" name="birthDate" type="date" value="${e(user?.birthDate || '')}"></div>
        <div class="field"><label for="phone">Telefon</label><input id="phone" name="phone" value="${e(user?.phone || '')}"></div>
        <div class="field field-wide"><label for="address">Adres</label><textarea id="address" name="address">${e(user?.address || '')}</textarea></div>
        <p class="form-error field-wide" id="drawer-error" hidden></p><div class="drawer-actions"><button class="button button-secondary" type="button" data-action="close-drawer">Vazgeç</button><button class="button button-primary" type="submit">Kaydet</button></div>
      </form>`, onOpen(body) {
        const form = body.querySelector('#user-form');
        form.addEventListener('submit', async (event) => {
          event.preventDefault(); const button = form.querySelector('[type="submit"]'); const errorBox = form.querySelector('#drawer-error'); errorBox.hidden = true; UI.setButtonLoading(button, true);
          try { const payload = Object.fromEntries(new FormData(form).entries()); if (id) await Api.put(`/api/users/${id}`, payload); else await Api.post('/api/users', payload); UI.closeDrawer(); UI.toast(id ? 'Kullanıcı güncellendi.' : 'Kullanıcı oluşturuldu.'); App.navigate('users'); }
          catch (error) { errorBox.textContent = error.message; errorBox.hidden = false; UI.setButtonLoading(button, false); }
        });
      }});
    } catch (error) { UI.toast(error.message, 'error'); }
  }

  async function toggleUser(id, active) {
    if (!(await UI.confirmAction(`Kullanıcı hesabını ${active ? 'aktif' : 'pasif'} duruma getirmek istediğinize emin misiniz?`, active ? 'Aktifleştir' : 'Pasifleştir'))) return;
    try { await Api.patch(`/api/users/${id}/status`, { isActive: active }); UI.toast(`Kullanıcı ${active ? 'aktifleştirildi' : 'pasifleştirildi'}.`); App.navigate('users'); }
    catch (error) { UI.toast(error.message, 'error'); }
  }

  function openPasswordReset(id) {
    UI.openDrawer({ title: 'Şifreyi sıfırla', eyebrow: 'KULLANICI GÜVENLİĞİ', content: `<form class="drawer-form" id="reset-form"><div class="field field-wide"><label for="newPassword">Yeni geçici şifre</label><input id="newPassword" name="newPassword" type="password" autocomplete="new-password" required><small>En az 8 karakter; büyük/küçük harf, rakam ve özel karakter.</small></div><div class="field field-wide"><label for="confirmPassword">Şifre tekrar</label><input id="confirmPassword" name="confirmPassword" type="password" autocomplete="new-password" required></div><p class="form-error field-wide" id="drawer-error" hidden></p><div class="drawer-actions"><button class="button button-secondary" type="button" data-action="close-drawer">Vazgeç</button><button class="button button-primary" type="submit">Şifreyi Sıfırla</button></div></form>`, onOpen(body) {
      const form = body.querySelector('#reset-form');
      form.addEventListener('submit', async (event) => { event.preventDefault(); const errorBox = form.querySelector('#drawer-error'); errorBox.hidden = true; if (form.newPassword.value !== form.confirmPassword.value) { errorBox.textContent = 'Şifreler birbiriyle eşleşmiyor.'; errorBox.hidden = false; return; } const button = form.querySelector('[type="submit"]'); UI.setButtonLoading(button, true); try { await Api.post(`/api/users/${id}/reset-password`, { newPassword: form.newPassword.value }); UI.closeDrawer(); UI.toast('Kullanıcı şifresi sıfırlandı.'); } catch (error) { errorBox.textContent = error.message; errorBox.hidden = false; UI.setButtonLoading(button, false); } });
    }});
  }

  async function showDepartments(container) {
    const departments = await Api.get('/api/departments');
    container.innerHTML = `<div class="page-head"><div><h2>Departmanlar</h2><p>Şirket departmanlarını ve bağlı yöneticileri düzenleyin.</p></div><div class="page-actions"><button class="button button-primary" data-action="new-department">${UI.icon('plus')} Yeni Departman</button></div></div><div class="cards-grid">${departments.map((department) => `<article class="entity-card"><div class="entity-card-head"><div><h3>${e(department.name)}</h3><p>${e(department.managerName || 'Yönetici atanmamış')}</p></div><span class="status-badge status-${department.isActive ? 'active' : 'inactive'}">${department.isActive ? 'Aktif' : 'Pasif'}</span></div><div class="entity-card-meta"><span>Çalışan<strong>${department.employeeCount}</strong></span><span>İşlem<strong><button class="action-link" data-action="edit-department" data-id="${department.id}">Düzenle</button><button class="action-link ${department.isActive ? 'danger' : 'success'}" data-action="toggle-department" data-id="${department.id}" data-active="${!department.isActive}">${department.isActive ? 'Pasifleştir' : 'Aktifleştir'}</button></strong></span></div></article>`).join('')}</div>`;
  }

  async function openDepartmentForm(id) {
    try {
      const [departments, managers] = await Promise.all([Api.get('/api/departments'), Api.get('/api/users?role=MANAGER&active=true')]);
      const department = departments.find((item) => item.id === Number(id));
      const availableManagers = id ? managers.filter((manager) => manager.department?.id === Number(id)) : [];
      UI.openDrawer({ title: id ? 'Departmanı düzenle' : 'Yeni departman', eyebrow: 'DEPARTMAN YÖNETİMİ', content: `<form class="drawer-form" id="department-form"><div class="field field-wide"><label for="name">Departman adı</label><input id="name" name="name" value="${e(department?.name || '')}" required></div>${id ? `<div class="field field-wide"><label for="managerId">Departman yöneticisi</label><select id="managerId" name="managerId"><option value="">Yönetici atanmamış</option>${availableManagers.map((m) => `<option value="${m.id}" ${department?.managerId === m.id ? 'selected' : ''}>${e(m.fullName)}</option>`).join('')}</select><small>Listede yalnızca bu departmandaki Yönetici rolüne sahip kullanıcılar görünür.</small></div>` : ''}<p class="form-error field-wide" id="drawer-error" hidden></p><div class="drawer-actions"><button class="button button-secondary" type="button" data-action="close-drawer">Vazgeç</button><button class="button button-primary" type="submit">Kaydet</button></div></form>`, onOpen(body) {
        const form = body.querySelector('#department-form'); form.addEventListener('submit', async (event) => { event.preventDefault(); const button = form.querySelector('[type="submit"]'); const errorBox = form.querySelector('#drawer-error'); errorBox.hidden = true; UI.setButtonLoading(button, true); try { const payload = Object.fromEntries(new FormData(form).entries()); if (id) await Api.put(`/api/departments/${id}`, payload); else await Api.post('/api/departments', payload); UI.closeDrawer(); UI.toast(id ? 'Departman güncellendi.' : 'Departman oluşturuldu.'); App.navigate('departments'); } catch (error) { errorBox.textContent = error.message; errorBox.hidden = false; UI.setButtonLoading(button, false); } });
      }});
    } catch (error) { UI.toast(error.message, 'error'); }
  }

  async function toggleDepartment(id, active) {
    if (!(await UI.confirmAction(`Departmanı ${active ? 'aktif' : 'pasif'} duruma getirmek istediğinize emin misiniz?`, active ? 'Aktifleştir' : 'Pasifleştir'))) return;
    try { await Api.patch(`/api/departments/${id}/status`, { isActive: active }); UI.toast(`Departman ${active ? 'aktifleştirildi' : 'pasifleştirildi'}.`); App.navigate('departments'); } catch (error) { UI.toast(error.message, 'error'); }
  }

  async function showLeaveTypes(container) {
    const types = await Api.get('/api/leave-types');
    container.innerHTML = `<div class="page-head"><div><h2>İzin türleri</h2><p>Personelin talep oluştururken kullanabileceği izin seçenekleri.</p></div><div class="page-actions"><button class="button button-primary" data-action="new-leave-type">${UI.icon('plus')} Yeni İzin Türü</button></div></div><section class="panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>İZİN TÜRÜ</th><th>KOD</th><th>DURUM</th><th>İŞLEM</th></tr></thead><tbody>${types.map((type) => `<tr><td>${typeLabel(type)}</td><td>${e(type.code)}</td><td><span class="status-badge status-${type.isActive ? 'active' : 'inactive'}">${type.isActive ? 'Aktif' : 'Pasif'}</span></td><td><button class="action-link" data-action="edit-leave-type" data-id="${type.id}">Düzenle</button></td></tr>`).join('')}</tbody></table></div></section>`;
  }

  function typeLabel(type) { return `<span class="type-dot type-${e(type.code.toLowerCase())}"></span>${e(type.name)}`; }

  async function openLeaveTypeForm(id) {
    try {
      const types = await Api.get('/api/leave-types'); const type = types.find((item) => item.id === Number(id));
      UI.openDrawer({ title: id ? 'İzin türünü düzenle' : 'Yeni izin türü', eyebrow: 'İZİN TÜRÜ YÖNETİMİ', content: `<form class="drawer-form" id="type-form"><div class="field field-wide"><label for="name">İzin türü adı</label><input id="name" name="name" value="${e(type?.name || '')}" required></div><div class="field"><label for="code">Kod</label><input id="code" name="code" value="${e(type?.code || '')}" placeholder="UZAKTAN_CALISMA" required></div><div class="field"><label for="color">Renk</label><input id="color" name="color" type="color" value="${e(type?.color || '#3977D3')}"></div>${id ? `<label class="check-row field-wide"><input name="isActive" type="checkbox" ${type?.isActive ? 'checked' : ''}><span>Aktif izin türü</span></label>` : ''}<p class="form-error field-wide" id="drawer-error" hidden></p><div class="drawer-actions"><button class="button button-secondary" type="button" data-action="close-drawer">Vazgeç</button><button class="button button-primary" type="submit">Kaydet</button></div></form>`, onOpen(body) {
        const form = body.querySelector('#type-form'); form.addEventListener('submit', async (event) => { event.preventDefault(); const button = form.querySelector('[type="submit"]'); const errorBox = form.querySelector('#drawer-error'); errorBox.hidden = true; UI.setButtonLoading(button, true); const payload = Object.fromEntries(new FormData(form).entries()); payload.isActive = id ? form.isActive.checked : true; try { if (id) await Api.put(`/api/leave-types/${id}`, payload); else await Api.post('/api/leave-types', payload); UI.closeDrawer(); UI.toast(id ? 'İzin türü güncellendi.' : 'İzin türü oluşturuldu.'); App.navigate('leave-types'); } catch (error) { errorBox.textContent = error.message; errorBox.hidden = false; UI.setButtonLoading(button, false); } });
      }});
    } catch (error) { UI.toast(error.message, 'error'); }
  }

  window.AdminPages = { showEmployees, showUsers, openUserForm, toggleUser, openPasswordReset, showDepartments, openDepartmentForm, toggleDepartment, showLeaveTypes, openLeaveTypeForm };
})();
