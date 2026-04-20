/**
 * dashboard.js — Halaman Dashboard BudgetSheet
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function _dashJenisClass(jenis) {
  if (jenis === 'Pemasukan') return 'success';
  if (jenis === 'Pengeluaran') return 'danger';
  return 'info';
}

function _buildTransaksiRow(t) {
  var cls = _dashJenisClass(t.jenis);
  var prefix = t.jenis === 'Pengeluaran' ? '-' : (t.jenis === 'Pemasukan' ? '+' : '');
  return '<tr>' +
    '<td>' + formatDate(t.tanggal) + '</td>' +
    '<td><span class="badge bg-' + cls + '-lt text-' + cls + '">' + (t.jenis || '-') + '</span></td>' +
    '<td>' + (t.kategori || '-') + '</td>' +
    '<td>' + (t.dompet || '-') + '</td>' +
    '<td class="text-' + cls + ' fw-semibold">' + prefix + formatCurrency(t.jumlah) + '</td>' +
    '<td class="text-muted small">' + (t.catatan || '-') + '</td>' +
  '</tr>';
}

function _buildLanggananItem(l) {
  var jatuhTempo = new Date(l.tanggalJatuhTempo);
  var hariIni = new Date();
  hariIni.setHours(0, 0, 0, 0);
  var selisihHari = Math.ceil((jatuhTempo - hariIni) / (1000 * 60 * 60 * 24));
  var isWarning = selisihHari <= 3;

  return '<div class="d-flex align-items-center justify-content-between py-2 border-bottom">' +
    '<div class="d-flex align-items-center gap-2">' +
      '<span class="badge ' + (isWarning ? 'bg-warning' : 'bg-blue') + ' badge-pill" style="width:10px;height:10px;padding:0;border-radius:50%;"></span>' +
      '<div>' +
        '<div class="fw-medium">' + (l.nama || '-') + '</div>' +
        '<div class="text-muted small">' + formatDate(l.tanggalJatuhTempo) + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="text-end">' +
      '<div class="fw-bold' + (isWarning ? ' text-warning' : '') + '">' + formatCurrency(l.jumlah) + '</div>' +
      (isWarning
        ? '<div class="text-warning small">' + (selisihHari <= 0 ? 'Jatuh tempo hari ini!' : selisihHari + ' hari lagi') + '</div>'
        : '') +
    '</div>' +
  '</div>';
}

// ---------------------------------------------------------------------------
// Main render
// ---------------------------------------------------------------------------
function renderDashboard() {
  var content = document.getElementById('page-content');
  if (!content) return;

  // Loading spinner
  showPageLoader();

  callBackend('getDashboardData', getToken()).then(function(res) {
    hidePageLoader();
    if (!res || !res.success) {
      showToast((res && res.error) ? res.error : 'Gagal memuat data dashboard', 'error');
      content.innerHTML =
        '<div class="alert alert-danger m-3">' +
          '<i class="ti ti-alert-circle me-2"></i>' +
          ((res && res.error) ? res.error : 'Gagal memuat data dashboard') +
        '</div>';
      return;
    }

    var d = res.data || {};
    var totalSaldo       = d.totalSaldo       || 0;
    var totalPemasukan   = d.totalPemasukan   || 0;
    var totalPengeluaran = d.totalPengeluaran || 0;
    var totalAnggaran    = d.totalAnggaran    || 0;
    var transaksi        = (d.transaksiTerbaru   || []).slice(0, 6);
    var langganan        = (d.langgananJatuhTempo || []);
    var pieData          = d.pieChart        || [];
    var weeklyData       = d.weeklySpending  || [];

    // -----------------------------------------------------------------------
    var sisaAnggaran     = totalAnggaran - totalPengeluaran;
    var jumlahDompet     = d.jumlahDompet     || 0;

    // -----------------------------------------------------------------------
    // Calculate budget usage percentage
    // -----------------------------------------------------------------------
    var budgetUsagePercent = totalAnggaran > 0 ? Math.min((totalPengeluaran / totalAnggaran) * 100, 100) : 0;
    var budgetUsageColor = budgetUsagePercent >= 90 ? 'danger' : (budgetUsagePercent >= 70 ? 'warning' : 'success');
    var availabilityPercent = totalAnggaran > 0 ? Math.max(100 - budgetUsagePercent, 0) : 0;

    // -----------------------------------------------------------------------
    // Stats row
    // -----------------------------------------------------------------------
    var statsHtml =
      '<div class="grid-4 mb-4">' +
        _statCard('ti-arrow-down-circle', 'Pemasukan Bulan Ini',   formatCurrency(totalPemasukan),   'success') +
        _statCard('ti-arrow-up-circle',   'Pengeluaran Bulan Ini', formatCurrency(totalPengeluaran), 'danger') +
        _statCard('ti-chart-pie',         'Total Anggaran',        formatCurrency(totalAnggaran),    'warning') +
        _statCard('ti-chart-bar',         'Anggaran Terpakai',     formatCurrency(totalPengeluaran), budgetUsageColor) +
      '</div>';

    // -----------------------------------------------------------------------
    // Summary & Charts row
    // -----------------------------------------------------------------------
    var summaryHtml =
      '<div class="grid-2 mb-4">' +
        '<div class="glass-card p-4">' +
          '<div class="d-flex align-items-center gap-3 mb-3">' +
            '<div class="avatar bg-primary-lt">' +
              '<i class="ti ti-book text-primary fs-3"></i>' +
            '</div>' +
            '<div>' +
              '<h3 class="fw-bold mb-0 text-primary">Ringkasan Keuangan</h3>' +
              '<p class="text-muted small mb-0">Gambaran umum kondisi keuangan Anda</p>' +
            '</div>' +
          '</div>' +

          '<div class="text-center mb-4">' +
            '<div class="fw-semibold text-muted mb-1">Total Saldo</div>' +
            '<div class="fw-bold text-primary saldo-total">' + formatCurrency(totalSaldo) + '</div>' +
            '<div class="text-muted small mt-1">Tersebar di <strong>' + jumlahDompet + '</strong> dompet</div>' +
          '</div>' +

          '<div class="border-top pt-3">' +
            '<div class="d-flex justify-content-between align-items-center mb-2">' +
              '<span class="fw-bold">Anggaran tersedia</span>' +
              '<span class="fw-bold">' + formatCurrency(sisaAnggaran < 0 ? 0 : sisaAnggaran) + '</span>' +
            '</div>' +
            '<div class="progress mb-2" style="height: 8px;">' +
              '<div class="progress-bar" style="width:' + availabilityPercent + '%;background:#206bc4;border-radius:999px;"></div>' +
            '</div>' +
            '<div class="d-flex justify-content-between align-items-center">' +
              '<span class="text-muted small">Persentase dana yang masih bisa dipakai</span>' +
              '<span class="fw-semibold" style="color:#206bc4;">' + availabilityPercent.toFixed(1).replace('.', ',') + '%</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        
        '<div class="glass-card p-3">' +
          '<div class="fw-semibold mb-2"><i class="ti ti-chart-line me-1"></i>Pengeluaran Mingguan</div>' +
          (weeklyData.length
            ? '<div style="position:relative;height:220px;"><canvas id="line-chart"></canvas></div>'
            : '<div class="text-muted text-center py-4">Belum ada data.</div>') +
        '</div>' +
      '</div>';

    // -----------------------------------------------------------------------
    // Recent transactions table
    // -----------------------------------------------------------------------
    var transaksiRows = transaksi.length
      ? transaksi.map(_buildTransaksiRow).join('')
      : '<tr><td colspan="6" class="text-muted text-center py-3">Belum ada transaksi.</td></tr>';

    var transaksiHtml =
      '<div class="glass-card mb-4">' +
        '<div class="d-flex align-items-center justify-content-between p-3 border-bottom flex-wrap gap-2">' +
          '<div class="fw-semibold"><i class="ti ti-history me-1"></i>Transaksi Terbaru</div>' +
          '<a href="#/transaksi" class="btn btn-sm btn-outline-primary"><span class="btn-text">Lihat Semua</span><i class="ti ti-arrow-right d-md-none"></i></a>' +
        '</div>' +
        '<div class="table-responsive">' +
          '<table class="table table-sm mb-0">' +
            '<thead><tr>' +
              '<th>Tanggal</th><th>Jenis</th><th>Kategori</th><th>Dompet</th><th>Jumlah</th><th>Catatan</th>' +
            '</tr></thead>' +
            '<tbody>' + transaksiRows + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';

    // -----------------------------------------------------------------------
    // Upcoming subscriptions
    // -----------------------------------------------------------------------
    var langgananItems = langganan.length
      ? langganan.map(_buildLanggananItem).join('')
      : '<div class="text-muted text-center py-3">Tidak ada tagihan dalam 7 hari ke depan.</div>';

    var langgananHtml =
      '<div class="glass-card mb-4">' +
        '<div class="p-3 border-bottom fw-semibold"><i class="ti ti-bell me-1"></i>Langganan Jatuh Tempo</div>' +
        '<div class="p-3">' + langgananItems + '</div>' +
      '</div>';

    // -----------------------------------------------------------------------
    // Assemble
    // -----------------------------------------------------------------------
    content.innerHTML =
      '<h2 class="mb-4 fw-bold">Dashboard</h2>' +
      statsHtml +
      summaryHtml +
      transaksiHtml +
      langgananHtml;

    // -----------------------------------------------------------------------
    // Render charts after DOM is ready
    // -----------------------------------------------------------------------
    if (weeklyData.length) {
      _ensureChartJS().then(function() {
        var wLabels = weeklyData.map(function(w) { return w.label || w.minggu || ''; });
        var wPengeluaran = weeklyData.map(function(w) { return w.pengeluaran || w.jumlah || w.value || 0; });
        var wPemasukan   = weeklyData.map(function(w) { return w.pemasukan || 0; });
        renderBarChart('line-chart', wLabels, [
          { label: 'Pengeluaran', data: wPengeluaran, backgroundColor: 'rgba(239,108,108,0.7)', borderColor: '#9b2335' },
          { label: 'Pemasukan',   data: wPemasukan,   backgroundColor: 'rgba(107,203,119,0.7)', borderColor: '#276749' },
        ]);
      }).catch(function(e) {
        console.warn('[Dashboard] Chart.js gagal dimuat:', e);
      });
    }

  }).catch(function(err) {
    hidePageLoader();
    showToast(err.message || 'Terjadi kesalahan', 'error');
    content.innerHTML =
      '<div class="alert alert-danger m-3">' +
        '<i class="ti ti-alert-circle me-2"></i>' + (err.message || 'Terjadi kesalahan') +
      '</div>';
  });
}

// ---------------------------------------------------------------------------
// Stat card builder
// ---------------------------------------------------------------------------
function _statCard(icon, label, value, color) {
  return '<div class="glass-card stat-card p-3">' +
    '<div class="d-flex align-items-center gap-3">' +
      '<div class="avatar bg-' + color + '-lt">' +
        '<i class="ti ' + icon + ' text-' + color + ' fs-3"></i>' +
      '</div>' +
      '<div>' +
        '<div class="text-muted small">' + label + '</div>' +
        '<div class="fs-5 fw-bold">' + value + '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

// ---------------------------------------------------------------------------
// Lazy-load Chart.js
// ---------------------------------------------------------------------------
function _ensureChartJS() {
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
// Export
// ---------------------------------------------------------------------------
if (typeof window !== 'undefined') {
  window.renderDashboard = renderDashboard;
}

if (typeof module !== 'undefined') {
  module.exports = { renderDashboard, _statCard, _buildTransaksiRow, _buildLanggananItem };
}
