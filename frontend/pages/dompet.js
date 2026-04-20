/**
 * dompet.js — Halaman Dompet
 */

var _dompetState = {
  items: [],
};

// ---------------------------------------------------------------------------
// Card builder
// ---------------------------------------------------------------------------
function _dompetBuildCard(d) {
  var warna = d.warna || '#206bc4';
  var ikon  = d.ikon  || 'wallet';
  return '<div class="glass-card" style="padding:20px;position:relative;">' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">' +
      '<span style="width:40px;height:40px;border-radius:10px;background:' + warna + '22;color:' + warna + ';display:flex;align-items:center;justify-content:center;font-size:20px;">' +
        '<i class="ti ti-' + ikon + '"></i>' +
      '</span>' +
      '<span style="font-weight:600;font-size:15px;flex:1;">' + d.nama + '</span>' +
    '</div>' +
    '<div style="font-size:22px;font-weight:700;margin-bottom:4px;">' + formatCurrency(d.saldoSaatIni || 0) + '</div>' +
    '<div style="font-size:12px;color:var(--color-text-muted);">Saldo awal: ' + formatCurrency(d.saldoAwal || 0) + '</div>' +
    '<div style="display:flex;gap:8px;margin-top:14px;">' +
      '<button class="btn btn-sm" data-action="edit" data-id="' + d.id + '" style="flex:1;"><i class="ti ti-edit"></i> Edit</button>' +
      '<button class="btn btn-sm btn-danger" data-action="delete" data-id="' + d.id + '" style="flex:1;"><i class="ti ti-trash"></i> Hapus</button>' +
    '</div>' +
  '</div>';
}

// ---------------------------------------------------------------------------
// Modal form
// ---------------------------------------------------------------------------
function _dompetOpenForm(dompet) {
  var isEdit = !!dompet;
  var d = dompet || {};

  var bodyHtml =
    '<form id="form-dompet">' +
      '<div class="form-group">' +
        '<label>Nama Dompet</label>' +
        '<input type="text" id="fd-nama" value="' + (d.nama || '') + '" placeholder="mis. BCA, GoPay, Tunai" required>' +
      '</div>' +
      (!isEdit ?
        '<div class="form-group">' +
          '<label>Saldo Awal (Rp)</label>' +
          '<input type="number" id="fd-saldo-awal" min="0" value="' + (d.saldoAwal || 0) + '" required>' +
        '</div>'
      : '') +
      '<div class="form-group">' +
        '<label>Ikon (nama Tabler Icon)</label>' +
        '<div style="display:flex;gap:8px;align-items:center;">' +
          '<span style="font-size:22px;"><i class="ti ti-' + (d.ikon || 'wallet') + '" id="fd-ikon-preview"></i></span>' +
          '<input type="text" id="fd-ikon" value="' + (d.ikon || 'wallet') + '" placeholder="mis. wallet, credit-card" style="flex:1;">' +
        '</div>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Warna</label>' +
        '<div style="display:flex;gap:8px;">' +
          '<input type="color" id="fd-warna-picker" value="' + (d.warna || '#206bc4') + '" style="width:48px;padding:4px;">' +
          '<input type="text" id="fd-warna" value="' + (d.warna || '#206bc4') + '" placeholder="#206bc4" style="flex:1;">' +
        '</div>' +
      '</div>' +
    '</form>';

  var footerHtml =
    '<button class="btn btn-secondary" id="fd-batal-btn">Batal</button>' +
    '<button class="btn btn-primary" id="fd-simpan-btn">Simpan</button>';

  openModal(isEdit ? 'Edit Dompet' : 'Tambah Dompet', bodyHtml, footerHtml);

  document.getElementById('fd-batal-btn').addEventListener('click', closeModal);

  // Color picker sync
  var picker = document.getElementById('fd-warna-picker');
  var textWarna = document.getElementById('fd-warna');
  picker.addEventListener('input', function() { textWarna.value = picker.value; });
  textWarna.addEventListener('input', function() { picker.value = textWarna.value; });

  // Icon preview
  var inputIkon = document.getElementById('fd-ikon');
  var previewIkon = document.getElementById('fd-ikon-preview');
  inputIkon.addEventListener('input', function() {
    previewIkon.className = 'ti ti-' + (inputIkon.value || 'wallet');
  });

  document.getElementById('fd-simpan-btn').addEventListener('click', function() {
    _dompetSubmit(isEdit ? d.id : null);
  });
}

