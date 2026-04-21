/**
 * transaksi.js — Halaman Transaksi
 */

var _trxState = {
  items: [],
  total: 0,
  offset: 0,
  limit: 15,
  filter: {},
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function _trxJenisBadge(jenis) {
  var map = {
    Pemasukan:   'badge-success',
    Pengeluaran: 'badge-danger',
    Transfer:    'badge-info',
  };
  return '<span class="badge ' + (map[jenis] || 'badge-muted') + '">' + jenis + '</span>';
}

function _trxJenisColor(jenis) {
  if (jenis === 'Pemasukan')   return 'text-success';
  if (jenis === 'Pengeluaran') return 'text-danger';
  return 'text-info';
}

function _trxBuildOptions(items, valueKey, labelKey, selected) {
  selected = selected || '';
  return (items || []).map(function(item) {
    return '<option value="' + item[valueKey] + '"' + (item[valueKey] === selected ? ' selected' : '') + '>' + item[labelKey] + '</option>';
  }).join('');
}

// ---------------------------------------------------------------------------
// Render table rows
// ---------------------------------------------------------------------------
function _trxBuildRows(items) {
  if (!items || !items.length) {
    return '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--color-text-muted);">Tidak ada transaksi.</td></tr>';
  }
  return items.map(function(t) {
    var prefix = t.jenis === 'Pemasukan' ? '+' : (t.jenis === 'Pengeluaran' ? '-' : '');
    return '<tr>' +
      '<td>' + formatDate(t.tanggal) + '</td>' +
      '<td>' + _trxJenisBadge(t.jenis) + '</td>' +
      '<td>' + (t.kategori || '—') + '</td>' +
      '<td>' + (t.dompet || '—') + '</td>' +
      '<td class="' + _trxJenisColor(t.jenis) + '" style="font-weight:600;">' + prefix + formatCurrency(t.jumlah) + '</td>' +
      '<td style="color:var(--color-text-muted);font-size:13px;">' + (t.catatan || '') + '</td>' +
      '<td>' +
        '<button class="btn btn-sm" data-action="edit" data-id="' + t.id + '" title="Edit" style="padding:4px 8px;margin-right:4px;"><i class="ti ti-edit"></i></button>' +
        '<button class="btn btn-sm btn-danger" data-action="delete" data-id="' + t.id + '" title="Hapus" style="padding:4px 8px;"><i class="ti ti-trash"></i></button>' +
      '</td>' +
    '</tr>';
  }).join('');
}

// ---------------------------------------------------------------------------
// Modal form transaksi
// ---------------------------------------------------------------------------
async function _trxOpenForm(trx) {
  var isEdit = !!trx;
  var t = trx || {};
  var today = new Date().toISOString().split('T')[0];

  var kategoriList = await AppCache.getKategori();
  var dompetList   = await AppCache.getDompet();

  var opsiKategori    = _trxBuildOptions(kategoriList, 'id', 'nama', t.kategoriId || '');
  var opsiDompet      = _trxBuildOptions(dompetList,   'id', 'nama', t.dompetAsalId || '');
  var opsiDompetTujuan = _trxBuildOptions(dompetList,  'id', 'nama', t.dompetTujuanId || '');

  var bodyHtml =
    '<form id="form-trx">' +
      '<div class="form-group">' +
        '<label>Tanggal</label>' +
        '<input type="date" id="ft-tanggal" value="' + (t.tanggal ? t.tanggal.split('T')[0] : today) + '" required>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Jenis</label>' +
        '<select id="ft-jenis" required>' +
          '<option value="Pemasukan"'   + (t.jenis === 'Pemasukan'   ? ' selected' : '') + '>Pemasukan</option>' +
          '<option value="Pengeluaran"' + (t.jenis === 'Pengeluaran' ? ' selected' : '') + '>Pengeluaran</option>' +
          '<option value="Transfer"'    + (t.jenis === 'Transfer'    ? ' selected' : '') + '>Transfer</option>' +
        '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Jumlah (Rp)</label>' +
        '<input type="number" id="ft-jumlah" min="1" value="' + (t.jumlah || '') + '" required placeholder="Contoh: 50000">' +
        '<small style="color:var(--color-text-muted);">Masukkan angka tanpa titik atau koma pemisah</small>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Kategori</label>' +
        '<select id="ft-kategori">' +
          '<option value="">— Pilih Kategori —</option>' +
          opsiKategori +
        '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Dompet Asal</label>' +
        '<select id="ft-dompet-asal" required>' +
          '<option value="">— Pilih Dompet —</option>' +
          opsiDompet +
        '</select>' +
      '</div>' +
      '<div class="form-group" id="ft-grup-tujuan" style="display:none;">' +
        '<label>Dompet Tujuan</label>' +
        '<select id="ft-dompet-tujuan">' +
          '<option value="">— Pilih Dompet Tujuan —</option>' +
          opsiDompetTujuan +
        '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Catatan</label>' +
        '<textarea id="ft-catatan" rows="2">' + (t.catatan || '') + '</textarea>' +
      '</div>' +
    '</form>';

  var footerHtml =
    '<button class="btn btn-secondary" id="ft-batal-btn">Batal</button>' +
    '<button class="btn btn-primary" id="ft-simpan-btn">Simpan</button>';

  openModal(isEdit ? 'Edit Transaksi' : 'Tambah Transaksi', bodyHtml, footerHtml);

  document.getElementById('ft-batal-btn').addEventListener('click', closeModal);

  // Toggle dompet tujuan
  var selJenis = document.getElementById('ft-jenis');
  var grupTujuan = document.getElementById('ft-grup-tujuan');
  function toggleTujuan() {
    grupTujuan.style.display = selJenis.value === 'Transfer' ? '' : 'none';
  }
  selJenis.addEventListener('change', toggleTujuan);
  toggleTujuan();

  document.getElementById('ft-simpan-btn').addEventListener('click', function() {
    _trxSubmit(isEdit ? t.id : null, this);
  });
}

async function _trxSubmit(id, btn) {
  var tanggal      = document.getElementById('ft-tanggal').value;
  var jenis        = document.getElementById('ft-jenis').value;
  var jumlah       = parseFloat(document.getElementById('ft-jumlah').value);
  var kategoriId   = document.getElementById('ft-kategori').value;
  var dompetAsalId = document.getElementById('ft-dompet-asal').value;
  var dompetTujuanId = (document.getElementById('ft-dompet-tujuan') || {}).value || '';
  var catatan      = document.getElementById('ft-catatan').value;

  if (!tanggal || !jenis || !jumlah || jumlah <= 0) {
    showToast('Tanggal, jenis, dan jumlah wajib diisi', 'error');
    return;
  }
  if (!dompetAsalId) {
    showToast('Pilih dompet asal', 'error');
    return;
  }
  if (jenis === 'Transfer' && !dompetTujuanId) {
    showToast('Pilih dompet tujuan untuk Transfer', 'error');
    return;
  }

  var data = { id: id, tanggal: tanggal, jenis: jenis, jumlah: jumlah, kategoriId: kategoriId, dompetAsalId: dompetAsalId, dompetTujuanId: dompetTujuanId, catatan: catatan };

  // Immediate loading feedback
  var originalText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px;"></span> Menyimpan...';
  }

  try {
    var res = await callBackend('saveTransaksi', data, getToken());
    if (res && res.success) {
      closeModal();
      showToast(id ? 'Transaksi diperbarui' : 'Transaksi disimpan', 'success');
      AppCache.invalidate('dompet');
      renderTransaksi();
    } else {
      showToast((res && res.error) || 'Gagal menyimpan transaksi', 'error');
    }
  } catch (e) {
    showToast('Gagal terhubung ke server', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
  }
}

// ---------------------------------------------------------------------------
// Load & render
// ---------------------------------------------------------------------------
async function _trxLoad(append) {
  var filter = _trxState.filter;
  var offset = append ? _trxState.offset : 0;

  showPageLoader();
  try {
    var res = await callBackend('getTransaksi', filter, offset, _trxState.limit, getToken());
    hidePageLoader();
    if (!res || !res.success) {
      showToast((res && res.error) || 'Gagal memuat transaksi', 'error');
      return;
    }
    var data = res.data || {};
    var items = data.items || [];
    _trxState.total = data.total || 0;

    if (append) {
      _trxState.items = _trxState.items.concat(items);
    } else {
      _trxState.items = items;
    }
    _trxState.offset = _trxState.items.length;
    _trxRenderList();
  } catch (e) {
    hidePageLoader();
    showToast('Gagal terhubung ke server', 'error');
  }
}

function _trxRenderList() {
  var tbody = document.getElementById('trx-tbody');
  if (!tbody) return;
  tbody.innerHTML = _trxBuildRows(_trxState.items);

  // Attach row action events
  tbody.querySelectorAll('[data-action]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var id = btn.getAttribute('data-id');
      var action = btn.getAttribute('data-action');
      var t = _trxState.items.find(function(x) { return x.id === id; });
      if (action === 'edit' && t) {
        _trxOpenForm(t);
      } else if (action === 'delete') {
        _trxDelete(id);
      }
    });
  });

  // Row click → edit
  tbody.querySelectorAll('tr').forEach(function(row, i) {
    var t = _trxState.items[i];
    if (!t) return;
    row.style.cursor = 'pointer';
    row.addEventListener('click', function(e) {
      if (e.target.closest('[data-action]')) return;
      _trxOpenForm(t);
    });
  });

  // Load more button
  var btnMore = document.getElementById('trx-load-more');
  if (btnMore) {
    if (_trxState.total > _trxState.offset) {
      btnMore.style.display = '';
      btnMore.textContent = 'Muat Lebih (' + (_trxState.total - _trxState.offset) + ' lagi)';
    } else {
      btnMore.style.display = 'none';
    }
  }
}

