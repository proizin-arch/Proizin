(function () {
  const form = document.getElementById('setup-form');
  const errorBox = document.getElementById('form-error');
  form.hireDate.value = new Date().toISOString().slice(0, 10);

  Api.get('/api/setup/status').then((status) => {
    if (status.isConfigured) window.location.replace('/login.html');
  }).catch(() => {});

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.hidden = true;
    if (form.password.value !== form.passwordConfirm.value) {
      errorBox.textContent = 'Şifreler birbiriyle eşleşmiyor.';
      errorBox.hidden = false;
      return;
    }
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    button.querySelector('span').textContent = 'Kurulum tamamlanıyor…';
    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      delete payload.passwordConfirm;
      await Api.post('/api/setup/complete', payload);
      window.location.replace('/Dashboard.html');
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.hidden = false;
      button.disabled = false;
      button.querySelector('span').textContent = 'Kurulumu Tamamla';
    }
  });
})();
