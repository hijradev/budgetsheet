/**
 * anggaran.js — Halaman Anggaran BudgetSheet
 * Vanilla JS globals, renders into #page-content
 */

var _anggaranState = {
  semua: [],
  bulan: new Date().getMonth() + 1,
  tahun: new Date().getFullYear(),
};

// ---------------------------------------------------------------------------
// Helper: progress bar color class based on status
// ---------------------------------------------------------------------------
function _anggaranProgressCls(status) {
  if (status === 'kritis')    return 'bg-danger';
  if (status === 'peringatan') return 'bg-warning';
  return 'bg-info';
}

// ---------------------------------------------------------------------------
// Build a single budget card
// ---------------------------------------------------------------------------
function _buildAnggaranCard(a) {
  var realisasi = a.realisasi || 0;
  var jumlah    = a.jumlahAnggaran || 0;
  var persen    = jumlah > 0 ? Math.min(Math.round((realisasi / jumlah) * 100), 100) : 0;
  var status    = a.status || 'normal';
  var barCls    = _anggaranProgressCls(status);

  var warningBadge = '';
  if (status === 'peringatan') {
    warningBadge = '<span class="badge bg-warning text-dark ms-1">Peringatan</span>';
  } else if (status === 'kritis') {
    warningBadge = '<span class="badge bg-danger ms-1">Kritis</span>';
  }

  return '<div class="glass-card p-3 anggaran-card" data-id="' + a.id + '" style="cursor:pointer;">' +
    '<div class="d-flex align-items-center justify-content-between mb-2">' +
      '<span class="fw-semibold text-truncate">' + (a.kategoriNama || a.kategoriId || '—') + '</span>' +
      warningBadge +
    '</div>' +
    '<div class="text-muted small mb-1">' + (a.periode || 'Bulanan') +
      (a.bulan ? ' · Bulan ' + a.bulan : '') +
      ' · ' + (a.tahun || '') +
    '</div>' +
    '<div class="progress mb-2" style="height:8px;">' +
      '<div class="progress-bar ' + barCls + '" style="width:' + persen + '%;" role="progressbar" ' +
        'aria-valuenow="' + persen + '" aria-valuemin="0" aria-valuemax="100"></div>' +
    '</div>' +
    '<div class="d-flex justify-content-between small">' +
      '<span class="text-muted">Realisasi: <strong>' + formatCurrency(realisasi) + '</strong></span>' +
      '<span class="text-muted">Anggaran: <strong>' + formatCurrency(jumlah) + '</strong></span>' +
    '</div>' +
    '<div class="text-muted small mt-1">' + persen + '% terpakai</div>' +
    '<div class="d-flex gap-2 mt-2">' +
      '<button class="btn btn-sm btn-outline-primary btn-edit-anggaran" data-id="' + a.id + '" ' +
        'onclick="event.stopPropagation()">' +
        '<i class="ti ti-edit me-1"></i>Edit' +
      '</button>' +
      '<button class="btn btn-sm btn-outline-danger btn-hapus-anggaran" data-id="' + a.id + '" ' +
        'onclick="event.stopPropagation()">' +
        '<i class="ti ti-trash me-1"></i>Hapus' +
      '</button>' +
    '</div>' +
  '</div>';
}

// ---------------------------------------------------------------------------
// Modal form: add / edit anggaran
// ---------------------------------------------------------------------------
function _bukaFormAnggaran(anggaran) {
  var isEdit = !!anggaran;
  var a = anggaran || {};

  AppCache.getKategori().then(function(kategoriList) {
    var opsiKategori = (kategoriList || []).map(function(k) {
      return '<option value="' + k.id + '"' + (k.id === (a.kategoriId || '') ? ' selected' : '') + '>' + k.nama + '</option>';
    }).join('');

    var bodyHtml =
      '<form id="form-anggaran">' +
        '<div class="mb-3">' +
          '<label class="form-label">Kategori</label>' +
          '<select class="form-select" id="f-anggaran-kategori" required>' +
            '<option value="">— Pilih Kategori —</option>' +
            opsiKategori +
          '</select>' +
        '</div>' +
        '<div class="mb-3">' +
          '<label class="form-label">Jumlah Anggaran (Rp)</label>' +
          '<input type="number" class="form-control" id="f-anggaran-jumlah" min="1" ' +
            'value="' + (a.jumlahAnggaran || '') + '" required>' +
        '</div>' +
        '<div class="mb-3">' +
          '<label class="form-label">Periode</label>' +
          '<select class="form-select" id="f-anggaran-periode" required>' +
            '<option value="Bulanan"'  + ((a.periode || 'Bulanan') === 'Bulanan'  ? ' selected' : '') + '>Bulanan</option>' +
            '<option value="Mingguan"' + (a.periode === 'Mingguan' ? ' selected' : '') + '>Mingguan</option>' +
            '<option value="Tahunan"'  + (a.periode === 'Tahunan'  ? ' selected' : '') + '>Tahunan</option>' +
          '</select>' +
        '</div>' +
        '<div class="mb-3" id="grup-bulan-anggaran">' +
          '<label class="form-label">Bulan (1–12)</label>' +
          '<select class="form-select" id="f-anggaran-bulan">' +
            Array.from({length: 12}, function(_, i) {
              var n = i + 1;
              var sel = (a.bulan || _anggaranState.bulan) === n ? ' selected' : '';
              return '<option value="' + n + '"' + sel + '>' + n + '</option>';
            }).join('') +
          '</select>' +
        '</div>' +
        '<div class="mb-3">' +
          '<label class="form-label">Tahun</label>' +
          '<input type="number" class="form-control" id="f-anggaran-tahun" min="2000" max="2100" ' +
            'value="' + (a.tahun || _anggaranState.tahun) + '" required>' +
        '</div>' +
      '</form>' +
      '<div class="d-flex gap-2 justify-content-end mt-3">' +
        '<button class="btn btn-secondary" id="btn-batal-anggaran">Batal</button>' +
        '<button class="btn btn-primary" id="btn-simpan-anggaran">Simpan</button>' +
      '</div>';

    openModal(isEdit ? 'Edit Anggaran' : 'Tambah Anggaran', bodyHtml);

    // Toggle bulan visibility
    var selPeriode = document.getElementById('f-anggaran-periode');
    var grupBulan  = document.getElementById('grup-bulan-anggaran');
    function toggleBulan() {
      grupBulan.style.display = selPeriode.value === 'Bulanan' ? '' : 'none';
    }
    selPeriode.addEventListener('change', toggleBulan);
    toggleBulan();

    document.getElementById('btn-batal-anggaran').addEventListener('click', closeModal);
    document.getElementById('btn-simpan-anggaran').addEventListener('click', function() {
      _submitFormAnggaran(isEdit ? a.id : null);
    });
  });
}

