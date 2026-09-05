(function () {
  const e = UI.escapeHtml;

  async function showProfile(container) {
    const user = App.me;
    container.innerHTML = `<div class="page-head"><div><h2>Kişisel bilgiler</h2><p>İletişim bilgilerinizi ve hesap şifrenizi güvenle güncelleyin.</p></div></div>
      <div class="profile-grid">
        <section class="panel profile-card"><div class="profile-avatar">${e(UI.initials(user.fullName))}</div><h2>${e(user.fullName)}</h2><p>${e(user.position)}</p><span class="role-badge">${e(UI.roleMap[user.role])}</span><div class="profile-meta"><span>E-posta<strong>${e(user.email)}</strong></span><span>Departman<strong>${e(user.department?.name || '—')}</strong></span><span>İşe giriş tarihi<strong>${UI.formatDate(user.hireDate)}</strong></span></div></section>
        <div class="settings-stack">
          <section class="panel settings-panel"><header class="panel-header"><div><h3>İletişim bilgileri</h3><p>Telefon ve adres bilgilerinizi değiştirebilirsiniz.</p></div></header><div class="panel-body"><form class="settings-form" id="profile-form"><div class="field"><label for="phone">Telefon</label><input id="phone" name="phone" value="${e(user.phone || '')}"></div><div class="field"><label for="address">Adres</label><input id="address" name="address" value="${e(user.address || '')}"></div><p class="form-error field-wide" id="profile-error" hidden></p><div class="form-actions"><button class="button button-primary" type="submit">Bilgileri Kaydet</button></div></form></div></section>
          <section class="panel settings-panel"><header class="panel-header"><div><h3>Şifre ve güvenlik</h3><p>Hesabınız için güçlü ve benzersiz bir şifre kullanın.</p></div></header><div class="panel-body"><form class="settings-form" id="password-form"><div class="field"><label for="currentPassword">Mevcut şifre</label><input id="currentPassword" name="currentPassword" type="password" autocomplete="current-password" required></div><div></div><div class="field"><label for="newPassword">Yeni şifre</label><input id="newPassword" name="newPassword" type="password" autocomplete="new-password" required><small>En az 8 karakter; büyük/küçük harf, rakam ve özel karakter.</small></div><div class="field"><label for="passwordConfirm">Yeni şifre tekrar</label><input id="passwordConfirm" name="passwordConfirm" type="password" autocomplete="new-password" required></div><p class="form-error field-wide" id="password-error" hidden></p><div class="form-actions"><button class="button button-primary" type="submit">Şifreyi Değiştir</button></div></form></div></section>
        </div>
      </div>`;

    const profileForm = container.querySelector('#profile-form');
    profileForm.addEventListener('submit', async (event) => {
      event.preventDefault(); const button = profileForm.querySelector('[type="submit"]'); const errorBox = profileForm.querySelector('#profile-error'); errorBox.hidden = true; UI.setButtonLoading(button, true);
      try { const updated = await Api.patch('/api/users/profile', Object.fromEntries(new FormData(profileForm).entries())); App.updateMe(updated); UI.toast('İletişim bilgileriniz güncellendi.'); UI.setButtonLoading(button, false); }
      catch (error) { errorBox.textContent = error.message; errorBox.hidden = false; UI.setButtonLoading(button, false); }
    });
    const passwordForm = container.querySelector('#password-form');
    passwordForm.addEventListener('submit', async (event) => {
      event.preventDefault(); const button = passwordForm.querySelector('[type="submit"]'); const errorBox = passwordForm.querySelector('#password-error'); errorBox.hidden = true;
      if (passwordForm.newPassword.value !== passwordForm.passwordConfirm.value) { errorBox.textContent = 'Yeni şifreler birbiriyle eşleşmiyor.'; errorBox.hidden = false; return; }
      UI.setButtonLoading(button, true);
      try { await Api.post('/api/auth/change-password', { currentPassword: passwordForm.currentPassword.value, newPassword: passwordForm.newPassword.value }); passwordForm.reset(); UI.toast('Şifreniz güncellendi.'); UI.setButtonLoading(button, false); }
      catch (error) { errorBox.textContent = error.message; errorBox.hidden = false; UI.setButtonLoading(button, false); }
    });
  }

  window.ProfilePage = { showProfile };
})();
