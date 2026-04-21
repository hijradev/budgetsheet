/**
 * dompet.js — Halaman Dompet
 */

var _dompetState = {
  items: [],
  activities: [],
};

// ---------------------------------------------------------------------------
// Card builder
// ---------------------------------------------------------------------------
function _dompetBuildCard(d) {
  var warna = d.warna || '#206bc4';
  var ikon  = d.ikon  || 'wallet';
  return '<div class="glass-card p-4 position-relative">' +
    '<div class="card-header-row">' +
      '<span class="card-icon" style="background:' + warna + '22;color:' + warna + ';">' +
        '<i class="ti ti-' + ikon + '"></i>' +
      '</span>' +
      '<span class="card-title">' + escapeHTML(d.nama) + '</span>' +
    '</div>' +
    '<div class="card-value">' + formatCurrency(d.saldoSaatIni || 0) + '</div>' +
    '<div class="card-subtitle">Saldo awal: ' + formatCurrency(d.saldoAwal || 0) + '</div>' +
    '<div class="card-actions">' +
      '<button class="btn btn-sm" data-action="edit" data-id="' + d.id + '"><i class="ti ti-edit"></i> Edit</button>' +
      '<button class="btn btn-sm btn-danger" data-action="delete" data-id="' + d.id + '"><i class="ti ti-trash"></i> Hapus</button>' +
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
          '<small class="text-muted">Masukkan angka tanpa titik atau koma pemisah</small>' +
        '</div>'
      : '') +
      '<div class="form-group">' +
        '<label>Ikon</label>' +
        '<div class="input-group">' +
          '<span class="icon-preview"><i class="ti ti-' + (d.ikon || 'wallet') + '" id="fd-ikon-preview"></i></span>' +
          '<select id="fd-ikon" class="flex-1">' +
            buildIconOptions(d.ikon || 'wallet') +
          '</select>' +
        '</div>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Warna</label>' +
        '<div class="input-group">' +
          '<input type="color" id="fd-warna-picker" value="' + (d.warna || '#206bc4') + '" class="color-picker">' +
          '<input type="text" id="fd-warna" value="' + (d.warna || '#206bc4') + '" placeholder="#206bc4" class="flex-1">' +
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
  inputIkon.addEventListener('change', function() {
    previewIkon.className = 'ti ti-' + (inputIkon.value || 'wallet');
  });

  document.getElementById('fd-simpan-btn').addEventListener('click', function() {
    _dompetSubmit(isEdit ? d.id : null, this);
  });
}

async function _dompetSubmit(id, btn) {
  var nama      = document.getElementById('fd-nama').value.trim();
  var saldoAwal = id ? 0 : (parseFloat(document.getElementById('fd-saldo-awal').value) || 0);
  var ikon      = document.getElementById('fd-ikon').value.trim() || 'wallet';
  var warna     = document.getElementById('fd-warna').value.trim() || '#206bc4';

  if (!nama) {
    showToast('Nama dompet wajib diisi', 'error');
    return;
  }

  var data = { id: id, nama: nama, saldoAwal: saldoAwal, ikon: ikon, warna: warna };

  // Immediate loading feedback
  var originalText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner spinner-sm"></span> Menyimpan...';
  }

  try {
    var res = await callBackend('saveDompet', data, getToken());
    if (res && res.success) {
      closeModal();
      showToast(id ? 'Dompet diperbarui' : 'Dompet ditambahkan', 'success');
      AppCache.invalidate('dompet');
      renderDompet();
    } else {
      showToast((res && res.error) || 'Gagal menyimpan dompet', 'error');
    }
  } catch (e) {
    showToast('Gagal terhubung ke server', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
  }
}

