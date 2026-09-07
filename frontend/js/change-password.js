(function () {
  const form = document.getElementById('password-form');
  const errorBox = document.getElementById('form-error');

  Api.get('/api/auth/me').then((user) => {
    if (!user.mustChangePassword) window.location.replace('/Dashboard.html');
  }).catch(() => window.location.replace('/login.html'));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.hidden = true;
    if (form.newPassword.value !== form.passwordConfirm.value) {
      errorBox.textContent = 'Yeni şifreler birbiriyle eşleşmiyor.';
      errorBox.hidden = false;
      return;
    }
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      await Api.post('/api/auth/change-password', { newPassword: form.newPassword.value });
      window.location.replace('/Dashboard.html');
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.hidden = false;
      button.disabled = false;
    }
  });

  document.querySelectorAll('[data-password-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.passwordToggle);
      const visible = input.type === 'text';
      input.type = visible ? 'password' : 'text';
      button.setAttribute('aria-label', visible ? 'Şifreyi göster' : 'Şifreyi gizle');
      button.querySelector('img').src = visible ? '/icons/eye.svg' : '/icons/eye-off.svg';
    });
  });

  document.getElementById('logout-button').addEventListener('click', async () => {
    try { await Api.post('/api/auth/logout'); } finally { window.location.replace('/login.html'); }
  });
})();
