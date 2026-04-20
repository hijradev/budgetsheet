/**
 * langganan.js — Halaman Langganan BudgetSheet
 * Vanilla JS globals, renders into #page-content
 */

var _langgananState = {
  semua: [],
};

// ---------------------------------------------------------------------------
// Helper: days until due date
// ---------------------------------------------------------------------------
function _selisihHariLangganan(tanggal) {
  var tujuan = new Date(tanggal);
  var hari   = new Date();
  hari.setHours(0, 0, 0, 0);
  return Math.ceil((tujuan - hari) / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Build table row
// ---------------------------------------------------------------------------
function _buildLanggananRow(l) {
  var selisih      = _selisihHariLangganan(l.tanggalJatuhTempo);
  var isPeringatan = l.statusPeringatan === true || selisih <= 3;
  var isNonaktif   = l.status === 'Nonaktif';

  var statusBadge;
  if (isNonaktif) {
    statusBadge = '<span class="badge bg-secondary">Nonaktif</span>';
  } else if (isPeringatan) {
    statusBadge = '<span class="badge bg-warning text-dark">' +
      (selisih <= 0 ? 'Jatuh Tempo!' : selisih + ' hari lagi') + '</span>';
  } else {
    statusBadge = '<span class="badge bg-success">Aktif</span>';
  }

  var bayarBtn = (!isNonaktif)
    ? '<button class="btn btn-sm btn-success btn-bayar-langganan me-1" data-id="' + l.id + '">' +
        '<i class="ti ti-check me-1"></i>Bayar' +
      '</button>'
    : '';

  return '<tr' + (isPeringatan && !isNonaktif ? ' class="table-warning"' : '') + '>' +
    '<td>' +
      (isPeringatan && !isNonaktif ? '<i class="ti ti-alert-triangle text-warning me-1"></i>' : '') +
      (l.nama || '—') +
    '</td>' +
    '<td class="fw-semibold text-danger">' + formatCurrency(l.jumlah) + '</td>' +
    '<td>' + (l.kategoriNama || l.kategoriId || '—') + '</td>' +
    '<td>' + (l.dompetNama || l.dompetId || '—') + '</td>' +
    '<td>' + (l.frekuensi || '—') + '</td>' +
    '<td>' + formatDate(l.tanggalJatuhTempo) + '</td>' +
    '<td>' + statusBadge + '</td>' +
    '<td>' +
      bayarBtn +
      '<button class="btn btn-sm btn-outline-primary btn-edit-langganan me-1" data-id="' + l.id + '">' +
        '<i class="ti ti-edit"></i>' +
      '</button>' +
      '<button class="btn btn-sm btn-outline-danger btn-hapus-langganan" data-id="' + l.id + '">' +
        '<i class="ti ti-trash"></i>' +
      '</button>' +
    '</td>' +
  '</tr>';
}

// ---------------------------------------------------------------------------
// Bayar langganan
// ---------------------------------------------------------------------------
function _bayarLangganan(id) {
  callBackend('bayarLangganan', id, getToken()).then(function(res) {
    if (res && res.success) {
      showToast('Pembayaran berhasil dicatat', 'success');
      renderLangganan();
    } else {
      showToast((res && res.error) || 'Gagal mencatat pembayaran', 'error');
    }
  }).catch(function() {
    showToast('Gagal terhubung ke server', 'error');
  });
}

// ---------------------------------------------------------------------------
// Modal form: add / edit langganan
// ---------------------------------------------------------------------------
function _bukaFormLangganan(langganan) {
  var isEdit = !!langganan;
  var l = langganan || {};
  var today = new Date().toISOString().split('T')[0];

  Promise.all([AppCache.getKategori(), AppCache.getDompet()]).then(function(results) {
    var kategoriList = results[0] || [];
    var dompetList   = results[1] || [];

    var opsiKategori = kategoriList.map(function(k) {
      return '<option value="' + k.id + '"' + (k.id === (l.kategoriId || '') ? ' selected' : '') + '>' + k.nama + '</option>';
    }).join('');

    var opsiDompet = dompetList.map(function(d) {
      return '<option value="' + d.id + '"' + (d.id === (l.dompetId || '') ? ' selected' : '') + '>' + d.nama + '</option>';
    }).join('');

    var bodyHtml =
      '<form id="form-langganan">' +
        '<div class="mb-3">' +
          '<label class="form-label">Nama</label>' +
          '<input type="text" class="form-control" id="f-langganan-nama" ' +
            'value="' + (l.nama || '') + '" required placeholder="mis. Netflix, Listrik">' +
        '</div>' +
        '<div class="mb-3">' +
          '<label class="form-label">Jumlah (Rp)</label>' +
          '<input type="number" class="form-control" id="f-langganan-jumlah" min="1" ' +
            'value="' + (l.jumlah || '') + '" required>' +
        '</div>' +
        '<div class="mb-3">' +
          '<label class="form-label">Kategori</label>' +
          '<select class="form-select" id="f-langganan-kategori">' +
            '<option value="">— Pilih Kategori —</option>' +
            opsiKategori +
          '</select>' +
        '</div>' +
        '<div class="mb-3">' +
          '<label class="form-label">Dompet</label>' +
          '<select class="form-select" id="f-langganan-dompet" required>' +
            '<option value="">— Pilih Dompet —</option>' +
            opsiDompet +
          '</select>' +
        '</div>' +
        '<div class="mb-3">' +
          '<label class="form-label">Frekuensi</label>' +
          '<select class="form-select" id="f-langganan-frekuensi" required>' +
            '<option value="Harian"'  + (l.frekuensi === 'Harian'  ? ' selected' : '') + '>Harian</option>' +
            '<option value="Mingguan"' + (l.frekuensi === 'Mingguan' ? ' selected' : '') + '>Mingguan</option>' +
            '<option value="Bulanan"' + ((l.frekuensi || 'Bulanan') === 'Bulanan' ? ' selected' : '') + '>Bulanan</option>' +
            '<option value="Tahunan"' + (l.frekuensi === 'Tahunan' ? ' selected' : '') + '>Tahunan</option>' +
          '</select>' +
        '</div>' +
        '<div class="mb-3">' +
          '<label class="form-label">Tanggal Jatuh Tempo</label>' +
          '<input type="date" class="form-control" id="f-langganan-jatuh-tempo" ' +
            'value="' + (l.tanggalJatuhTempo ? l.tanggalJatuhTempo.split('T')[0] : today) + '" required>' +
        '</div>' +
        '<div class="mb-3">' +
          '<label class="form-label">Catatan</label>' +
          '<textarea class="form-control" id="f-langganan-catatan" rows="2">' + (l.catatan || '') + '</textarea>' +
        '</div>' +
      '</form>' +
      '<div class="d-flex gap-2 justify-content-end mt-3">' +
        '<button class="btn btn-secondary" id="btn-batal-langganan">Batal</button>' +
        '<button class="btn btn-primary" id="btn-simpan-langganan">Simpan</button>' +
      '</div>';

    openModal(isEdit ? 'Edit Langganan' : 'Tambah Langganan', bodyHtml);

    document.getElementById('btn-batal-langganan').addEventListener('click', closeModal);
    document.getElementById('btn-simpan-langganan').addEventListener('click', function() {
      _submitFormLangganan(isEdit ? l.id : null);
    });
  });
}

function _submitFormLangganan(id) {
  var nama            = document.getElementById('f-langganan-nama').value.trim();
  var jumlah          = parseFloat(document.getElementById('f-langganan-jumlah').value);
  var kategoriId      = document.getElementById('f-langganan-kategori').value;
  var dompetId        = document.getElementById('f-langganan-dompet').value;
  var frekuensi       = document.getElementById('f-langganan-frekuensi').value;
  var tanggalJatuhTempo = document.getElementById('f-langganan-jatuh-tempo').value;
  var catatan         = document.getElementById('f-langganan-catatan').value;

  if (!nama)                      { showToast('Nama langganan wajib diisi', 'error'); return; }
  if (!jumlah || jumlah <= 0)     { showToast('Jumlah harus berupa angka positif', 'error'); return; }
  if (!dompetId)                  { showToast('Pilih dompet', 'error'); return; }
  if (!tanggalJatuhTempo)         { showToast('Tanggal jatuh tempo wajib diisi', 'error'); return; }

  var data = { id: id, nama: nama, jumlah: jumlah, kategoriId: kategoriId, dompetId: dompetId,
    frekuensi: frekuensi, tanggalJatuhTempo: tanggalJatuhTempo, catatan: catatan };

  closeModal();
  callBackend('saveLangganan', data, getToken()).then(function(res) {
    if (res && res.success) {
      showToast(id ? 'Langganan berhasil diperbarui' : 'Langganan berhasil ditambahkan', 'success');
      renderLangganan();
    } else {
      showToast((res && res.error) || 'Gagal menyimpan langganan', 'error');
    }
  }).catch(function() {
    showToast('Gagal terhubung ke server', 'error');
  });
}

function _hapusLangganan(id) {
  if (!confirm('Hapus langganan ini?')) return;
  callBackend('deleteLangganan', id, getToken()).then(function(res) {
    if (res && res.success) {
      showToast('Langganan berhasil dihapus', 'success');
      renderLangganan();
    } else {
      showToast((res && res.error) || 'Gagal menghapus langganan', 'error');
    }
  }).catch(function() {
    showToast('Gagal terhubung ke server', 'error');
  });
}

// ---------------------------------------------------------------------------
// Render page
// ---------------------------------------------------------------------------
function renderLangganan() {
  var content = document.getElementById('page-content');
  if (!content) return;

  content.innerHTML = '';
  showPageLoader();

  callBackend('getLangganan', getToken()).then(function(res) {
    hidePageLoader();
    if (!res || !res.success) {
      var msg = (res && res.error) || 'Gagal memuat langganan';
      showToast(msg, 'error');
      content.innerHTML = '<div class="alert alert-danger m-3">' + msg + '</div>';
      return;
    }

    _langgananState.semua = res.data || [];
    _renderLanggananPage();
  }).catch(function(err) {
    hidePageLoader();
    var msg = (err && err.message) || 'Gagal terhubung ke server';
    showToast(msg, 'error');
    content.innerHTML = '<div class="alert alert-danger m-3">' + msg + '</div>';
  });
}

function _renderLanggananPage() {
  var content = document.getElementById('page-content');
  var semua   = _langgananState.semua;

  var rowsHtml = semua.length
    ? semua.map(_buildLanggananRow).join('')
    : '<tr><td colspan="8" class="text-muted text-center py-4">Belum ada langganan.</td></tr>';

  content.innerHTML =
    '<div class="p-3 p-md-4">' +
      '<div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">' +
        '<h2 class="mb-0 fw-bold"><i class="ti ti-repeat me-2"></i>Langganan</h2>' +
        '<button class="btn btn-primary" id="btn-tambah-langganan">' +
          '<i class="ti ti-plus me-1"></i>Tambah Langganan' +
        '</button>' +
      '</div>' +
      '<div class="glass-card">' +
        '<div class="table-responsive">' +
          '<table class="table table-sm mb-0">' +
            '<thead><tr>' +
              '<th>Nama</th><th>Jumlah</th><th>Kategori</th><th>Dompet</th>' +
              '<th>Frekuensi</th><th>Jatuh Tempo</th><th>Status</th><th>Aksi</th>' +
            '</tr></thead>' +
            '<tbody>' + rowsHtml + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</div>';

  document.getElementById('btn-tambah-langganan').addEventListener('click', function() {
    _bukaFormLangganan(null);
  });

  content.querySelectorAll('.btn-bayar-langganan').forEach(function(btn) {
    btn.addEventListener('click', function() {
      _bayarLangganan(btn.getAttribute('data-id'));
    });
  });

  content.querySelectorAll('.btn-edit-langganan').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var id = btn.getAttribute('data-id');
      var l  = _langgananState.semua.find(function(x) { return x.id === id; });
      if (l) _bukaFormLangganan(l);
    });
  });

  content.querySelectorAll('.btn-hapus-langganan').forEach(function(btn) {
    btn.addEventListener('click', function() {
      _hapusLangganan(btn.getAttribute('data-id'));
    });
  });
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
if (typeof window !== 'undefined') {
  window.renderLangganan = renderLangganan;
}

if (typeof module !== 'undefined') {
  module.exports = { renderLangganan, _buildLanggananRow, _selisihHariLangganan };
}
