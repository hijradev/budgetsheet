/**
 * laporan.js — Halaman Laporan BudgetSheet
 * Vanilla JS globals, renders into #page-content
 */

var _laporanFilter = {
  periode: 'Bulanan',
  tanggalMulai: '',
  tanggalAkhir: '',
};

// ---------------------------------------------------------------------------
// Helper: default date range for a given period
// ---------------------------------------------------------------------------
function _defaultTanggalLaporan(periode) {
  var now = new Date();
  var pad = function(n) { return String(n).padStart(2, '0'); };
  var fmt = function(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };

  if (periode === 'Harian') {
    return { mulai: fmt(now), akhir: fmt(now) };
  }
  if (periode === 'Mingguan') {
    var day = now.getDay() || 7;
    var mon = new Date(now); mon.setDate(now.getDate() - day + 1);
    var sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { mulai: fmt(mon), akhir: fmt(sun) };
  }
  if (periode === 'Tahunan') {
    return { mulai: now.getFullYear() + '-01-01', akhir: now.getFullYear() + '-12-31' };
  }
  // Bulanan (default)
  var y = now.getFullYear(), m = now.getMonth() + 1;
  var lastDay = new Date(y, m, 0).getDate();
  return { mulai: y + '-' + pad(m) + '-01', akhir: y + '-' + pad(m) + '-' + pad(lastDay) };
}

// ---------------------------------------------------------------------------
// Build per-category expense table
// ---------------------------------------------------------------------------
function _buildTabelKategoriLaporan(perKategori) {
  if (!perKategori || !perKategori.length) {
    return '<p class="text-muted">Tidak ada data pengeluaran.</p>';
  }
  var rows = perKategori.map(function(k) {
    var pct = (k.persentase || 0).toFixed(1);
    return '<tr>' +
      '<td>' + escapeHTML(k.nama || k.kategori || '—') + '</td>' +
      '<td>' + formatCurrency(k.total || 0) + '</td>' +
      '<td>' +
        '<div class="d-flex align-items-center gap-2">' +
          '<div class="progress flex-grow-1 progress-sm">' +
            '<div class="progress-bar bg-danger" style="width:' + (k.persentase || 0) + '%;"></div>' +
          '</div>' +
          '<span class="text-muted small">' + pct + '%</span>' +
        '</div>' +
      '</td>' +
    '</tr>';
  }).join('');

  return '<div class="table-responsive">' +
    '<table class="table table-sm">' +
      '<thead><tr><th>Kategori</th><th>Total</th><th>Persentase</th></tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table>' +
  '</div>';
}

// ---------------------------------------------------------------------------
// Build budget vs actual table (monthly only)
// ---------------------------------------------------------------------------
function _buildTabelAnggaranLaporan(anggaranVsAktual) {
  if (!anggaranVsAktual || !anggaranVsAktual.length) {
    return '<p class="text-muted">Tidak ada data anggaran untuk periode ini.</p>';
  }
  var rows = anggaranVsAktual.map(function(a) {
    var persen = a.jumlahAnggaran > 0 ? Math.round((a.realisasi / a.jumlahAnggaran) * 100) : 0;
    var barCls = persen >= 100 ? 'bg-danger' : persen >= 80 ? 'bg-warning' : 'bg-success';
    var statusBadge = persen >= 100
      ? '<span class="badge badge-danger">Kritis</span>'
      : persen >= 80
        ? '<span class="badge badge-warning">Peringatan</span>'
        : '<span class="badge badge-success">Normal</span>';
    return '<tr>' +
      '<td>' + escapeHTML(a.kategoriNama || a.kategoriId || '—') + '</td>' +
      '<td>' + formatCurrency(a.jumlahAnggaran || 0) + '</td>' +
      '<td>' + formatCurrency(a.realisasi || 0) + '</td>' +
      '<td>' + statusBadge + '</td>' +
    '</tr>';
  }).join('');

  return '<div class="table-responsive">' +
    '<table class="table table-sm">' +
      '<thead><tr><th>Kategori</th><th>Anggaran</th><th>Realisasi</th><th>Status</th></tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table>' +
  '</div>';
}

// ---------------------------------------------------------------------------
// Load and render report data
// ---------------------------------------------------------------------------
function _muatLaporan() {
  var laporanContent = document.getElementById('laporan-content');
  if (!laporanContent) return;

  laporanContent.innerHTML = '';
  showPageLoader();

  var filter = {
    periode:      _laporanFilter.periode,
    tanggalMulai: _laporanFilter.tanggalMulai,
    tanggalAkhir: _laporanFilter.tanggalAkhir,
  };

  callBackend('getLaporanData', filter, getToken()).then(function(res) {
    hidePageLoader();
    if (!res || !res.success) {
      var msg = (res && res.error) || 'Gagal memuat laporan';
      showToast(msg, 'error');
      laporanContent.innerHTML = '<div class="alert alert-danger">' + msg + '</div>';
      return;
    }
    _renderLaporanContent(res.data || {});
  }).catch(function() {
    hidePageLoader();
    showToast('Gagal terhubung ke server', 'error');
    laporanContent.innerHTML = '<div class="alert alert-danger">Gagal memuat data laporan.</div>';
  });
}

