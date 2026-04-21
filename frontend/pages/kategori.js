/**
 * kategori.js — Halaman Kategori
 */

var _kategoriState = {
  items: [],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function _kategoriBadgeJenis(jenis) {
  var map = {
    Pemasukan:   'badge-success',
    Pengeluaran: 'badge-danger',
    Keduanya:    'badge-info',
  };
  return '<span class="badge ' + (map[jenis] || 'badge-muted') + '">' + jenis + '</span>';
}

// ---------------------------------------------------------------------------
// Card builder
// ---------------------------------------------------------------------------
function _kategoriBuildCard(k) {
  var warna = k.warna || '#206bc4';
  var ikon  = k.ikon  || 'tag';
  return '<div class="glass-card p-4 position-relative">' +
    '<div class="card-header-row">' +
      '<span class="card-icon" style="background:' + warna + '22;color:' + warna + ';">' +
        '<i class="ti ti-' + ikon + '"></i>' +
      '</span>' +
      '<span class="card-title">' + escapeHTML(k.nama) + '</span>' +
    '</div>' +
    '<div class="mb-3">' + _kategoriBadgeJenis(k.jenis) + '</div>' +
    '<div class="card-actions">' +
      '<button class="btn btn-sm" data-action="edit" data-id="' + k.id + '"><i class="ti ti-edit"></i> Edit</button>' +
      '<button class="btn btn-sm btn-danger" data-action="delete" data-id="' + k.id + '"><i class="ti ti-trash"></i> Hapus</button>' +
    '</div>' +
  '</div>';
}

// ---------------------------------------------------------------------------
// Modal form
// ---------------------------------------------------------------------------
function _kategoriOpenForm(kategori) {
  var isEdit = !!kategori;
  var k = kategori || {};

  var bodyHtml =
    '<form id="form-kategori">' +
      '<div class="form-group">' +
        '<label>Nama Kategori</label>' +
        '<input type="text" id="fk-nama" value="' + (k.nama || '') + '" placeholder="mis. Makan, Transportasi, Gaji" required>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Jenis</label>' +
        '<select id="fk-jenis" required>' +
          '<option value="Pemasukan"'   + (k.jenis === 'Pemasukan'   ? ' selected' : '') + '>Pemasukan</option>' +
          '<option value="Pengeluaran"' + (k.jenis === 'Pengeluaran' ? ' selected' : '') + '>Pengeluaran</option>' +
          '<option value="Keduanya"'    + (k.jenis === 'Keduanya'    ? ' selected' : '') + '>Keduanya</option>' +
        '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Ikon</label>' +
        '<div class="input-group">' +
          '<span class="icon-preview"><i class="ti ti-' + (k.ikon || 'tag') + '" id="fk-ikon-preview"></i></span>' +
          '<select id="fk-ikon" class="flex-1">' +
            buildIconOptions(k.ikon || 'tag') +
          '</select>' +
        '</div>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Warna</label>' +
        '<div class="input-group">' +
          '<input type="color" id="fk-warna-picker" value="' + (k.warna || '#206bc4') + '" class="color-picker">' +
          '<input type="text" id="fk-warna" value="' + (k.warna || '#206bc4') + '" placeholder="#206bc4" class="flex-1">' +
        '</div>' +
      '</div>' +
    '</form>';

  var footerHtml =
    '<button class="btn btn-secondary" id="fk-batal-btn">Batal</button>' +
    '<button class="btn btn-primary" id="fk-simpan-btn">Simpan</button>';

  openModal(isEdit ? 'Edit Kategori' : 'Tambah Kategori', bodyHtml, footerHtml);

  document.getElementById('fk-batal-btn').addEventListener('click', closeModal);

  // Color picker sync
  var picker = document.getElementById('fk-warna-picker');
  var textWarna = document.getElementById('fk-warna');
  picker.addEventListener('input', function() { textWarna.value = picker.value; });
  textWarna.addEventListener('input', function() { picker.value = textWarna.value; });

  // Icon preview
  var inputIkon = document.getElementById('fk-ikon');
  var previewIkon = document.getElementById('fk-ikon-preview');
  inputIkon.addEventListener('change', function() {
    previewIkon.className = 'ti ti-' + (inputIkon.value || 'tag');
  });

  document.getElementById('fk-simpan-btn').addEventListener('click', function() {
    _kategoriSubmit(isEdit ? k.id : null, this);
  });
}

async function _kategoriSubmit(id, btn) {
  var nama  = document.getElementById('fk-nama').value.trim();
  var jenis = document.getElementById('fk-jenis').value;
  var ikon  = document.getElementById('fk-ikon').value.trim() || 'tag';
  var warna = document.getElementById('fk-warna').value.trim() || '#206bc4';

  if (!nama) {
    showToast('Nama kategori wajib diisi', 'error');
    return;
  }

  var data = { id: id, nama: nama, jenis: jenis, ikon: ikon, warna: warna };

  // Immediate loading feedback
  var originalText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner spinner-sm"></span> Menyimpan...';
  }

  try {
    var res = await callBackend('saveKategori', data, getToken());
    if (res && res.success) {
      closeModal();
      showToast(id ? 'Kategori diperbarui' : 'Kategori ditambahkan', 'success');
      AppCache.invalidate('kategori');
      renderKategori();
    } else {
      showToast((res && res.error) || 'Gagal menyimpan kategori', 'error');
    }
  } catch (e) {
    showToast('Gagal terhubung ke server', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
  }
}

async function _kategoriDelete(id) {
  var ok = await confirmModal('Hapus kategori ini? Pastikan tidak ada transaksi yang menggunakannya.');
  if (!ok) return;
  showPageLoader();
  try {
    var res = await callBackend('deleteKategori', id, getToken());
    if (res && res.success) {
      showToast('Kategori dihapus', 'success');
      AppCache.invalidate('kategori');
      renderKategori();
    } else {
      hidePageLoader();
      showToast((res && res.error) || 'Gagal menghapus kategori', 'error');
    }
  } catch (e) {
    hidePageLoader();
    showToast('Gagal terhubung ke server', 'error');
  }
}

// ---------------------------------------------------------------------------
// Main render
// ---------------------------------------------------------------------------
async function renderKategori() {
  var content = document.getElementById('page-content');
  if (!content) return;

  content.innerHTML =
    '<div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">' +
      '<h2 class="page-title mb-0"><i class="ti ti-tag me-2"></i>Kategori</h2>' +
      '<button class="btn btn-primary" id="kategori-tambah-btn"><i class="ti ti-plus"></i> <span class="btn-text">Tambah Kategori</span></button>' +
    '</div>' +
    '<div id="kategori-grid" class="grid-3"></div>';

  document.getElementById('kategori-tambah-btn').addEventListener('click', function() {
    _kategoriOpenForm(null);
  });

  showPageLoader();
  try {
    var res = await callBackend('getKategori', getToken());
    hidePageLoader();
    if (!res || !res.success) {
      showToast((res && res.error) || 'Gagal memuat kategori', 'error');
      document.getElementById('kategori-grid').innerHTML = '<div class="error-message">Gagal memuat kategori.</div>';
      return;
    }

    _kategoriState.items = res.data || [];
    _kategoriRenderGrid();
  } catch (e) {
    hidePageLoader();
    showToast('Gagal terhubung ke server', 'error');
  }
}

function _kategoriRenderGrid() {
  var grid = document.getElementById('kategori-grid');
  if (!grid) return;

  if (!_kategoriState.items.length) {
    grid.innerHTML = '<div class="empty-state"><i class="ti ti-tag"></i><p>Belum ada kategori. Tambahkan kategori pertama Anda.</p></div>';
    return;
  }

  grid.innerHTML = _kategoriState.items.map(_kategoriBuildCard).join('');

  grid.querySelectorAll('[data-action]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var id = btn.getAttribute('data-id');
      var action = btn.getAttribute('data-action');
      var k = _kategoriState.items.find(function(x) { return x.id === id; });
      if (action === 'edit' && k) {
        _kategoriOpenForm(k);
      } else if (action === 'delete') {
        _kategoriDelete(id);
      }
    });
  });
}

if (typeof window !== 'undefined') {
  window.renderKategori = renderKategori;
}

if (typeof module !== 'undefined') {
  module.exports = { renderKategori, _kategoriBuildCard, _kategoriBadgeJenis };
}