async function _trxDelete(id) {
  var ok = await confirmModal('Hapus transaksi ini?');
  if (!ok) return;
  showPageLoader();
  try {
    var res = await callBackend('deleteTransaksi', id, getToken());
    if (res && res.success) {
      showToast('Transaksi dihapus', 'success');
      AppCache.invalidate('dompet');
      renderTransaksi();
    } else {
      hidePageLoader();
      showToast((res && res.error) || 'Gagal menghapus', 'error');
    }
  } catch (e) {
    hidePageLoader();
    showToast('Gagal terhubung ke server', 'error');
  }
}

// ---------------------------------------------------------------------------
// Main render
// ---------------------------------------------------------------------------
function renderTransaksi() {
  var content = document.getElementById('page-content');
  if (!content) return;

  _trxState = { items: [], total: 0, offset: 0, limit: 15, filter: {} };

  // Render shell immediately
  content.innerHTML =
    '<div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">' +
      '<h2 class="page-title mb-0"><i class="ti ti-arrows-exchange me-2"></i>Transaksi</h2>' +
      '<button class="btn btn-primary" id="trx-tambah-btn"><i class="ti ti-plus"></i> <span class="btn-text">Tambah Transaksi</span></button>' +
    '</div>' +

    // Filter bar
    '<div class="glass-card p-3 mb-4">' +
      '<div class="trx-filter-grid">' +
        '<div>' +
          '<label class="small fw-medium mb-1">Cari</label>' +
          '<input type="text" id="trx-q" placeholder="Catatan, kategori, dompet...">' +
        '</div>' +
        '<div>' +
          '<label class="small fw-medium mb-1">Dari Tanggal</label>' +
          '<input type="date" id="trx-mulai">' +
        '</div>' +
        '<div>' +
          '<label class="small fw-medium mb-1">Sampai Tanggal</label>' +
          '<input type="date" id="trx-akhir">' +
        '</div>' +
        '<div>' +
          '<label class="small fw-medium mb-1">Kategori</label>' +
          '<select id="trx-kategori"><option value="">Memuat...</option></select>' +
        '</div>' +
        '<div>' +
          '<label class="small fw-medium mb-1">Dompet</label>' +
          '<select id="trx-dompet"><option value="">Memuat...</option></select>' +
        '</div>' +
        '<div>' +
          '<label class="small fw-medium mb-1">Jenis</label>' +
          '<select id="trx-jenis">' +
            '<option value="">Semua</option>' +
            '<option value="Pemasukan">Pemasukan</option>' +
            '<option value="Pengeluaran">Pengeluaran</option>' +
            '<option value="Transfer">Transfer</option>' +
          '</select>' +
        '</div>' +
        '<div>' +
          '<button class="btn btn-primary w-full" id="trx-filter-btn" style="justify-content:center;padding:11px 14px;"><i class="ti ti-filter"></i> Filter</button>' +
        '</div>' +
      '</div>' +
    '</div>' +

    // Table
    '<div class="glass-card p-0">' +
      '<div class="table-responsive">' +
        '<table class="table-wide">' +
          '<thead><tr>' +
            '<th>Tanggal</th><th>Jenis</th><th>Kategori</th><th>Dompet</th><th>Jumlah</th><th>Catatan</th><th>Aksi</th>' +
          '</tr></thead>' +
          '<tbody id="trx-tbody"></tbody>' +
        '</table>' +
      '</div>' +
    '</div>' +

    '<div style="text-align:center;margin-top:16px;">' +
      '<button class="btn" id="trx-load-more" style="display:none;">Muat Lebih</button>' +
    '</div>';

  // Fetch categories and wallets in background
  Promise.all([AppCache.getKategori(), AppCache.getDompet()]).then(function(results) {
    var kategoriList = results[0];
    var dompetList   = results[1];
    var selKat = document.getElementById('trx-kategori');
    var selDom = document.getElementById('trx-dompet');
    if (selKat) selKat.innerHTML = '<option value="">Semua</option>' + _trxBuildOptions(kategoriList, 'id', 'nama', '');
    if (selDom) selDom.innerHTML = '<option value="">Semua</option>' + _trxBuildOptions(dompetList,   'id', 'nama', '');
  });

  // Events
  document.getElementById('trx-tambah-btn').addEventListener('click', function() {
    _trxOpenForm(null);
  });

  document.getElementById('trx-filter-btn').addEventListener('click', function() {
    _trxState.filter = {
      q:            document.getElementById('trx-q').value,
      tanggalMulai: document.getElementById('trx-mulai').value,
      tanggalAkhir: document.getElementById('trx-akhir').value,
      kategoriId:   document.getElementById('trx-kategori').value,
      dompetId:     document.getElementById('trx-dompet').value,
      jenis:        document.getElementById('trx-jenis').value,
    };
    _trxState.items = [];
    _trxState.offset = 0;
    _trxLoad(false);
  });

  document.getElementById('trx-load-more').addEventListener('click', function() {
    _trxLoad(true);
  });

  _trxLoad(false);
}



if (typeof window !== 'undefined') {
  window.renderTransaksi = renderTransaksi;
  window.showTambahTransaksiModal = function() {
    // If not on transaksi page, navigate there first then open form
    var currentPath = (location.hash || '').replace('#', '') || '/dashboard';
    if (currentPath !== '/transaksi') {
      navigate('#/transaksi');
      // Wait for page to render then open form
      setTimeout(function() { _trxOpenForm(null); }, 300);
    } else {
      _trxOpenForm(null);
    }
  };
}

if (typeof module !== 'undefined') {
  module.exports = { renderTransaksi, _trxJenisBadge, _trxBuildOptions };
}