function _renderLaporanContent(data) {
  var laporanContent = document.getElementById('laporan-content');
  if (!laporanContent) return;

  var perKategori      = data.perKategori      || [];
  var perPeriode       = data.perPeriode       || [];
  var anggaranVsAktual = data.anggaranVsAktual || [];
  var isBulanan        = _laporanFilter.periode === 'Bulanan';

  // Update stats cards above the filter
  _updateStatsCards(data);

  laporanContent.innerHTML =
    // Charts row
    '<div class="grid-2 mb-4">' +
      '<div class="glass-card p-3">' +
        '<div class="fw-semibold mb-2"><i class="ti ti-chart-bar me-1"></i>Pemasukan vs Pengeluaran</div>' +
        (perPeriode.length
          ? '<div class="chart-container-lg"><canvas id="laporan-bar-chart"></canvas></div>'
          : '<div class="text-muted text-center py-4">Belum ada data.</div>') +
      '</div>' +
      '<div class="glass-card p-3">' +
        '<div class="fw-semibold mb-2"><i class="ti ti-chart-donut me-1"></i>Pengeluaran per Kategori</div>' +
        (perKategori.length
          ? '<div class="chart-container-lg"><canvas id="laporan-pie-chart"></canvas></div>'
          : '<div class="text-muted text-center py-4">Belum ada data.</div>') +
      '</div>' +
    '</div>' +

    // Per-category table
    '<div class="glass-card p-3 mb-4">' +
      '<div class="fw-semibold mb-2"><i class="ti ti-tag me-1"></i>Detail Pengeluaran per Kategori</div>' +
      _buildTabelKategoriLaporan(perKategori) +
    '</div>' +

    // Budget vs actual (monthly only)
    (isBulanan
      ? '<div class="glass-card p-3 mb-4">' +
          '<div class="fw-semibold mb-2"><i class="ti ti-chart-pie me-1"></i>Anggaran vs Realisasi</div>' +
          _buildTabelAnggaranLaporan(anggaranVsAktual) +
        '</div>'
      : '');

  // Render charts
  if (perPeriode.length || perKategori.length) {
    _ensureChartJSLaporan().then(function() {
      // Bar chart
      if (perPeriode.length) {
        var labels      = perPeriode.map(function(p) { return p.label; });
        var pemasukan   = perPeriode.map(function(p) { return p.pemasukan || 0; });
        var pengeluaran = perPeriode.map(function(p) { return p.pengeluaran || 0; });
        renderBarChart('laporan-bar-chart', labels, [
          { label: 'Pemasukan',   data: pemasukan,   backgroundColor: 'rgba(107,203,119,0.7)', borderColor: '#276749' },
          { label: 'Pengeluaran', data: pengeluaran, backgroundColor: 'rgba(239,108,108,0.7)', borderColor: '#9b2335' },
        ]);
      }
      // Pie chart
      if (perKategori.length) {
        var pLabels = perKategori.map(function(p) { return p.nama || p.label || ''; });
        var pValues = perKategori.map(function(p) { return p.total || p.value || 0; });
        var pColors = perKategori.map(function(p) { return p.warna || p.color || null; }).filter(Boolean);
        renderPieChart('laporan-pie-chart', pLabels, pValues, pColors.length === pLabels.length ? pColors : undefined);
      }
    }).catch(function(e) {
      console.warn('[Laporan] Chart.js gagal dimuat:', e);
    });
  }
}

