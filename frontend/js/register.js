(function () {
  const form = document.getElementById('register-form');
  const errorBox = document.getElementById('form-error');
  const departmentSelect = document.getElementById('departmentId');

  Api.get('/api/public/departments').then((departments) => {
    departments.forEach((department) => {
      const option = document.createElement('option');
      option.value = department.id;
      option.textContent = department.name;
      departmentSelect.appendChild(option);
    });
  }).catch((error) => {
    errorBox.textContent = error.message;
    errorBox.hidden = false;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.hidden = true;
    if (form.password.value !== form.passwordConfirm.value) {
      errorBox.textContent = 'Şifreler birbiriyle eşleşmiyor.';
      errorBox.hidden = false;
      return;
    }
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const values = Object.fromEntries(new FormData(form).entries());
      delete values.passwordConfirm;
      await Api.post('/api/auth/register', values);
      window.location.replace('/Dashboard.html');
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.hidden = false;
      button.disabled = false;
    }
  });
})();