function _submitFormAnggaran(id) {
  var kategoriId     = document.getElementById('f-anggaran-kategori').value;
  var jumlahAnggaran = parseFloat(document.getElementById('f-anggaran-jumlah').value);
  var periode        = document.getElementById('f-anggaran-periode').value;
  var bulanEl        = document.getElementById('f-anggaran-bulan');
  var bulan          = bulanEl && bulanEl.closest('#grup-bulan-anggaran').style.display !== 'none'
    ? parseInt(bulanEl.value) : null;
  var tahun          = parseInt(document.getElementById('f-anggaran-tahun').value);

  if (!kategoriId)                        { showToast('Pilih kategori', 'error'); return; }
  if (!jumlahAnggaran || jumlahAnggaran <= 0) { showToast('Jumlah anggaran harus positif', 'error'); return; }
  if (!tahun)                             { showToast('Tahun wajib diisi', 'error'); return; }

  var data = { id: id, kategoriId: kategoriId, jumlahAnggaran: jumlahAnggaran, periode: periode, bulan: bulan, tahun: tahun };

  closeModal();
  callBackend('saveAnggaran', data, getToken()).then(function(res) {
    if (res && res.success) {
      showToast(id ? 'Anggaran berhasil diperbarui' : 'Anggaran berhasil ditambahkan', 'success');
      renderAnggaran();
    } else {
      showToast((res && res.error) || 'Gagal menyimpan anggaran', 'error');
    }
  }).catch(function() {
    showToast('Gagal terhubung ke server', 'error');
  });
}

function _hapusAnggaran(id) {
  if (!confirm('Hapus anggaran ini?')) return;
  callBackend('deleteAnggaran', id, getToken()).then(function(res) {
    if (res && res.success) {
      showToast('Anggaran berhasil dihapus', 'success');
      renderAnggaran();
    } else {
      showToast((res && res.error) || 'Gagal menghapus anggaran', 'error');
    }
  }).catch(function() {
    showToast('Gagal terhubung ke server', 'error');
  });
}

// ---------------------------------------------------------------------------
// Render page
// ---------------------------------------------------------------------------
function renderAnggaran() {
  var content = document.getElementById('page-content');
  if (!content) return;

  content.innerHTML = '';
  showPageLoader();

  callBackend('getAnggaran', getToken()).then(function(res) {
    hidePageLoader();
    if (!res || !res.success) {
      var msg = (res && res.error) || 'Gagal memuat anggaran';
      showToast(msg, 'error');
      content.innerHTML = '<div class="alert alert-danger m-3">' + msg + '</div>';
      return;
    }

    _anggaranState.semua = res.data || [];
    _renderAnggaranPage();
  }).catch(function(err) {
    hidePageLoader();
    var msg = (err && err.message) || 'Gagal terhubung ke server';
    showToast(msg, 'error');
    content.innerHTML = '<div class="alert alert-danger m-3">' + msg + '</div>';
  });
}

function _renderAnggaranPage() {
  var content = document.getElementById('page-content');
  var semua   = _anggaranState.semua;

  var kartuHtml = semua.length
    ? semua.map(_buildAnggaranCard).join('')
    : '<div class="text-muted py-4 text-center">Belum ada anggaran.</div>';

  content.innerHTML =
    '<div class="p-3 p-md-4">' +
      '<div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">' +
        '<h2 class="mb-0 fw-bold"><i class="ti ti-chart-pie me-2"></i>Anggaran</h2>' +
        '<button class="btn btn-primary" id="btn-tambah-anggaran">' +
          '<i class="ti ti-plus me-1"></i>Tambah Anggaran' +
        '</button>' +
      '</div>' +
      '<div class="grid-3">' + kartuHtml + '</div>' +
    '</div>';

  document.getElementById('btn-tambah-anggaran').addEventListener('click', function() {
    _bukaFormAnggaran(null);
  });

  // Edit buttons
  content.querySelectorAll('.btn-edit-anggaran').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var id = btn.getAttribute('data-id');
      var a  = _anggaranState.semua.find(function(x) { return x.id === id; });
      if (a) _bukaFormAnggaran(a);
    });
  });

  // Delete buttons
  content.querySelectorAll('.btn-hapus-anggaran').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      _hapusAnggaran(btn.getAttribute('data-id'));
    });
  });
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
if (typeof window !== 'undefined') {
  window.renderAnggaran = renderAnggaran;
}

if (typeof module !== 'undefined') {
  module.exports = { renderAnggaran, _buildAnggaranCard, _anggaranProgressCls };
}
