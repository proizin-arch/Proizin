(function () {
  const e = UI.escapeHtml;

  async function showEmployees(container) {
    const users = await Api.get('/api/users?active=true');
    container.innerHTML = `<div class="page-head"><div><h2>Departman çalışanları</h2><p>${e(App.me.department?.name || '')} departmanındaki aktif kullanıcılar.</p></div></div><section class="panel">${users.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>ÇALIŞAN</th><th>KULLANICI ADRESİ</th><th>POZİSYON</th><th>YETKİ</th><th>DURUM</th></tr></thead><tbody>${users.map((user) => `<tr><td>${UI.personCell(user)}</td><td>${e(user.email)}</td><td>${e(user.position)}</td><td>${e(UI.roleMap[user.role])}</td><td><span class="status-badge status-active">Aktif</span></td></tr>`).join('')}</tbody></table></div>` : UI.emptyState('Çalışan bulunamadı', 'Departmanınızda listelenecek aktif kullanıcı bulunmuyor.')}</section>`;
  }

  async function showUsers(container) {
    const [users, departments] = await Promise.all([
      Api.get('/api/users'),
      Api.get('/api/departments?activeOnly=true')
    ]);
    container.innerHTML = `<div class="page-head"><div><h2>Kullanıcı yönetimi</h2><p>Tek hesap üzerinden personel, yönetici ve admin yetkilerini yönetin.</p></div><div class="page-actions"><button class="button button-primary" data-action="new-user">${UI.icon('user-plus')} Yeni Kullanıcı</button></div></div>
      <form class="filters" id="user-filters"><div class="filter-search">${UI.icon('search')}<input name="search" placeholder="Ad, kullanıcı adresi veya pozisyon ara"></div><select name="departmentId" aria-label="Departmana göre filtrele"><option value="">Tüm departmanlar</option>${departments.map((department) => `<option value="${department.id}">${e(department.name)}</option>`).join('')}</select><select name="role"><option value="">Tüm yetkiler</option><option value="PERSONNEL">Personel</option><option value="MANAGER">Yönetici</option><option value="ADMIN">Admin</option></select><select name="active"><option value="">Tüm durumlar</option><option value="true">Aktif</option><option value="false">Pasif</option></select><button class="button button-secondary button-small" type="submit">Filtrele</button></form>
      <section class="panel" id="user-results">${renderUsers(users)}</section>`;
    container.querySelector('#user-filters').addEventListener('submit', async (event) => {
      event.preventDefault();
      const params = new URLSearchParams();
      new FormData(event.currentTarget).forEach((value, key) => { if (value) params.set(key, value); });
      try { container.querySelector('#user-results').innerHTML = renderUsers(await Api.get(`/api/users?${params}`)); }
      catch (error) { UI.toast(error.message, 'error'); }
    });
  }

  function renderUsers(users) {
    if (!users.length) return UI.emptyState('Kullanıcı bulunamadı', 'Seçilen ölçütlere uygun kullanıcı kaydı bulunmuyor.');
    return `<div class="table-wrap"><table class="data-table"><thead><tr><th>KULLANICI</th><th>KULLANICI ADRESİ</th><th>DEPARTMAN</th><th>YETKİ</th><th>DURUM</th><th>İŞLEM</th></tr></thead><tbody>${users.map((user) => `<tr><td>${UI.personCell(user)}</td><td>${e(user.email)}${user.mustChangePassword ? '<small class="inline-note">İlk giriş bekleniyor</small>' : ''}</td><td>${e(user.department?.name || '—')}</td><td>${e(UI.roleMap[user.role])}</td><td><span class="status-badge status-${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Aktif' : 'Pasif'}</span></td><td><div class="row-actions">${user.temporaryPasswordAvailable ? `<button class="action-link" data-action="show-credentials" data-id="${user.id}">Giriş Bilgileri</button>` : ''}<button class="action-link" data-action="edit-user" data-id="${user.id}">Düzenle</button><button class="action-link" data-action="reset-password" data-id="${user.id}">${user.mustChangePassword && !user.temporaryPasswordAvailable ? 'Yeni Şifre' : 'Şifre'}</button>${user.id !== App.me.id ? `<button class="action-link ${user.isActive ? 'danger' : 'success'}" data-action="toggle-user" data-id="${user.id}" data-active="${!user.isActive}">${user.isActive ? 'Pasifleştir' : 'Aktifleştir'}</button><button class="action-link danger" data-action="delete-user" data-id="${user.id}">Sil</button>` : ''}</div></td></tr>`).join('')}</tbody></table></div>`;
  }

  const trMap = { ç: 'c', ğ: 'g', ı: 'i', i: 'i', ö: 'o', ş: 's', ü: 'u' };
  function slug(value) {
    return String(value || '').trim().toLocaleLowerCase('tr-TR').split('').map((char) => trMap[char] || char).join('').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
  }

  function randomIndex(max) {
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    return values[0] % max;
  }

  function generateTemporaryPassword() {
    const groups = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%*?'];
    const all = groups.join('');
    const characters = groups.map((group) => group[randomIndex(group.length)]);
    while (characters.length < 12) characters.push(all[randomIndex(all.length)]);
    for (let index = characters.length - 1; index > 0; index -= 1) {
      const swap = randomIndex(index + 1);
      [characters[index], characters[swap]] = [characters[swap], characters[index]];
    }
    return characters.join('');
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
      UI.toast('Panoya kopyalandı.');
    } catch (_error) {
      const input = document.createElement('textarea');
      input.value = value;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
      UI.toast('Panoya kopyalandı.');
    }
  }

  function showCredentials(body, email, temporaryPassword) {
    body.innerHTML = `<div class="credential-result">
      <span class="credential-result-icon">${UI.icon('circle-check')}</span>
      <span class="eyebrow">KULLANICI HAZIR</span><h3>Giriş bilgilerini kullanıcıya iletin</h3>
      <p>Bu bilgiler kullanıcı yeni şifresini belirleyene kadar admin tarafından tekrar görüntülenebilir.</p>
      <div class="credential-line"><span>Kullanıcı adresi</span><strong>${e(email)}</strong><button class="icon-button" id="copy-email" type="button" aria-label="Kullanıcı adresini kopyala">${UI.icon('copy')}</button></div>
      <div class="credential-line"><span>Geçici şifre</span><strong>${e(temporaryPassword)}</strong><button class="icon-button" id="copy-password" type="button" aria-label="Geçici şifreyi kopyala">${UI.icon('copy')}</button></div>
      <div class="info-callout compact">${UI.icon('shield-check')}<div><strong>Geçici erişim bilgisi</strong><p>Kullanıcı yeni şifresini kaydettiğinde geçici şifre kalıcı olarak silinir.</p></div></div>
      <div class="drawer-actions"><button class="button button-primary" type="button" data-action="close-drawer">Tamam</button></div>
    </div>`;
    body.querySelector('#copy-email').addEventListener('click', () => copyText(email));
    body.querySelector('#copy-password').addEventListener('click', () => copyText(temporaryPassword));
  }

  async function openTemporaryCredentials(id) {
    try {
      const credentials = await Api.get(`/api/users/${id}/temporary-credentials`);
      UI.openDrawer({ title: 'Giriş bilgileri', eyebrow: 'KULLANICI GÜVENLİĞİ', content: '<div class="page-loading"><span class="spinner"></span><p>Bilgiler yükleniyor…</p></div>', onOpen(body) {
        showCredentials(body, credentials.email, credentials.temporaryPassword);
      }});
    } catch (error) { UI.toast(error.message, 'error'); }
  }

  async function openUserForm(id) {
    try {
      const [departments, positions, user] = await Promise.all([
        Api.get('/api/departments?activeOnly=true'),
        Api.get('/api/positions?activeOnly=true'),
        id ? Api.get(`/api/users/${id}`) : Promise.resolve(null)
      ]);
      UI.openDrawer({
        title: id ? 'Kullanıcıyı düzenle' : 'Yeni kullanıcı',
        eyebrow: 'KULLANICI YÖNETİMİ',
        content: `<form class="drawer-form" id="user-form">
          <div class="field"><label for="firstName">Ad</label><input id="firstName" name="firstName" value="${e(user?.firstName || '')}" required></div>
          <div class="field"><label for="lastName">Soyad</label><input id="lastName" name="lastName" value="${e(user?.lastName || '')}" required></div>
          <div class="field field-wide"><label>Kullanıcı adresi</label><div class="generated-address compact"><img src="/icons/at-sign.svg" alt=""><output id="generated-user-address">${e(user?.email || 'ad.soyad@izinpro.com')}</output></div><small>${id ? 'Kullanıcı adresi hesap güvenliği için değiştirilemez.' : 'Adres ad ve soyaddan otomatik oluşturulur. Aynı adres varsa sonuna sayı eklenir.'}</small></div>
          ${id ? '' : `<div class="field field-wide"><label for="password">Geçici şifre</label><div class="temporary-password-control"><input id="password" name="password" type="text" autocomplete="off" readonly required><button class="button button-secondary button-small" id="regenerate-password" type="button">${UI.icon('refresh-cw')} Yenile</button><button class="button button-secondary button-small" id="copy-generated-password" type="button">${UI.icon('copy')} Kopyala</button></div><small>Güçlü şifre otomatik üretildi. Kullanıcı ilk girişinde bunu değiştirmek zorundadır.</small></div>`}
          <div class="field"><label for="role">Yetki</label><select id="role" name="role"><option value="PERSONNEL" ${user?.role === 'PERSONNEL' ? 'selected' : ''}>Personel</option><option value="MANAGER" ${user?.role === 'MANAGER' ? 'selected' : ''}>Yönetici</option><option value="ADMIN" ${user?.role === 'ADMIN' ? 'selected' : ''}>Admin</option></select></div>
          <div class="field"><label for="departmentId">Departman</label><select id="departmentId" name="departmentId"><option value="">${departments.length ? 'Departman seçin' : 'Önce departman oluşturun'}</option>${departments.map((department) => `<option value="${department.id}" ${user?.department?.id === department.id ? 'selected' : ''}>${e(department.name)}</option>`).join('')}</select><small id="department-help">Personel ve yöneticiler için zorunludur.</small></div>
          <div class="field"><label for="positionId">Pozisyon</label><select id="positionId" name="positionId" required><option value="">${positions.length ? 'Pozisyon seçin' : 'Önce pozisyon oluşturun'}</option>${positions.map((position) => `<option value="${position.id}" ${user?.positionId === position.id ? 'selected' : ''}>${e(position.name)}</option>`).join('')}</select></div>
          <div class="field"><label for="hireDate">İşe giriş tarihi</label><input id="hireDate" name="hireDate" type="date" value="${e(user?.hireDate || new Date().toISOString().slice(0, 10))}" required></div>
          <div class="field"><label for="birthDate">Doğum tarihi <span>(isteğe bağlı)</span></label><input id="birthDate" name="birthDate" type="date" value="${e(user?.birthDate || '')}"></div>
          <div class="field"><label for="phone">Telefon <span>(isteğe bağlı)</span></label><input id="phone" name="phone" value="${e(user?.phone || '')}"></div>
          <div class="field field-wide"><label for="address">Adres <span>(isteğe bağlı)</span></label><textarea id="address" name="address">${e(user?.address || '')}</textarea></div>
          <p class="form-error field-wide" id="drawer-error" hidden></p>
          <div class="drawer-actions"><button class="button button-secondary" type="button" data-action="close-drawer">Vazgeç</button><button class="button button-primary" type="submit">Kaydet</button></div>
        </form>`,
        onOpen(body) {
          const form = body.querySelector('#user-form');
          const output = body.querySelector('#generated-user-address');
          if (!id) {
            const passwordInput = form.querySelector('#password');
            const refreshPassword = () => { passwordInput.value = generateTemporaryPassword(); };
            refreshPassword();
            form.querySelector('#regenerate-password').addEventListener('click', refreshPassword);
            form.querySelector('#copy-generated-password').addEventListener('click', () => copyText(passwordInput.value));
          }
          const updateAddress = () => { if (!id) output.textContent = `${slug(form.firstName.value) || 'ad'}.${slug(form.lastName.value) || 'soyad'}@izinpro.com`; };
          const updateDepartment = () => {
            const optional = form.role.value === 'ADMIN';
            form.departmentId.required = !optional;
            body.querySelector('#department-help').textContent = optional ? 'Admin hesabında departman isteğe bağlıdır.' : 'Personel ve yöneticiler için zorunludur.';
          };
          form.firstName.addEventListener('input', updateAddress);
          form.lastName.addEventListener('input', updateAddress);
          form.role.addEventListener('change', updateDepartment);
          updateDepartment();
          form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const button = form.querySelector('[type="submit"]');
            const errorBox = form.querySelector('#drawer-error');
            errorBox.hidden = true;
            UI.setButtonLoading(button, true);
            try {
              const payload = Object.fromEntries(new FormData(form).entries());
              const saved = id ? await Api.put(`/api/users/${id}`, payload) : await Api.post('/api/users', payload);
              if (id) {
                UI.closeDrawer();
                UI.toast('Kullanıcı güncellendi.');
                App.navigate('users');
              } else {
                const temporaryPassword = payload.password;
                await App.navigate('users');
                showCredentials(body, saved.email, temporaryPassword);
              }
            } catch (error) {
              errorBox.textContent = error.message;
              errorBox.hidden = false;
              UI.setButtonLoading(button, false);
            }
          });
        }
      });
    } catch (error) { UI.toast(error.message, 'error'); }
  }

  async function toggleUser(id, active) {
    if (!(await UI.confirmAction(`Kullanıcı hesabını ${active ? 'aktif' : 'pasif'} duruma getirmek istediğinize emin misiniz?`, active ? 'Aktifleştir' : 'Pasifleştir'))) return;
    try { await Api.patch(`/api/users/${id}/status`, { isActive: active }); UI.toast(`Kullanıcı ${active ? 'aktifleştirildi' : 'pasifleştirildi'}.`); App.navigate('users'); }
    catch (error) { UI.toast(error.message, 'error'); }
  }

  async function deleteUser(id) {
    if (!(await UI.confirmAction('Bu kullanıcı kalıcı olarak silinecek. İşlem geçmişi varsa sistem silmeye izin vermeyecektir.', 'Kullanıcıyı Sil'))) return;
    try { await Api.delete(`/api/users/${id}`); UI.toast('Kullanıcı kalıcı olarak silindi.'); App.navigate('users'); }
    catch (error) { UI.toast(error.message, 'error'); }
  }

  async function openPasswordReset(id) {
    try {
      const user = await Api.get(`/api/users/${id}`);
      UI.openDrawer({ title: 'Şifreyi sıfırla', eyebrow: 'KULLANICI GÜVENLİĞİ', content: `<form class="drawer-form" id="reset-form"><div class="field field-wide"><label for="newPassword">Yeni geçici şifre</label><div class="temporary-password-control"><input id="newPassword" name="newPassword" type="text" autocomplete="off" readonly required><button class="button button-secondary button-small" id="regenerate-password" type="button">${UI.icon('refresh-cw')} Yenile</button><button class="button button-secondary button-small" id="copy-generated-password" type="button">${UI.icon('copy')} Kopyala</button></div><small>Kullanıcı sonraki girişinde bu geçici şifreyi değiştirmek zorundadır.</small></div><p class="form-error field-wide" id="drawer-error" hidden></p><div class="drawer-actions"><button class="button button-secondary" type="button" data-action="close-drawer">Vazgeç</button><button class="button button-primary" type="submit">Şifreyi Sıfırla</button></div></form>`, onOpen(body) {
        const form = body.querySelector('#reset-form');
        const passwordInput = form.newPassword;
        const refreshPassword = () => { passwordInput.value = generateTemporaryPassword(); };
        refreshPassword();
        form.querySelector('#regenerate-password').addEventListener('click', refreshPassword);
        form.querySelector('#copy-generated-password').addEventListener('click', () => copyText(passwordInput.value));
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          const errorBox = form.querySelector('#drawer-error');
          const button = form.querySelector('[type="submit"]');
          errorBox.hidden = true;
          UI.setButtonLoading(button, true);
          try {
            const temporaryPassword = passwordInput.value;
            await Api.post(`/api/users/${id}/reset-password`, { newPassword: temporaryPassword });
            await App.navigate('users');
            showCredentials(body, user.email, temporaryPassword);
          } catch (error) { errorBox.textContent = error.message; errorBox.hidden = false; UI.setButtonLoading(button, false); }
        });
      }});
    } catch (error) { UI.toast(error.message, 'error'); }
  }

  async function showDepartments(container) {
    const departments = await Api.get('/api/departments');
    container.innerHTML = `<div class="page-head"><div><h2>Departmanlar</h2><p>Kurum departmanlarını ve bağlı yöneticileri düzenleyin.</p></div><div class="page-actions"><button class="button button-primary" data-action="new-department">${UI.icon('plus')} Yeni Departman</button></div></div>${departments.length ? `<div class="cards-grid">${departments.map((department) => `<article class="entity-card"><div class="entity-card-head"><div><h3>${e(department.name)}</h3><p>${e(department.managerName || 'Yönetici atanmamış')}</p></div><span class="status-badge status-${department.isActive ? 'active' : 'inactive'}">${department.isActive ? 'Aktif' : 'Pasif'}</span></div><div class="entity-card-meta"><span>Çalışan<strong>${department.employeeCount}</strong></span><span>İşlemler<strong><button class="action-link" data-action="edit-department" data-id="${department.id}">Düzenle</button><button class="action-link ${department.isActive ? 'danger' : 'success'}" data-action="toggle-department" data-id="${department.id}" data-active="${!department.isActive}">${department.isActive ? 'Pasifleştir' : 'Aktifleştir'}</button><button class="action-link danger" data-action="delete-department" data-id="${department.id}">Sil</button></strong></span></div></article>`).join('')}</div>` : UI.emptyState('Departman bulunmuyor', 'Kullanıcı eklemeden önce ilk departmanınızı oluşturun.', 'Yeni Departman', 'new-department')}`;
  }

  async function openDepartmentForm(id) {
    try {
      const [departments, managers] = await Promise.all([Api.get('/api/departments'), Api.get('/api/users?active=true')]);
      const department = departments.find((item) => item.id === Number(id));
      const availableManagers = id ? managers.filter((manager) => ['MANAGER', 'ADMIN'].includes(manager.role) && manager.department?.id === Number(id)) : [];
      UI.openDrawer({ title: id ? 'Departmanı düzenle' : 'Yeni departman', eyebrow: 'DEPARTMAN YÖNETİMİ', content: `<form class="drawer-form" id="department-form"><div class="field field-wide"><label for="name">Departman adı</label><input id="name" name="name" value="${e(department?.name || '')}" required></div>${id ? `<div class="field field-wide"><label for="managerId">Departman yöneticisi</label><select id="managerId" name="managerId"><option value="">Yönetici atanmamış</option>${availableManagers.map((manager) => `<option value="${manager.id}" ${department?.managerId === manager.id ? 'selected' : ''}>${e(manager.fullName)}</option>`).join('')}</select><small>Bu departmandaki yönetici veya admin yetkili kullanıcılar listelenir.</small></div>` : ''}<p class="form-error field-wide" id="drawer-error" hidden></p><div class="drawer-actions"><button class="button button-secondary" type="button" data-action="close-drawer">Vazgeç</button><button class="button button-primary" type="submit">Kaydet</button></div></form>`, onOpen(body) {
        const form = body.querySelector('#department-form');
        form.addEventListener('submit', async (event) => {
          event.preventDefault(); const button = form.querySelector('[type="submit"]'); const errorBox = form.querySelector('#drawer-error'); errorBox.hidden = true; UI.setButtonLoading(button, true);
          try { const payload = Object.fromEntries(new FormData(form).entries()); if (id) await Api.put(`/api/departments/${id}`, payload); else await Api.post('/api/departments', payload); UI.closeDrawer(); UI.toast(id ? 'Departman güncellendi.' : 'Departman oluşturuldu.'); App.navigate('departments'); }
          catch (error) { errorBox.textContent = error.message; errorBox.hidden = false; UI.setButtonLoading(button, false); }
        });
      }});
    } catch (error) { UI.toast(error.message, 'error'); }
  }

  async function toggleDepartment(id, active) {
    if (!(await UI.confirmAction(`Departmanı ${active ? 'aktif' : 'pasif'} duruma getirmek istediğinize emin misiniz?`, active ? 'Aktifleştir' : 'Pasifleştir'))) return;
    try { await Api.patch(`/api/departments/${id}/status`, { isActive: active }); UI.toast(`Departman ${active ? 'aktifleştirildi' : 'pasifleştirildi'}.`); App.navigate('departments'); }
    catch (error) { UI.toast(error.message, 'error'); }
  }

  async function deleteDepartment(id) {
    if (!(await UI.confirmAction('Departman kullanılmıyorsa veritabanından kalıcı olarak silinecek.', 'Departmanı Sil'))) return;
    try { await Api.delete(`/api/departments/${id}`); UI.toast('Departman kalıcı olarak silindi.'); App.navigate('departments'); }
    catch (error) { UI.toast(error.message, 'error'); }
  }

  async function showPositions(container) {
    const positions = await Api.get('/api/positions');
    container.innerHTML = `<div class="page-head"><div><h2>Pozisyonlar</h2><p>Kullanıcı hesaplarında seçilebilecek görev ve unvanları yönetin.</p></div><div class="page-actions"><button class="button button-primary" data-action="new-position">${UI.icon('plus')} Yeni Pozisyon</button></div></div><section class="panel">${positions.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>POZİSYON</th><th>KULLANICI SAYISI</th><th>DURUM</th><th>İŞLEM</th></tr></thead><tbody>${positions.map((position) => `<tr><td><strong>${e(position.name)}</strong></td><td>${position.userCount}</td><td><span class="status-badge status-${position.isActive ? 'active' : 'inactive'}">${position.isActive ? 'Aktif' : 'Pasif'}</span></td><td><div class="row-actions"><button class="action-link" data-action="edit-position" data-id="${position.id}">Düzenle</button><button class="action-link ${position.isActive ? 'danger' : 'success'}" data-action="toggle-position" data-id="${position.id}" data-active="${!position.isActive}">${position.isActive ? 'Pasifleştir' : 'Aktifleştir'}</button><button class="action-link danger" data-action="delete-position" data-id="${position.id}">Sil</button></div></td></tr>`).join('')}</tbody></table></div>` : UI.emptyState('Pozisyon bulunmuyor', 'Kullanıcı eklemeden önce ilk pozisyonunuzu oluşturun.', 'Yeni Pozisyon', 'new-position')}</section>`;
  }

  async function openPositionForm(id) {
    try {
      const positions = await Api.get('/api/positions');
      const position = positions.find((item) => item.id === Number(id));
      UI.openDrawer({ title: id ? 'Pozisyonu düzenle' : 'Yeni pozisyon', eyebrow: 'POZİSYON YÖNETİMİ', content: `<form class="drawer-form" id="position-form"><div class="field field-wide"><label for="name">Pozisyon adı</label><input id="name" name="name" value="${e(position?.name || '')}" maxlength="100" required></div><p class="form-error field-wide" id="drawer-error" hidden></p><div class="drawer-actions"><button class="button button-secondary" type="button" data-action="close-drawer">Vazgeç</button><button class="button button-primary" type="submit">Kaydet</button></div></form>`, onOpen(body) {
        const form = body.querySelector('#position-form');
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          const button = form.querySelector('[type="submit"]');
          const errorBox = form.querySelector('#drawer-error');
          errorBox.hidden = true;
          UI.setButtonLoading(button, true);
          try {
            if (id) await Api.put(`/api/positions/${id}`, { name: form.name.value });
            else await Api.post('/api/positions', { name: form.name.value });
            UI.closeDrawer();
            UI.toast(id ? 'Pozisyon güncellendi.' : 'Pozisyon oluşturuldu.');
            App.navigate('positions');
          } catch (error) { errorBox.textContent = error.message; errorBox.hidden = false; UI.setButtonLoading(button, false); }
        });
      }});
    } catch (error) { UI.toast(error.message, 'error'); }
  }

  async function togglePosition(id, active) {
    if (!(await UI.confirmAction(`Pozisyonu ${active ? 'aktif' : 'pasif'} duruma getirmek istediğinize emin misiniz?`, active ? 'Aktifleştir' : 'Pasifleştir'))) return;
    try { await Api.patch(`/api/positions/${id}/status`, { isActive: active }); UI.toast(`Pozisyon ${active ? 'aktifleştirildi' : 'pasifleştirildi'}.`); App.navigate('positions'); }
    catch (error) { UI.toast(error.message, 'error'); }
  }

  async function deletePosition(id) {
    if (!(await UI.confirmAction('Pozisyon kullanılmıyorsa veritabanından kalıcı olarak silinecek.', 'Pozisyonu Sil'))) return;
    try { await Api.delete(`/api/positions/${id}`); UI.toast('Pozisyon kalıcı olarak silindi.'); App.navigate('positions'); }
    catch (error) { UI.toast(error.message, 'error'); }
  }

  async function showLeaveTypes(container) {
    const types = await Api.get('/api/leave-types');
    container.innerHTML = `<div class="page-head"><div><h2>İzin türleri</h2><p>Personelin talep oluştururken kullanabileceği izin seçenekleri.</p></div><div class="page-actions"><button class="button button-primary" data-action="new-leave-type">${UI.icon('plus')} Yeni İzin Türü</button></div></div><section class="panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>İZİN TÜRÜ</th><th>DURUM</th><th>İŞLEM</th></tr></thead><tbody>${types.map((type) => `<tr><td>${e(type.name)}</td><td><span class="status-badge status-${type.isActive ? 'active' : 'inactive'}">${type.isActive ? 'Aktif' : 'Pasif'}</span></td><td><button class="action-link" data-action="edit-leave-type" data-id="${type.id}">Düzenle</button><button class="action-link danger" data-action="delete-leave-type" data-id="${type.id}">Sil</button></td></tr>`).join('')}</tbody></table></div></section>`;
  }

  async function openLeaveTypeForm(id) {
    try {
      const types = await Api.get('/api/leave-types'); const type = types.find((item) => item.id === Number(id));
      UI.openDrawer({ title: id ? 'İzin türünü düzenle' : 'Yeni izin türü', eyebrow: 'İZİN TÜRÜ YÖNETİMİ', content: `<form class="drawer-form" id="type-form"><div class="field field-wide"><label for="name">İzin türü</label><input id="name" name="name" value="${e(type?.name || '')}" placeholder="Örn. Yıllık izin" required></div>${id ? `<label class="check-row field-wide"><input name="isActive" type="checkbox" ${type?.isActive ? 'checked' : ''}><span>Aktif izin türü</span></label>` : ''}<p class="form-error field-wide" id="drawer-error" hidden></p><div class="drawer-actions"><button class="button button-secondary" type="button" data-action="close-drawer">Vazgeç</button><button class="button button-primary" type="submit">Kaydet</button></div></form>`, onOpen(body) {
        const form = body.querySelector('#type-form');
        form.addEventListener('submit', async (event) => {
          event.preventDefault(); const button = form.querySelector('[type="submit"]'); const errorBox = form.querySelector('#drawer-error'); errorBox.hidden = true; UI.setButtonLoading(button, true); const payload = Object.fromEntries(new FormData(form).entries()); payload.isActive = id ? form.isActive.checked : true;
          try { if (id) await Api.put(`/api/leave-types/${id}`, payload); else await Api.post('/api/leave-types', payload); UI.closeDrawer(); UI.toast(id ? 'İzin türü güncellendi.' : 'İzin türü oluşturuldu.'); App.navigate('leave-types'); }
          catch (error) { errorBox.textContent = error.message; errorBox.hidden = false; UI.setButtonLoading(button, false); }
        });
      }});
    } catch (error) { UI.toast(error.message, 'error'); }
  }

  async function deleteLeaveType(id) {
    if (!(await UI.confirmAction('İzin türü kullanılmıyorsa veritabanından kalıcı olarak silinecek.', 'İzin Türünü Sil'))) return;
    try { await Api.delete(`/api/leave-types/${id}`); UI.toast('İzin türü kalıcı olarak silindi.'); App.navigate('leave-types'); }
    catch (error) { UI.toast(error.message, 'error'); }
  }

  async function showSettings(container) {
    const [settings, departments, positions, leaveTypes] = await Promise.all([
      Api.get('/api/settings'), Api.get('/api/departments'), Api.get('/api/positions'), Api.get('/api/leave-types')
    ]);
    container.innerHTML = `<div class="page-head"><div><h2>Sistem ayarları</h2><p>Kurum bilgisini ve yerel veritabanındaki kayıtları yönetin.</p></div></div>
      <div class="settings-stack">
        <section class="panel settings-panel"><header class="panel-header"><div><h3>Kurum bilgisi</h3><p>Kurum adı panelde dinamik gösterilir; İzinPro ürün adı sabit kalır.</p></div></header><div class="panel-body"><form class="settings-form" id="organization-form"><div class="field field-wide"><label for="organizationName">Kurum adı</label><input id="organizationName" name="organizationName" value="${e(settings.organizationName)}" maxlength="100" required></div><div class="field field-wide"><label>Giriş adresi alan adı</label><div class="generated-address compact"><img src="/icons/at-sign.svg" alt=""><output>@${e(settings.loginDomain)}</output></div><small>Mevcut kullanıcı adresleri değişmesin diye sabit tutulur.</small></div><p class="form-error field-wide" id="settings-error" hidden></p><div class="form-actions"><button class="button button-primary" type="submit">Ayarları Kaydet</button></div></form></div></section>
        <section class="panel settings-panel"><header class="panel-header"><div><h3>Kurum yapısı ve seçenekler</h3><p>Kullanıcı oluştururken kullanılacak kayıtları buradan yönetin.</p></div></header><div class="panel-body master-data-grid"><button class="master-data-card" data-page="departments"><span class="master-data-icon">${UI.icon('building-2')}</span><span><strong>Departmanlar</strong><small>${departments.length} kayıt</small></span>${UI.icon('chevron-right', 'arrow')}</button><button class="master-data-card" data-page="positions"><span class="master-data-icon">${UI.icon('briefcase-business')}</span><span><strong>Pozisyonlar</strong><small>${positions.length} kayıt</small></span>${UI.icon('chevron-right', 'arrow')}</button><button class="master-data-card" data-page="leave-types"><span class="master-data-icon">${UI.icon('tags')}</span><span><strong>İzin türleri</strong><small>${leaveTypes.length} kayıt</small></span>${UI.icon('chevron-right', 'arrow')}</button></div></section>
        <section class="panel danger-zone"><header class="panel-header"><div><h3>Veri yönetimi</h3><p>Deneme kayıtlarını temizleyin veya admin hesabını koruyarak sistemi sıfırlayın.</p></div></header><div class="panel-body data-actions"><article><div><strong>İşlem verilerini temizle</strong><p>İzin talepleri ve onay geçmişi silinir; kullanıcılar, departmanlar ve ayarlar kalır.</p></div><button class="button button-secondary" data-action="clear-operations">İşlemleri Temizle</button></article><article><div><strong>Sistemi sıfırla</strong><p>Mevcut admin hesabı korunur; diğer kullanıcılar, departmanlar ve tüm işlem verileri silinir.</p></div><button class="button button-danger" data-action="factory-reset">Admin Hariç Sıfırla</button></article></div></section>
      </div>`;
    const form = container.querySelector('#organization-form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault(); const button = form.querySelector('[type="submit"]'); const errorBox = form.querySelector('#settings-error'); errorBox.hidden = true; UI.setButtonLoading(button, true);
      try { const updated = await Api.put('/api/settings', { organizationName: form.organizationName.value }); App.updateSettings(updated); UI.toast('Kurum ayarları güncellendi.'); UI.setButtonLoading(button, false); }
      catch (error) { errorBox.textContent = error.message; errorBox.hidden = false; UI.setButtonLoading(button, false); }
    });
  }

  function openDataAction(mode) {
    const factory = mode === 'factory';
    UI.openDrawer({ title: factory ? 'Sistemi sıfırla' : 'İşlem verilerini temizle', eyebrow: 'VERİ YÖNETİMİ', content: `<div class="danger-callout">${UI.icon('triangle-alert')}<div><strong>${factory ? 'Admin dışındaki veriler kalıcı olarak silinecek.' : 'Tüm izin ve onay kayıtları silinecek.'}</strong><p>${factory ? 'Mevcut admin hesabınız ve şifreniz korunur; diğer kullanıcılar, departmanlar ve işlem verileri silinir.' : 'Kullanıcılar, departmanlar ve kurum ayarları korunur.'}</p></div></div><form class="drawer-form" id="data-action-form"><div class="field field-wide"><label for="password">Admin şifresi</label><input id="password" name="password" type="password" autocomplete="current-password" required></div>${factory ? '<div class="field field-wide"><label for="confirmation">Onaylamak için SIFIRLA yazın</label><input id="confirmation" name="confirmation" autocomplete="off" required></div>' : ''}<p class="form-error field-wide" id="drawer-error" hidden></p><div class="drawer-actions"><button class="button button-secondary" type="button" data-action="close-drawer">Vazgeç</button><button class="button button-danger" type="submit">${factory ? 'Admin Hariç Sıfırla' : 'İşlemleri Temizle'}</button></div></form>`, onOpen(body) {
      const form = body.querySelector('#data-action-form');
      form.addEventListener('submit', async (event) => {
        event.preventDefault(); const button = form.querySelector('[type="submit"]'); const errorBox = form.querySelector('#drawer-error'); errorBox.hidden = true; UI.setButtonLoading(button, true, 'Siliniyor…');
        try { const payload = Object.fromEntries(new FormData(form).entries()); await Api.post(`/api/settings/${factory ? 'factory-reset' : 'clear-operations'}`, payload); UI.closeDrawer(); UI.toast(factory ? 'Sistem sıfırlandı; admin hesabınız korundu.' : 'İşlem verileri temizlendi.'); App.navigate('settings'); }
        catch (error) { errorBox.textContent = error.message; errorBox.hidden = false; UI.setButtonLoading(button, false); }
      });
    }});
  }

  window.AdminPages = {
    showEmployees, showUsers, openUserForm, toggleUser, deleteUser, openPasswordReset, openTemporaryCredentials,
    showDepartments, openDepartmentForm, toggleDepartment, deleteDepartment,
    showPositions, openPositionForm, togglePosition, deletePosition,
    showLeaveTypes, openLeaveTypeForm, deleteLeaveType, showSettings, openDataAction
  };
})();
