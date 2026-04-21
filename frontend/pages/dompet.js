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
          '<small style="color:var(--color-text-muted);">Masukkan angka tanpa titik atau koma pemisah</small>' +
        '</div>'
      : '') +
      '<div class="form-group">' +
        '<label>Ikon</label>' +
        '<div style="display:flex;gap:8px;align-items:center;">' +
          '<span style="font-size:22px;"><i class="ti ti-' + (d.ikon || 'wallet') + '" id="fd-ikon-preview"></i></span>' +
          '<select id="fd-ikon" style="flex:1;">' +
            buildIconOptions(d.ikon || 'wallet') +
          '</select>' +
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
    btn.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px;"></span> Menyimpan...';
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
    '<div style="margin-top:40px;">' +
      '<h3 style="font-size:18px;font-weight:600;margin-bottom:16px;"><i class="ti ti-history me-2"></i>Riwayat Aktivitas</h3>' +
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
      document.getElementById('dompet-grid').innerHTML = '<div style="color:var(--color-danger);">Gagal memuat dompet.</div>';
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
      document.getElementById('dompet-activity-log').innerHTML = '<div style="color:var(--color-text-muted);padding:20px;text-align:center;">Tidak ada riwayat aktivitas</div>';
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
    container.innerHTML = '<div style="color:var(--color-text-muted);padding:20px;text-align:center;">Belum ada aktivitas</div>';
    return;
  }

  var tableHtml = '<div class="glass-card" style="padding:0;overflow:hidden;">' +
    '<div style="overflow-x:auto;">' +
      '<table style="width:100%;border-collapse:collapse;">' +
        '<thead>' +
          '<tr style="background:var(--color-bg-secondary);border-bottom:1px solid var(--color-border);">' +
            '<th style="padding:12px;text-align:left;font-size:12px;font-weight:600;color:var(--color-text-muted);">Waktu</th>' +
            '<th style="padding:12px;text-align:left;font-size:12px;font-weight:600;color:var(--color-text-muted);">Aktivitas</th>' +
            '<th style="padding:12px;text-align:left;font-size:12px;font-weight:600;color:var(--color-text-muted);">Dompet</th>' +
            '<th style="padding:12px;text-align:right;font-size:12px;font-weight:600;color:var(--color-text-muted);">Perubahan</th>' +
            '<th style="padding:12px;text-align:right;font-size:12px;font-weight:600;color:var(--color-text-muted);">Saldo Sebelum</th>' +
            '<th style="padding:12px;text-align:right;font-size:12px;font-weight:600;color:var(--color-text-muted);">Saldo Sesudah</th>' +
            '<th style="padding:12px;text-align:left;font-size:12px;font-weight:600;color:var(--color-text-muted);">Keterangan</th>' +
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
      var color = activity.perubahanSaldo > 0 ? '#2fb344' : '#d63939';
      perubahanStr = '<span style="color:' + color + ';font-weight:600;">' + sign + formatCurrency(activity.perubahanSaldo) + '</span>';
    } else {
      perubahanStr = '<span style="color:var(--color-text-muted);">-</span>';
    }

    var keterangan = activity.keterangan || '';
    if (activity.dompetTerkaitNama) {
      keterangan = keterangan || (activity.aktivitas === 'Transfer Masuk' ? 'Dari ' + activity.dompetTerkaitNama : 'Ke ' + activity.dompetTerkaitNama);
    }

    tableHtml += '<tr style="border-bottom:1px solid var(--color-border);">' +
      '<td style="padding:12px;font-size:13px;white-space:nowrap;">' + timeStr + '</td>' +
      '<td style="padding:12px;">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<span style="width:28px;height:28px;border-radius:6px;background:' + aktivitasColor + '22;color:' + aktivitasColor + ';display:flex;align-items:center;justify-content:center;font-size:14px;">' +
            '<i class="ti ti-' + aktivitasIcon + '"></i>' +
          '</span>' +
          '<span style="font-size:13px;font-weight:500;">' + activity.aktivitas + '</span>' +
        '</div>' +
      '</td>' +
      '<td style="padding:12px;font-size:13px;">' + activity.dompetNama + '</td>' +
      '<td style="padding:12px;text-align:right;font-size:13px;">' + perubahanStr + '</td>' +
      '<td style="padding:12px;text-align:right;font-size:13px;color:var(--color-text-muted);">' + formatCurrency(activity.saldoSebelum) + '</td>' +
      '<td style="padding:12px;text-align:right;font-size:13px;font-weight:600;">' + formatCurrency(activity.saldoSesudah) + '</td>' +
      '<td style="padding:12px;font-size:13px;color:var(--color-text-muted);">' + (keterangan || '-') + '</td>' +
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