async function _dompetSubmit(id) {
  var nama      = document.getElementById('fd-nama').value.trim();
  var saldoAwal = id ? 0 : (parseFloat(document.getElementById('fd-saldo-awal').value) || 0);
  var ikon      = document.getElementById('fd-ikon').value.trim() || 'wallet';
  var warna     = document.getElementById('fd-warna').value.trim() || '#206bc4';

  if (!nama) {
    showToast('Nama dompet wajib diisi', 'error');
    return;
  }

  var data = { id: id, nama: nama, saldoAwal: saldoAwal, ikon: ikon, warna: warna };

  closeModal();
  try {
    var res = await callBackend('saveDompet', data, getToken());
    if (res && res.success) {
      showToast(id ? 'Dompet diperbarui' : 'Dompet ditambahkan', 'success');
      AppCache.invalidate('dompet');
      renderDompet();
    } else {
      showToast((res && res.error) || 'Gagal menyimpan dompet', 'error');
    }
  } catch (e) {
    showToast('Gagal terhubung ke server', 'error');
  }
}

async function _dompetDelete(id) {
  var ok = await confirmModal('Hapus dompet ini? Pastikan tidak ada transaksi terkait.');
  if (!ok) return;
  try {
    var res = await callBackend('deleteDompet', id, getToken());
    if (res && res.success) {
      showToast('Dompet dihapus', 'success');
      AppCache.invalidate('dompet');
      renderDompet();
    } else {
      showToast((res && res.error) || 'Gagal menghapus dompet', 'error');
    }
  } catch (e) {
    showToast('Gagal terhubung ke server', 'error');
  }
}

// ---------------------------------------------------------------------------
// Main render
// ---------------------------------------------------------------------------
async function renderDompet() {
  var content = document.getElementById('page-content');
  if (!content) return;

  content.innerHTML =
    '<div class="flex-between mb-4">' +
      '<h2 class="page-title"><i class="ti ti-wallet" style="margin-right:8px;"></i>Dompet</h2>' +
      '<button class="btn btn-primary" id="dompet-tambah-btn"><i class="ti ti-plus"></i> Tambah Dompet</button>' +
    '</div>' +
    '<div id="dompet-grid" class="grid-3"></div>';

  document.getElementById('dompet-tambah-btn').addEventListener('click', function() {
    _dompetOpenForm(null);
  });

  showPageLoader();
  try {
    var res = await callBackend('getDompet', getToken());
    hidePageLoader();
    if (!res || !res.success) {
      showToast((res && res.error) || 'Gagal memuat dompet', 'error');
      document.getElementById('dompet-grid').innerHTML = '<div style="color:var(--color-danger);">Gagal memuat dompet.</div>';
      return;
    }

    _dompetState.items = res.data || [];
    _dompetRenderGrid();
  } catch (e) {
    hidePageLoader();
    showToast('Gagal terhubung ke server', 'error');
  }
}

function _dompetRenderGrid() {
  var grid = document.getElementById('dompet-grid');
  if (!grid) return;

  if (!_dompetState.items.length) {
    grid.innerHTML = '<div class="empty-state"><i class="ti ti-wallet"></i><p>Belum ada dompet. Tambahkan dompet pertama Anda.</p></div>';
    return;
  }

  grid.innerHTML = _dompetState.items.map(_dompetBuildCard).join('');

  grid.querySelectorAll('[data-action]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var id = btn.getAttribute('data-id');
      var action = btn.getAttribute('data-action');
      var d = _dompetState.items.find(function(x) { return x.id === id; });
      if (action === 'edit' && d) {
        _dompetOpenForm(d);
      } else if (action === 'delete') {
        _dompetDelete(id);
      }
    });
  });
}

if (typeof window !== 'undefined') {
  window.renderDompet = renderDompet;
}

if (typeof module !== 'undefined') {
  module.exports = { renderDompet, _dompetBuildCard };
}
