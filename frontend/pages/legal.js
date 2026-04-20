/**
 * legal.js — License, About, Privacy Policy, Terms & Conditions
 * BudgetSheet by gasly.biz.id
 */

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
function _legalShell(title, icon, bodyHtml) {
  var content = document.getElementById('page-content');
  if (!content) return;
  content.innerHTML =
    '<div class="p-3 p-md-4">' +
      '<div class="d-flex align-items-center gap-2 mb-4">' +
        '<button class="btn btn-sm btn-secondary" onclick="navigate(\'#/pengaturan\')">' +
          '<i class="ti ti-arrow-left me-1"></i>Kembali' +
        '</button>' +
        '<h2 class="mb-0 fw-bold"><i class="ti ' + icon + ' me-2"></i>' + title + '</h2>' +
      '</div>' +
      '<div class="glass-card p-4" style="max-width:760px;line-height:1.8;">' +
        bodyHtml +
      '</div>' +
    '</div>';
}

// ---------------------------------------------------------------------------
// About
// ---------------------------------------------------------------------------
function renderAbout() {
  _legalShell('Tentang Aplikasi', 'ti-info-circle',
    '<div class="text-center mb-4">' +
      '<div style="font-size:48px;margin-bottom:8px;"><i class="ti ti-coin"></i></div>' +
      '<h3 class="fw-bold mb-1">BudgetSheet</h3>' +
      '<span class="badge badge-info">Versi 1.0.0</span>' +
    '</div>' +
    '<p class="mb-3">BudgetSheet adalah aplikasi manajemen keuangan pribadi berbasis Google Sheets yang membantu Anda mencatat transaksi, mengelola anggaran, dan memantau laporan keuangan secara mudah dan efisien.</p>' +
    '<hr style="border-color:var(--glass-border);margin:20px 0;">' +
    '<div class="mb-3">' +
      '<div class="fw-semibold mb-1"><i class="ti ti-building me-1"></i>Dikembangkan oleh</div>' +
      '<div><strong>gasly.biz.id</strong></div>' +
      '<div class="text-muted small">Solusi digital untuk produktivitas dan keuangan</div>' +
    '</div>' +
    '<div class="mb-3">' +
      '<div class="fw-semibold mb-1"><i class="ti ti-mail me-1"></i>Dukungan &amp; Bantuan</div>' +
      '<div><a href="mailto:gaslybizid@gmail.com" style="color:var(--color-info);">gaslybizid@gmail.com</a></div>' +
    '</div>' +
    '<div>' +
      '<div class="fw-semibold mb-1"><i class="ti ti-world me-1"></i>Website</div>' +
      '<div><a href="https://gasly.biz.id" target="_blank" style="color:var(--color-info);">gasly.biz.id</a></div>' +
    '</div>'
  );
}

// ---------------------------------------------------------------------------
// License
// ---------------------------------------------------------------------------
function renderLicense() {
  _legalShell('Lisensi', 'ti-license',
    '<h4 class="fw-semibold mb-3">Lisensi Komersial BudgetSheet</h4>' +
    '<p class="text-muted small mb-3">Berlaku efektif sejak: 2024 &nbsp;|&nbsp; Penerbit: gasly.biz.id</p>' +
    '<hr style="border-color:var(--glass-border);margin:16px 0;">' +

    '<div class="mb-3">' +
      '<div class="fw-semibold mb-1">1. Hak Penggunaan</div>' +
      '<p>Lisensi ini memberikan hak non-eksklusif, tidak dapat dipindahtangankan kepada pengguna terdaftar untuk menggunakan BudgetSheet untuk keperluan pribadi maupun bisnis internal. Satu lisensi berlaku untuk satu akun Google.</p>' +
    '</div>' +

    '<div class="mb-3">' +
      '<div class="fw-semibold mb-1">2. Pembatasan</div>' +
      '<p>Pengguna dilarang: (a) mendistribusikan ulang, menjual, atau menyewakan perangkat lunak ini; (b) melakukan rekayasa balik atau memodifikasi kode sumber tanpa izin tertulis; (c) menghapus atau mengubah pemberitahuan hak cipta.</p>' +
    '</div>' +

    '<div class="mb-3">' +
      '<div class="fw-semibold mb-1">3. Kepemilikan Intelektual</div>' +
      '<p>Seluruh hak cipta, merek dagang, dan kekayaan intelektual atas BudgetSheet dimiliki sepenuhnya oleh <strong>gasly.biz.id</strong>. Penggunaan aplikasi tidak mengalihkan kepemilikan apapun kepada pengguna.</p>' +
    '</div>' +

    '<div class="mb-3">' +
      '<div class="fw-semibold mb-1">4. Pembaruan &amp; Dukungan</div>' +
      '<p>Pembaruan aplikasi disediakan atas kebijakan gasly.biz.id. Dukungan teknis tersedia melalui <a href="mailto:gaslybizid@gmail.com" style="color:var(--color-info);">gaslybizid@gmail.com</a>.</p>' +
    '</div>' +

    '<div class="mb-3">' +
      '<div class="fw-semibold mb-1">5. Penafian Garansi</div>' +
      '<p>Perangkat lunak disediakan "sebagaimana adanya" tanpa garansi apapun. gasly.biz.id tidak bertanggung jawab atas kerugian yang timbul dari penggunaan aplikasi ini.</p>' +
    '</div>' +

    '<div>' +
      '<div class="fw-semibold mb-1">6. Hukum yang Berlaku</div>' +
      '<p>Lisensi ini tunduk pada hukum Republik Indonesia. Sengketa diselesaikan melalui musyawarah atau jalur hukum yang berlaku.</p>' +
    '</div>'
  );
}

