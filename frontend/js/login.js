(function () {
  const form = document.getElementById('login-form');
  const errorBox = document.getElementById('form-error');
  const password = document.getElementById('password');
  const toggle = document.querySelector('.password-toggle');

  Api.get('/api/auth/me').then(() => { window.location.replace('/Dashboard.html'); }).catch(() => {});

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
      await Api.post('/api/auth/login', {
        email: form.email.value,
        password: form.password.value,
        remember: form.remember.checked
      });
      window.location.replace('/Dashboard.html');
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.hidden = false;
      button.disabled = false;
      button.querySelector('span').textContent = 'Giriş Yap';
    }
  });
})();
