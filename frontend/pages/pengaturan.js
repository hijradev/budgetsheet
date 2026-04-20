/**
 * pengaturan.js — Halaman Pengaturan BudgetSheet
 * Vanilla JS globals, renders into #page-content
 */

function renderPengaturan() {
  var content = document.getElementById('page-content');
  if (!content) return;

  // Try to get spreadsheet URL from AppCache or window config
  var spreadsheetUrl = (typeof window.__SPREADSHEET_URL__ !== 'undefined' && window.__SPREADSHEET_URL__)
    ? window.__SPREADSHEET_URL__
    : null;

  var spreadsheetLink = spreadsheetUrl
    ? '<a href="' + spreadsheetUrl + '" target="_blank" class="btn btn-sm btn-outline-primary mt-2">' +
        '<i class="ti ti-external-link me-1"></i>Buka Spreadsheet' +
      '</a>'
    : '<span class="text-muted small">Spreadsheet URL tidak tersedia.</span>';

  content.innerHTML =
    '<div class="p-3 p-md-4">' +
      '<div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">' +
        '<h2 class="mb-0 fw-bold"><i class="ti ti-settings me-2"></i>Pengaturan</h2>' +
      '</div>' +

      '<div class="row g-4">' +

        // App info card
        '<div class="col-12 col-md-6">' +
          '<div class="glass-card p-3 h-100">' +
            '<div class="fw-semibold mb-3"><i class="ti ti-info-circle me-1"></i>Informasi Aplikasi</div>' +
            '<table class="table table-sm mb-2">' +
              '<tr><td class="text-muted">Versi</td><td><strong>1.0.0</strong></td></tr>' +
              '<tr><td class="text-muted">Nama</td><td><strong>BudgetSheet</strong></td></tr>' +
            '</table>' +
            spreadsheetLink +
          '</div>' +
        '</div>' +

        // Change password card
        '<div class="col-12 col-md-6">' +
          '<div class="glass-card p-3 h-100">' +
            '<div class="fw-semibold mb-3"><i class="ti ti-lock me-1"></i>Ubah Password</div>' +
            '<form id="form-ganti-password">' +
              '<div class="mb-3">' +
                '<label class="form-label">Password Baru</label>' +
                '<input type="password" class="form-control" id="f-password-baru" ' +
                  'placeholder="Masukkan password baru" autocomplete="new-password">' +
              '</div>' +
              '<div class="mb-3">' +
                '<label class="form-label">Konfirmasi Password</label>' +
                '<input type="password" class="form-control" id="f-password-konfirmasi" ' +
                  'placeholder="Ulangi password baru" autocomplete="new-password">' +
              '</div>' +
              '<button type="submit" class="btn btn-primary" id="btn-simpan-password">' +
                '<i class="ti ti-check me-1"></i>Simpan Password' +
              '</button>' +
            '</form>' +
          '</div>' +
        '</div>' +

        // Legal links card
        '<div class="col-12">' +
          '<div class="glass-card p-3">' +
            '<div class="fw-semibold mb-3"><i class="ti ti-file-text me-1"></i>Informasi Legal</div>' +
            '<div class="d-flex flex-wrap gap-2">' +
              '<a href="#/about" class="btn btn-sm btn-secondary"><i class="ti ti-info-circle me-1"></i>Tentang</a>' +
              '<a href="#/license" class="btn btn-sm btn-secondary"><i class="ti ti-license me-1"></i>Lisensi</a>' +
              '<a href="#/privacy" class="btn btn-sm btn-secondary"><i class="ti ti-shield-lock me-1"></i>Kebijakan Privasi</a>' +
              '<a href="#/terms" class="btn btn-sm btn-secondary"><i class="ti ti-file-description me-1"></i>Syarat &amp; Ketentuan</a>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // Logout card
        '<div class="col-12">' +
          '<div class="glass-card p-3">' +
            '<div class="fw-semibold mb-2"><i class="ti ti-logout me-1"></i>Keluar</div>' +
            '<p class="text-muted small mb-3">Keluar dari akun Anda. Data lokal akan dihapus.</p>' +
            '<button class="btn btn-danger" id="btn-logout-pengaturan">' +
              '<i class="ti ti-logout me-1"></i>Logout' +
            '</button>' +
          '</div>' +
        '</div>' +

      '</div>' +
    '</div>';

  // Change password form
  document.getElementById('form-ganti-password').addEventListener('submit', function(e) {
    e.preventDefault();
    _submitGantiPassword();
  });

  document.getElementById('btn-simpan-password').addEventListener('click', function(e) {
    e.preventDefault();
    _submitGantiPassword();
  });

  // Logout
  document.getElementById('btn-logout-pengaturan').addEventListener('click', function() {
    clearToken();
    if (typeof AppCache !== 'undefined' && AppCache.invalidate) {
      AppCache.invalidate();
    }
    navigate('#/login');
  });
}

function _submitGantiPassword() {
  var newPwd     = document.getElementById('f-password-baru').value;
  var konfirmasi = document.getElementById('f-password-konfirmasi').value;

  if (!newPwd)              { showToast('Password baru wajib diisi', 'error'); return; }
  if (newPwd.length < 6)    { showToast('Password minimal 6 karakter', 'error'); return; }
  if (newPwd !== konfirmasi) { showToast('Konfirmasi password tidak cocok', 'error'); return; }

  var btn = document.getElementById('btn-simpan-password');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }

  callBackend('changePassword', newPwd, getToken()).then(function(res) {
    if (res && res.success) {
      showToast('Password berhasil diubah', 'success');
      document.getElementById('f-password-baru').value = '';
      document.getElementById('f-password-konfirmasi').value = '';
    } else {
      // Graceful: backend may not implement this yet
      var msg = (res && res.error) || 'Fitur ubah password belum tersedia';
      showToast(msg, 'warning');
    }
  }).catch(function() {
    showToast('Fitur ubah password belum tersedia', 'warning');
  }).finally(function() {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-check me-1"></i>Simpan Password'; }
  });
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
if (typeof window !== 'undefined') {
  window.renderPengaturan = renderPengaturan;
}

if (typeof module !== 'undefined') {
  module.exports = { renderPengaturan };
}
