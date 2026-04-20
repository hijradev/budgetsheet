/**
 * LaporanService.gs — Logika bisnis laporan keuangan untuk BudgetSheet
 * GAS global scope — no require/module.exports
 *
 * deps:
 *   - deps.getSheet(sheetName)   — mengembalikan sheet (mock atau nyata)
 *   - deps.SpreadsheetHelper     — modul SpreadsheetHelper
 *   - deps.TRANSAKSI_HEADERS     — array header kolom Transaksi
 *   - deps.KategoriService       — modul KategoriService (opsional)
 *   - deps.DompetService         — modul DompetService (opsional)
 *   - deps.AnggaranService       — modul AnggaranService (opsional)
 *   - deps.LanggananService      — modul LanggananService (opsional)
 */

var LaporanService = {

  /**
   * Hitung saldo bersih dari pemasukan dan pengeluaran.
   * Fungsi murni.
   *
   * @param {number} pemasukan
   * @param {number} pengeluaran
   * @returns {number}
   */
  hitungSaldoBersih: function(pemasukan, pengeluaran) {
    return pemasukan - pengeluaran;
  },

  /**
   * Hitung persentase pengeluaran per kategori.
   * Fungsi murni.
   *
   * @param {Array} transaksiItems - transaksi Pengeluaran saja
   * @param {Array} kategoriList   - daftar kategori untuk label & warna
   * @returns {Array} diurutkan descending by total
   */
  hitungPersentaseKategori: function(transaksiItems, kategoriList) {
    if (!transaksiItems || transaksiItems.length === 0) return [];

    // Agregasi total per kategori
    var map = {};
    for (var i = 0; i < transaksiItems.length; i++) {
      var t = transaksiItems[i];
      var kid = String(t.KategoriID || '').trim();
      map[kid] = (map[kid] || 0) + Number(t.Jumlah || 0);
    }

    var grandTotal = 0;
    for (var kid in map) {
      grandTotal += map[kid];
    }

    var result = [];
    for (var kategoriId in map) {
      var total = map[kategoriId];
      var kat = null;
      for (var j = 0; j < (kategoriList || []).length; j++) {
        var k = kategoriList[j];
        if (String(k.id || k.ID || '').trim() === kategoriId) {
          kat = k;
          break;
        }
      }
      if (!kat) kat = { nama: 'Tanpa Kategori', warna: '#95a5a6' };

      var label = kat.nama || kat.Nama || 'Tanpa Kategori';
      var color = kat.warna || kat.Warna || '#95a5a6';

      result.push({
        kategoriId:  kategoriId,
        label:       label,
        nama:        label,
        value:       total,
        total:       total,
        color:       color,
        warna:       color,
        persentase:  grandTotal === 0 ? 0 : Math.round((total / grandTotal) * 100 * 100) / 100
      });
    }

    // Urutkan descending by value
    result.sort(function(a, b) { return b.value - a.value; });

    return result;
  },

  /**
   * Hitung rentang tanggal berdasarkan periode.
   * Fungsi murni.
   *
   * @param {string} periode - 'Harian'|'Mingguan'|'Bulanan'|'Tahunan'
   * @returns {{ tanggal_mulai: Date, tanggal_akhir: Date }}
   */
  hitungRentangTanggal: function(periode) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    if (periode === 'Harian') {
      var mulai = new Date(today);
      var akhir = new Date(today);
      akhir.setHours(23, 59, 59, 999);
      return { tanggal_mulai: mulai, tanggal_akhir: akhir };
    }

    if (periode === 'Mingguan') {
      var mulai = new Date(today);
      mulai.setDate(today.getDate() - 6);
      var akhir = new Date(today);
      akhir.setHours(23, 59, 59, 999);
      return { tanggal_mulai: mulai, tanggal_akhir: akhir };
    }

    if (periode === 'Bulanan') {
      var year  = today.getFullYear();
      var month = today.getMonth();
      var mulai = new Date(year, month, 1, 0, 0, 0, 0);
      var akhir = new Date(year, month + 1, 0, 23, 59, 59, 999);
      return { tanggal_mulai: mulai, tanggal_akhir: akhir };
    }

    if (periode === 'Tahunan') {
      var year  = today.getFullYear();
      var mulai = new Date(year, 0, 1, 0, 0, 0, 0);
      var akhir = new Date(year, 11, 31, 23, 59, 59, 999);
      return { tanggal_mulai: mulai, tanggal_akhir: akhir };
    }

    // Default: hari ini
    var mulai = new Date(today);
    var akhir = new Date(today);
    akhir.setHours(23, 59, 59, 999);
    return { tanggal_mulai: mulai, tanggal_akhir: akhir };
  },

  /**
   * Kelompokkan transaksi berdasarkan periode untuk grafik tren.
   *
   * @param {Array}  items   - semua transaksi dalam rentang
   * @param {string} periode - 'Harian'|'Mingguan'|'Bulanan'|'Tahunan'
   * @param {Date}   mulai
   * @param {Date}   akhir
   * @returns {Array<{label: string, pemasukan: number, pengeluaran: number}>}
   */
  _groupByPeriode: function(items, periode, mulai, akhir) {
    var groups = {};
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    if (periode === 'Tahunan') {
      for (var m = 0; m < months.length; m++) {
        groups[months[m]] = { label: months[m], pemasukan: 0, pengeluaran: 0 };
      }
    } else {
      var curr   = new Date(mulai);
      var safety = 0;
      while (curr <= akhir && safety < 400) {
        var key   = curr.toISOString().split('T')[0];
        var label = curr.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        groups[key] = { label: label, pemasukan: 0, pengeluaran: 0 };
        curr.setDate(curr.getDate() + 1);
        safety++;
      }
    }

    for (var i = 0; i < items.length; i++) {
      var t   = items[i];
      var tgl = new Date(t.Tanggal);
      if (isNaN(tgl.getTime())) continue;

      var key;
      if (periode === 'Tahunan') {
        key = months[tgl.getMonth()];
      } else {
        key = tgl.toISOString().split('T')[0];
      }

      if (groups[key]) {
        var jumlah = Number(t.Jumlah || 0);
        if (t.Jenis === 'Pemasukan')    groups[key].pemasukan    += jumlah;
        else if (t.Jenis === 'Pengeluaran') groups[key].pengeluaran += jumlah;
      }
    }

    var result = [];
    for (var key in groups) {
      result.push(groups[key]);
    }
    return result;
  },

  /**
   * Hitung perbandingan anggaran vs realisasi.
   *
   * @param {Array}  pengeluaranItems
   * @param {Date}   mulai
   * @param {Date}   akhir
   * @param {object} deps
   * @returns {Array}
   */
  _getAnggaranVsAktual: function(pengeluaranItems, mulai, akhir, deps) {
    if (!deps.AnggaranService) return [];

    var bulan = mulai.getMonth() + 1;
    var tahun = mulai.getFullYear();

    try {
      var anggaranList = deps.AnggaranService.getAnggaran(deps) || [];
      var result = [];
      for (var i = 0; i < anggaranList.length; i++) {
        var a = anggaranList[i];
        var realisasi = 0;
        for (var j = 0; j < pengeluaranItems.length; j++) {
          var t = pengeluaranItems[j];
          if (String(t.KategoriID || '') === String(a.kategoriId || '')) {
            realisasi += Number(t.Jumlah || 0);
          }
        }
        var item = {};
        for (var key in a) {
          item[key] = a[key];
        }
        item.realisasi = realisasi;
        result.push(item);
      }
      return result;
    } catch (e) {
      return [];
    }
  },

  /**
   * Ambil data laporan berdasarkan filter periode.
   * Mengagregasi pemasukan (totalPemasukan), pengeluaran (totalPengeluaran),
   * saldo bersih (saldoBersih), breakdown per kategori, dan pengelompokan periode.
   *
   * @param {object} filter - { periode, tanggalMulai, tanggalAkhir, tanggal_mulai, tanggal_akhir }
   * @param {object} deps
   * @returns {{ totalPemasukan, totalPengeluaran, saldoBersih, perKategori, perPeriode, anggaranVsAktual, transaksi }}
   */
  getLaporanData: function(filter, deps) {
    var SpreadsheetHelper = deps.SpreadsheetHelper;
    var TRANSAKSI_HEADERS = deps.TRANSAKSI_HEADERS;

    // Baca semua transaksi
    var items = [];
    if (deps.items && deps.items.length > 0) {
      items = deps.items;
    } else if (deps.transaksiRows && deps.transaksiRows.length > 0) {
      for (var i = 1; i < deps.transaksiRows.length; i++) {
        items.push(SpreadsheetHelper.rowToObject(TRANSAKSI_HEADERS, deps.transaksiRows[i]));
      }
    } else {
      var sheet = deps.getSheet('Transaksi');
      var rows  = SpreadsheetHelper.batchRead(sheet);
      for (var i = 1; i < rows.length; i++) {
        items.push(SpreadsheetHelper.rowToObject(TRANSAKSI_HEADERS, rows[i]));
      }
    }

    // Normalisasi filter: camelCase dari frontend & snake_case dari Router internal
    var _mulaiStr = filter.tanggalMulai || filter.tanggal_mulai || '';
    var _akhirStr = filter.tanggalAkhir || filter.tanggal_akhir || '';

    var mulai, akhir;

    if (_mulaiStr && _akhirStr) {
      mulai = new Date(_mulaiStr);
      mulai.setHours(0, 0, 0, 0);
      akhir = new Date(_akhirStr);
      akhir.setHours(23, 59, 59, 999);
    } else if (filter.periode) {
      var rentang = LaporanService.hitungRentangTanggal(filter.periode);
      mulai = rentang.tanggal_mulai;
      akhir = rentang.tanggal_akhir;
    }

    // Filter berdasarkan rentang tanggal
    if (mulai && akhir) {
      var filtered = [];
      for (var i = 0; i < items.length; i++) {
        var tgl = new Date(items[i].Tanggal);
        if (tgl >= mulai && tgl <= akhir) filtered.push(items[i]);
      }
      items = filtered;
    }

    // Hitung total pemasukan dan pengeluaran
    var totalPemasukan  = 0;
    var totalPengeluaran = 0;

    for (var i = 0; i < items.length; i++) {
      var jumlah = Number(items[i].Jumlah || 0);
      if (items[i].Jenis === 'Pemasukan')      totalPemasukan  += jumlah;
      else if (items[i].Jenis === 'Pengeluaran') totalPengeluaran += jumlah;
    }

    var saldoBersih = LaporanService.hitungSaldoBersih(totalPemasukan, totalPengeluaran);

    // Kumpulkan transaksi Pengeluaran untuk breakdown kategori
    var pengeluaranItems = [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].Jenis === 'Pengeluaran') pengeluaranItems.push(items[i]);
    }

    // Ambil metadata kategori untuk label & warna
    var kategoriList = [];
    if (deps.kategoriList) {
      kategoriList = deps.kategoriList;
    } else if (deps.KategoriService) {
      try {
        kategoriList = deps.KategoriService.getKategori(deps);
      } catch (e) {
        if (typeof Logger !== 'undefined') Logger.log('Warning getLaporanData (Kategori): ' + e);
      }
    }

    var perKategori      = LaporanService.hitungPersentaseKategori(pengeluaranItems, kategoriList);
    var perPeriode       = LaporanService._groupByPeriode(items, filter.periode || 'Bulanan', mulai, akhir);
    var anggaranVsAktual = LaporanService._getAnggaranVsAktual(pengeluaranItems, mulai, akhir, deps);

    return {
      totalPemasukan:   totalPemasukan  || 0,
      totalPengeluaran: totalPengeluaran || 0,
      saldoBersih:      saldoBersih      || 0,
      perKategori:      perKategori      || [],
      perPeriode:       perPeriode       || [],
      anggaranVsAktual: anggaranVsAktual || [],
      transaksi:        items            || []
    };
  },

  /**
   * Ambil semua data yang dibutuhkan halaman Dashboard dalam satu panggilan.
   * Mengembalikan: total saldo dompet, pemasukan/pengeluaran bulan ini,
   * transaksi terbaru (maks 6), langganan jatuh tempo 7 hari ke depan.
   *
   * @param {object} deps
   * @returns {{
   *   totalSaldo: number,
   *   jumlahDompet: number,
   *   totalPemasukan: number,
   *   totalPengeluaran: number,
   *   totalAnggaran: number,
   *   transaksiTerbaru: Array,
   *   langgananJatuhTempo: Array,
   *   pieChart: Array,
   *   weeklySpending: Array
   * }}
   */
  getDashboardData: function(deps) {
    // ── 0. Caching logic ─────────────────────────────────────────────────────
    var cache = CacheService.getScriptCache();
    var version = cache.get('CACHE_PREFIX_VERSION') || '1';
    var cacheKey = 'dash_data_v' + version;
    
    try {
      var cached = cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      if (typeof Logger !== 'undefined') Logger.log('Cache read error: ' + e);
    }

    // ── Pre-fetch all data to avoid redundant sheet reads ───────────────────
    var SpreadsheetHelper = deps.SpreadsheetHelper;
    
    // Fetch all transactions once and transform to objects
    var trxSheet = deps.getSheet('Transaksi');
    var trxRows  = SpreadsheetHelper.batchRead(trxSheet);
    var items    = [];
    for (var i = 1; i < trxRows.length; i++) {
      items.push(SpreadsheetHelper.rowToObject(deps.TRANSAKSI_HEADERS, trxRows[i]));
    }
    
    // Inject pre-fetched items into deps for getLaporanData calls
    deps.items = items;

    // Fetch other lists once
    var dompetList = [];
    if (deps.DompetService) {
      try { dompetList = deps.DompetService.getDompet(deps); } catch (e) {}
    }
    deps.dompetList = dompetList; // For use in enriched data below

    var kategoriList = [];
    if (deps.KategoriService) {
      try { kategoriList = deps.KategoriService.getKategori(deps); } catch (e) {}
    }
    deps.kategoriList = kategoriList;

    var anggaranList = [];
    if (deps.AnggaranService) {
      try { anggaranList = deps.AnggaranService.getAnggaran(deps) || []; } catch (e) {}
    }
    deps.anggaranList = anggaranList;

    var semuaLangganan = [];
    if (deps.LanggananService) {
      try { semuaLangganan = deps.LanggananService.getLangganan(deps) || []; } catch (e) {}
    }
    deps.langgananList = semuaLangganan;

    // ── 1. Total saldo semua dompet ──────────────────────────────────────────
    var totalSaldo   = 0;
    var jumlahDompet = dompetList.length;
    for (var i = 0; i < dompetList.length; i++) {
      totalSaldo += Number(dompetList[i].saldoSaatIni || 0);
    }

    // ── 2. Pemasukan & pengeluaran bulan ini ─────────────────────────────────
    var today     = new Date();
    var year      = today.getFullYear();
    var month     = today.getMonth();

    var laporanBulan = LaporanService.getLaporanData(
      { periode: 'Bulanan' },
      deps
    );

    var totalPemasukan  = laporanBulan.totalPemasukan  || 0;
    var totalPengeluaran = laporanBulan.totalPengeluaran || 0;

    // ── 3. Total anggaran bulan ini ──────────────────────────────────────────
    var totalAnggaran = 0;
    for (var i = 0; i < anggaranList.length; i++) {
      totalAnggaran += Number(anggaranList[i].jumlahAnggaran || anggaranList[i].JumlahAnggaran || 0);
    }

    // ── 4. Transaksi terbaru (maks 6) ────────────────────────────────────────
    var transaksiTerbaru = [];
    try {
      var allTrx = laporanBulan.transaksi || [];
      // Urutkan descending by tanggal
      allTrx.sort(function(a, b) {
        return new Date(b.Tanggal) - new Date(a.Tanggal);
      });

      var mapKategori = {};
      for (var i = 0; i < kategoriList.length; i++) {
        var k = kategoriList[i];
        mapKategori[k.id || k.ID] = k.nama || k.Nama;
      }
      var mapDompet = {};
      for (var i = 0; i < dompetList.length; i++) {
        var d = dompetList[i];
        mapDompet[d.id || d.ID] = d.nama || d.Nama;
      }

      var limit = allTrx.length < 6 ? allTrx.length : 6;
      for (var i = 0; i < limit; i++) {
        var t = allTrx[i];
        transaksiTerbaru.push({
          id:          t.ID,
          tanggal:     t.Tanggal,
          jenis:       t.Jenis,
          jumlah:      Number(t.Jumlah || 0),
          kategoriId:  t.KategoriID || '',
          kategori:    mapKategori[t.KategoriID] || '',
          dompetAsalId: t.DompetAsalID || '',
          dompet:      mapDompet[t.DompetAsalID] || '',
          catatan:     t.Catatan || ''
        });
      }
    } catch (e) {
      if (typeof Logger !== 'undefined') Logger.log('getDashboardData (Transaksi): ' + e);
    }

    // ── 5. Langganan jatuh tempo 7 hari ke depan ─────────────────────────────
    var langgananJatuhTempo = [];
    try {
      var batasAkhir = new Date(today);
      batasAkhir.setDate(today.getDate() + 7);
      batasAkhir.setHours(23, 59, 59, 999);

      var hariIni = new Date(today);
      hariIni.setHours(0, 0, 0, 0);

      for (var i = 0; i < semuaLangganan.length; i++) {
        var l   = semuaLangganan[i];
        var due = new Date(l.tanggalJatuhTempo);
        if (due >= hariIni && due <= batasAkhir) {
          langgananJatuhTempo.push(l);
        }
      }

      // Urutkan ascending by tanggal jatuh tempo
      langgananJatuhTempo.sort(function(a, b) {
        return new Date(a.tanggalJatuhTempo) - new Date(b.tanggalJatuhTempo);
      });
    } catch (e) {
      if (typeof Logger !== 'undefined') Logger.log('getDashboardData (Langganan): ' + e);
    }

    // ── 6. Pie chart pengeluaran per kategori (bulan ini) ────────────────────
    var pieChart = laporanBulan.perKategori || [];

    // ── 7. Grafik pengeluaran mingguan (7 hari terakhir) ─────────────────────
    var weeklySpending = [];
    try {
      var laporanMingguan = LaporanService.getLaporanData(
        { periode: 'Mingguan' },
        deps
      );
      weeklySpending = laporanMingguan.perPeriode || [];
    } catch (e) {
      if (typeof Logger !== 'undefined') Logger.log('getDashboardData (Weekly): ' + e);
    }

    var result = {
      totalSaldo:          totalSaldo,
      jumlahDompet:        jumlahDompet,
      totalPemasukan:      totalPemasukan,
      totalPengeluaran:    totalPengeluaran,
      totalAnggaran:       totalAnggaran,
      transaksiTerbaru:    transaksiTerbaru,
      langgananJatuhTempo: langgananJatuhTempo,
      pieChart:            pieChart,
      weeklySpending:      weeklySpending
    };

    // ── 8. Cache result ──────────────────────────────────────────────────────
    try {
      cache.put(cacheKey, JSON.stringify(result), 600); // 10 minutes
    } catch (e) {
      if (typeof Logger !== 'undefined') Logger.log('Cache write error: ' + e);
    }

    return result;
  }
};