async function _dompetDelete(id) {
  var ok = await confirmModal('Hapus dompet ini? Pastikan tidak ada transaksi terkait.');
  if (!ok) return;
  showPageLoader();
  try {
    var res = await callBackend('deleteDompet', id, getToken());
    if (res && res.success) {
      showToast('Dompet dihapus', 'success');
      AppCache.invalidate('dompet');
      renderDompet();
    } else {
      hidePageLoader();
      showToast((res && res.error) || 'Gagal menghapus dompet', 'error');
    }
  } catch (e) {
    hidePageLoader();
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
    '<div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">' +
      '<h2 class="page-title mb-0"><i class="ti ti-wallet me-2"></i>Dompet</h2>' +
      '<button class="btn btn-primary" id="dompet-tambah-btn"><i class="ti ti-plus"></i> <span class="btn-text">Tambah Dompet</span></button>' +
    '</div>' +
    '<div id="dompet-grid" class="grid-3"></div>' +
    '<div class="section-spacer">' +
      '<h3 class="section-header"><i class="ti ti-history me-2"></i>Riwayat Aktivitas</h3>' +
      '<div id="dompet-activity-log"></div>' +
    '</div>';

  document.getElementById('dompet-tambah-btn').addEventListener('click', function() {
    _dompetOpenForm(null);
  });

  showPageLoader();
  try {
    var res = await callBackend('getDompet', getToken());
    if (!res || !res.success) {
      hidePageLoader();
      showToast((res && res.error) || 'Gagal memuat dompet', 'error');
      document.getElementById('dompet-grid').innerHTML = '<div class="error-message">Gagal memuat dompet.</div>';
      return;
    }

    _dompetState.items = res.data || [];
    _dompetRenderGrid();

    // Load activity log
    var activityRes = await callBackend('getDompetActivity', { limit: 50 }, getToken());
    hidePageLoader();
    
    if (activityRes && activityRes.success) {
      _dompetState.activities = activityRes.data || [];
      _dompetRenderActivityLog();
    } else {
      document.getElementById('dompet-activity-log').innerHTML = '<div class="empty-message">Tidak ada riwayat aktivitas</div>';
    }
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

// ---------------------------------------------------------------------------
// Activity Log
// ---------------------------------------------------------------------------
function _dompetRenderActivityLog() {
  var container = document.getElementById('dompet-activity-log');
  if (!container) return;

  if (!_dompetState.activities || !_dompetState.activities.length) {
    container.innerHTML = '<div class="empty-message">Belum ada aktivitas</div>';
    return;
  }

  var tableHtml = '<div class="glass-card p-0 overflow-hidden">' +
    '<div class="overflow-x-auto">' +
      '<table class="activity-table">' +
        '<thead>' +
          '<tr>' +
            '<th>Waktu</th>' +
            '<th>Aktivitas</th>' +
            '<th>Dompet</th>' +
            '<th class="text-end">Perubahan</th>' +
            '<th class="text-end">Saldo Sebelum</th>' +
            '<th class="text-end">Saldo Sesudah</th>' +
            '<th>Keterangan</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>';

  _dompetState.activities.forEach(function(activity) {
    var timestamp = new Date(activity.timestamp);
    var timeStr = timestamp.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
                  timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    var aktivitasColor = '#206bc4';
    var aktivitasIcon = 'wallet';
    if (activity.aktivitas === 'Tambah Dompet') {
      aktivitasColor = '#2fb344';
      aktivitasIcon = 'plus';
    } else if (activity.aktivitas === 'Edit Dompet') {
      aktivitasColor = '#f59f00';
      aktivitasIcon = 'edit';
    } else if (activity.aktivitas === 'Hapus Dompet') {
      aktivitasColor = '#d63939';
      aktivitasIcon = 'trash';
    } else if (activity.aktivitas === 'Transfer Masuk') {
      aktivitasColor = '#2fb344';
      aktivitasIcon = 'arrow-down';
    } else if (activity.aktivitas === 'Transfer Keluar') {
      aktivitasColor = '#d63939';
      aktivitasIcon = 'arrow-up';
    }

    var perubahanStr = '';
    if (activity.perubahanSaldo !== 0) {
      var sign = activity.perubahanSaldo > 0 ? '+' : '';
      var colorClass = activity.perubahanSaldo > 0 ? 'text-success' : 'text-danger';
      perubahanStr = '<span class="' + colorClass + ' fw-semibold">' + sign + formatCurrency(activity.perubahanSaldo) + '</span>';
    } else {
      perubahanStr = '<span class="text-muted">-</span>';
    }

    var keterangan = activity.keterangan || '';
    if (activity.dompetTerkaitNama) {
      keterangan = keterangan || (activity.aktivitas === 'Transfer Masuk' ? 'Dari ' + activity.dompetTerkaitNama : 'Ke ' + activity.dompetTerkaitNama);
    }

    tableHtml += '<tr>' +
      '<td class="nowrap">' + timeStr + '</td>' +
      '<td>' +
        '<div class="d-flex align-items-center gap-2">' +
          '<span class="activity-icon" style="background:' + aktivitasColor + '22;color:' + aktivitasColor + ';">' +
            '<i class="ti ti-' + aktivitasIcon + '"></i>' +
          '</span>' +
          '<span class="fw-medium">' + activity.aktivitas + '</span>' +
        '</div>' +
      '</td>' +
      '<td>' + escapeHTML(activity.dompetNama) + '</td>' +
      '<td class="text-end">' + perubahanStr + '</td>' +
      '<td class="text-end text-muted">' + formatCurrency(activity.saldoSebelum) + '</td>' +
      '<td class="text-end fw-semibold">' + formatCurrency(activity.saldoSesudah) + '</td>' +
      '<td class="text-muted">' + escapeHTML(keterangan || '-') + '</td>' +
    '</tr>';
  });

  tableHtml += '</tbody></table></div></div>';
  container.innerHTML = tableHtml;
}

if (typeof window !== 'undefined') {
  window.renderDompet = renderDompet;
}

if (typeof module !== 'undefined') {
  module.exports = { renderDompet, _dompetBuildCard };
}