function _ensureChartJSLaporan() {
  if (typeof Chart !== 'undefined') return Promise.resolve();
  return new Promise(function(resolve, reject) {
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// ---------------------------------------------------------------------------
// Update stats cards in-place (called after data loads)
// ---------------------------------------------------------------------------
function _updateStatsCards(data) {
  var totalPemasukan   = (data && data.totalPemasukan)   || 0;
  var totalPengeluaran = (data && data.totalPengeluaran) || 0;
  var saldoBersih      = (data && data.saldoBersih)      || 0;
  var saldoCls = saldoBersih >= 0 ? 'text-success' : 'text-danger';

  var elPemasukan   = document.getElementById('stat-pemasukan');
  var elPengeluaran = document.getElementById('stat-pengeluaran');
  var elSaldo       = document.getElementById('stat-saldo');

  if (elPemasukan)   elPemasukan.textContent   = formatCurrency(totalPemasukan);
  if (elPengeluaran) elPengeluaran.textContent = formatCurrency(totalPengeluaran);
  if (elSaldo) {
    elSaldo.textContent  = formatCurrency(saldoBersih);
    elSaldo.className    = 'fs-4 fw-bold ' + saldoCls;
  }
}

// ---------------------------------------------------------------------------
// Render page
// ---------------------------------------------------------------------------
function renderLaporan() {
  var content = document.getElementById('page-content');
  if (!content) return;

  // Set default dates if not set
  var def = _defaultTanggalLaporan(_laporanFilter.periode);
  if (!_laporanFilter.tanggalMulai) _laporanFilter.tanggalMulai = def.mulai;
  if (!_laporanFilter.tanggalAkhir) _laporanFilter.tanggalAkhir = def.akhir;

  var periodeList = ['Harian', 'Mingguan', 'Bulanan', 'Tahunan'];
  var dropdownItems = periodeList.map(function(p) {
    var isActive = _laporanFilter.periode === p;
    return '<li><a class="dropdown-item' + (isActive ? ' active' : '') +
      '" href="#" data-periode="' + p + '">' + p + '</a></li>';
  }).join('');

  content.innerHTML =
    '<div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">' +
      '<h2 class="mb-0 fw-bold"><i class="ti ti-report-analytics me-2"></i>Laporan</h2>' +
    '</div>' +

      // Stats cards — above filter
      '<div class="row g-3 mb-4">' +
        '<div class="col-12 col-sm-4">' +
          '<div class="glass-card p-3 text-center">' +
            '<div class="text-muted small mb-1">Total Pemasukan</div>' +
            '<div class="fs-4 fw-bold text-success" id="stat-pemasukan">—</div>' +
          '</div>' +
        '</div>' +
        '<div class="col-12 col-sm-4">' +
          '<div class="glass-card p-3 text-center">' +
            '<div class="text-muted small mb-1">Total Pengeluaran</div>' +
            '<div class="fs-4 fw-bold text-danger" id="stat-pengeluaran">—</div>' +
          '</div>' +
        '</div>' +
        '<div class="col-12 col-sm-4">' +
          '<div class="glass-card p-3 text-center">' +
            '<div class="text-muted small mb-1">Saldo Bersih</div>' +
            '<div class="fs-4 fw-bold text-muted" id="stat-saldo">—</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // Filter card
      '<div class="glass-card p-3 mb-4 position-relative z-200 overflow-visible">' +
        '<div class="grid-4 gap-3" style="align-items:end;">' +
          '<div>' +
            '<label class="form-label mb-1 small">Periode</label>' +
            '<div class="dropdown dropdown-full">' +
              '<button class="btn btn-outline-secondary dropdown-toggle" type="button" ' +
                'id="dropdown-periode" data-bs-toggle="dropdown" aria-expanded="false">' +
                '<span><i class="ti ti-calendar me-1"></i>' + _laporanFilter.periode + '</span>' +
              '</button>' +
              '<ul class="dropdown-menu" aria-labelledby="dropdown-periode">' +
                dropdownItems +
              '</ul>' +
            '</div>' +
          '</div>' +
          '<div>' +
            '<label class="form-label mb-1 small">Dari</label>' +
            '<input type="date" class="form-control form-control-sm" id="f-laporan-mulai" ' +
              'value="' + _laporanFilter.tanggalMulai + '">' +
          '</div>' +
          '<div>' +
            '<label class="form-label mb-1 small">Sampai</label>' +
            '<input type="date" class="form-control form-control-sm" id="f-laporan-akhir" ' +
              'value="' + _laporanFilter.tanggalAkhir + '">' +
          '</div>' +
          '<div>' +
            '<label class="form-label mb-1 small filter-label-hidden">Filter</label>' +
            '<button class="btn btn-primary w-full" id="btn-tampilkan-laporan" style="justify-content:center;padding:12.5px 14px;font-size:var(--font-small);">' +
              '<i class="ti ti-search me-1"></i>Tampilkan' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div id="laporan-content"></div>';

  // Dropdown periode item clicks
  content.querySelectorAll('.dropdown-item[data-periode]').forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      _laporanFilter.periode = item.getAttribute('data-periode');
      var d = _defaultTanggalLaporan(_laporanFilter.periode);
      _laporanFilter.tanggalMulai = d.mulai;
      _laporanFilter.tanggalAkhir = d.akhir;
      renderLaporan();
    });
  });

  // Tampilkan button
  document.getElementById('btn-tampilkan-laporan').addEventListener('click', function() {
    _laporanFilter.tanggalMulai = document.getElementById('f-laporan-mulai').value;
    _laporanFilter.tanggalAkhir = document.getElementById('f-laporan-akhir').value;
    _muatLaporan();
  });

  _muatLaporan();
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
if (typeof window !== 'undefined') {
  window.renderLaporan = renderLaporan;
}

if (typeof module !== 'undefined') {
  module.exports = { renderLaporan, _defaultTanggalLaporan, _buildTabelKategoriLaporan, _buildTabelAnggaranLaporan };
}