// ---------------------------------------------------------------------------
// Privacy Policy
// ---------------------------------------------------------------------------
function renderPrivacy() {
  _legalShell('Kebijakan Privasi', 'ti-shield-lock',
    '<h4 class="fw-semibold mb-1">Kebijakan Privasi BudgetSheet</h4>' +
    '<p class="text-muted small mb-3">Terakhir diperbarui: 2024 &nbsp;|&nbsp; gasly.biz.id</p>' +
    '<hr style="border-color:var(--glass-border);margin:16px 0;">' +

    '<div class="mb-3">' +
      '<div class="fw-semibold mb-1">Data yang Dikumpulkan</div>' +
      '<p>BudgetSheet hanya menyimpan data yang Anda masukkan sendiri (transaksi, anggaran, kategori) langsung di Google Spreadsheet milik Anda. Kami tidak mengumpulkan, menyimpan, atau memproses data pribadi Anda di server pihak ketiga.</p>' +
    '</div>' +

    '<div class="mb-3">' +
      '<div class="fw-semibold mb-1">Akses Google</div>' +
      '<p>Aplikasi memerlukan akses ke Google Sheets dan Google Apps Script untuk berfungsi. Akses ini terbatas hanya pada spreadsheet yang Anda tentukan dan tidak digunakan untuk tujuan lain.</p>' +
    '</div>' +

    '<div class="mb-3">' +
      '<div class="fw-semibold mb-1">Keamanan Data</div>' +
      '<p>Data Anda dilindungi oleh infrastruktur keamanan Google. Kami tidak memiliki akses ke data keuangan Anda dan tidak pernah membagikannya kepada pihak ketiga.</p>' +
    '</div>' +

    '<div>' +
      '<div class="fw-semibold mb-1">Kontak</div>' +
      '<p>Pertanyaan terkait privasi dapat dikirimkan ke <a href="mailto:gaslybizid@gmail.com" style="color:var(--color-info);">gaslybizid@gmail.com</a>.</p>' +
    '</div>'
  );
}

// ---------------------------------------------------------------------------
// Terms & Conditions
// ---------------------------------------------------------------------------
function renderTerms() {
  _legalShell('Syarat &amp; Ketentuan', 'ti-file-description',
    '<h4 class="fw-semibold mb-1">Syarat &amp; Ketentuan Penggunaan</h4>' +
    '<p class="text-muted small mb-3">Terakhir diperbarui: 2024 &nbsp;|&nbsp; gasly.biz.id</p>' +
    '<hr style="border-color:var(--glass-border);margin:16px 0;">' +

    '<div class="mb-3">' +
      '<div class="fw-semibold mb-1">1. Penerimaan Syarat</div>' +
      '<p>Dengan menggunakan BudgetSheet, Anda menyetujui syarat dan ketentuan ini. Jika tidak setuju, harap hentikan penggunaan aplikasi.</p>' +
    '</div>' +

    '<div class="mb-3">' +
      '<div class="fw-semibold mb-1">2. Penggunaan yang Diizinkan</div>' +
      '<p>Aplikasi hanya boleh digunakan untuk tujuan yang sah sesuai hukum yang berlaku. Pengguna bertanggung jawab penuh atas keakuratan data yang dimasukkan.</p>' +
    '</div>' +

    '<div class="mb-3">' +
      '<div class="fw-semibold mb-1">3. Akun &amp; Keamanan</div>' +
      '<p>Anda bertanggung jawab menjaga kerahasiaan kredensial akun. Segera laporkan akses tidak sah ke <a href="mailto:gaslybizid@gmail.com" style="color:var(--color-info);">gaslybizid@gmail.com</a>.</p>' +
    '</div>' +

    '<div class="mb-3">' +
      '<div class="fw-semibold mb-1">4. Batasan Tanggung Jawab</div>' +
      '<p>gasly.biz.id tidak bertanggung jawab atas kehilangan data, kerugian finansial, atau kerusakan lain yang timbul dari penggunaan atau ketidakmampuan menggunakan aplikasi ini.</p>' +
    '</div>' +

    '<div class="mb-3">' +
      '<div class="fw-semibold mb-1">5. Perubahan Layanan</div>' +
      '<p>Kami berhak mengubah, menangguhkan, atau menghentikan layanan kapan saja dengan atau tanpa pemberitahuan sebelumnya.</p>' +
    '</div>' +

    '<div>' +
      '<div class="fw-semibold mb-1">6. Perubahan Syarat</div>' +
      '<p>Syarat ini dapat diperbarui sewaktu-waktu. Penggunaan berkelanjutan setelah perubahan dianggap sebagai penerimaan syarat yang baru.</p>' +
    '</div>'
  );
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
if (typeof window !== 'undefined') {
  window.renderAbout   = renderAbout;
  window.renderLicense = renderLicense;
  window.renderPrivacy = renderPrivacy;
  window.renderTerms   = renderTerms;
}

if (typeof module !== 'undefined') {
  module.exports = { renderAbout, renderLicense, renderPrivacy, renderTerms };
}
