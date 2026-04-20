/**
 * login.js — Halaman Login BudgetSheet
 */

function renderLoginPage() {
  var app = document.getElementById('app');
  if (!app) return;

  app.innerHTML =
    '<div class="login-wrap">' +
      '<div class="login-box">' +

        // Branding
        '<div class="login-brand">' +
          '<div class="login-logo">' +
            '<i class="ti ti-coin"></i>' +
          '</div>' +
          '<h1 class="login-title">BudgetSheet</h1>' +
          '<p class="login-subtitle">Kelola keuangan Anda dengan mudah</p>' +
        '</div>' +

        // Card
        '<div class="glass-card login-card">' +
          '<h2 class="login-card-heading">Masuk ke Akun Anda</h2>' +

          '<form id="login-form" autocomplete="off">' +
            '<div class="form-group">' +
              '<label for="login-password">Password</label>' +
              '<div class="login-input-wrap">' +
                '<input type="password" id="login-password" placeholder="Masukkan password Anda" required>' +
                '<button type="button" id="toggle-password-btn" class="login-eye-btn" aria-label="Tampilkan password">' +
                  '<i class="ti ti-eye" id="toggle-password-icon"></i>' +
                '</button>' +
              '</div>' +
            '</div>' +

            '<button type="submit" id="login-submit-btn" class="btn btn-primary w-full login-submit">' +
              '<i class="ti ti-lock-open"></i><span>Masuk</span>' +
            '</button>' +
          '</form>' +
        '</div>' +

        // Footer
        '<p class="login-footer">&copy; 2026 BudgetSheet &middot; Aman &amp; Terproteksi</p>' +

      '</div>' +
    '</div>' +
    '<div id="toast-container"></div>';

  // Toggle password visibility
  var passwordInput = document.getElementById('login-password');
  var toggleIcon    = document.getElementById('toggle-password-icon');

  document.getElementById('toggle-password-btn').addEventListener('click', function() {
    var show = passwordInput.type === 'password';
    passwordInput.type = show ? 'text' : 'password';
    toggleIcon.className = show ? 'ti ti-eye-off' : 'ti ti-eye';
  });

  // Form submit
  document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    var password  = passwordInput.value.trim();
    if (!password) return;

    var submitBtn = document.getElementById('login-submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="spinner" style="width:16px;height:16px;border-width:2px;"></span>' +
      '<span>Memverifikasi...</span>';

    callBackend('login', password).then(function(res) {
      if (res && res.success) {
        setToken(res.data.token);
        if (res.data.mustChangePassword) {
          showToast('Segera ubah password default Anda di halaman Pengaturan.', 'warning');
        }
        renderApp();
        navigate('#/dashboard');
      } else {
        showToast((res && res.error) || 'Password salah', 'error');
        passwordInput.value = '';
        passwordInput.focus();
      }
    }).catch(function(err) {
      showToast(err.message || 'Terjadi kesalahan', 'error');
      passwordInput.value = '';
      passwordInput.focus();
    }).finally(function() {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="ti ti-lock-open"></i><span>Masuk</span>';
    });
  });

  setTimeout(function() { passwordInput.focus(); }, 100);
}

if (typeof window !== 'undefined') {
  window.renderLoginPage = renderLoginPage;
}

if (typeof module !== 'undefined') {
  module.exports = { renderLoginPage };
}
