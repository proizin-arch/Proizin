(function () {
  const form = document.getElementById('login-form');
  const errorBox = document.getElementById('form-error');
  const password = document.getElementById('password');
  const toggle = document.querySelector('.password-toggle');

  Api.get('/api/setup/status').then((status) => {
    if (!status.isConfigured) window.location.replace('/setup.html');
    const organization = document.getElementById('login-organization');
    if (organization && status.settings?.organizationName) {
      organization.textContent = status.settings.organizationName;
      organization.hidden = false;
    }
  }).catch(() => {});
  Api.get('/api/auth/me').then((user) => {
    window.location.replace(user.mustChangePassword ? '/change-password.html' : '/Dashboard.html');
  }).catch(() => {});

  toggle.addEventListener('click', () => {
    const visible = password.type === 'text';
    password.type = visible ? 'password' : 'text';
    toggle.setAttribute('aria-label', visible ? 'Şifreyi göster' : 'Şifreyi gizle');
    toggle.querySelector('img').src = `/icons/${visible ? 'eye' : 'eye-off'}.svg`;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.hidden = true;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.querySelector('span').textContent = 'Giriş yapılıyor…';
    try {
      const user = await Api.post('/api/auth/login', {
        email: form.email.value,
        password: form.password.value,
        remember: form.remember.checked
      });
      window.location.replace(user.mustChangePassword ? '/change-password.html' : '/Dashboard.html');
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.hidden = false;
      button.disabled = false;
      button.querySelector('span').textContent = 'Giriş Yap';
    }
  });
})();
