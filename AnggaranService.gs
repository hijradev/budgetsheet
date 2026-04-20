/**
 * AnggaranService.gs — Layanan manajemen anggaran untuk BudgetSheet
 * Mendukung dependency injection untuk testability tanpa GAS runtime.
 *
 * deps:
 *   - deps.getSheet(sheetName)        — mengembalikan sheet (mock atau nyata)
 *   - deps.SpreadsheetHelper          — modul SpreadsheetHelper
 *   - deps.Validator                  — modul Validator
 *   - deps.KategoriService            — modul KategoriService
 *   - deps.ANGGARAN_HEADERS           — array header kolom Anggaran
 *   - deps.TRANSAKSI_KATEGORI_IDX     — indeks kolom KategoriID di sheet Transaksi
 */

// Indeks kolom di sheet Transaksi (0-based)
var TRANSAKSI_JENIS_IDX   = 2;
var TRANSAKSI_JUMLAH_IDX  = 3;
var TRANSAKSI_TANGGAL_IDX = 1;

var AnggaranService = {

  /**
   * Hitung total realisasi pengeluaran untuk kategori tertentu pada bulan/tahun tertentu.
   * Fungsi murni — tidak mengakses sheet secara langsung.
   *
   * @param {string} kategoriId
   * @param {number} bulan - 1-based (1=Januari, 12=Desember)
   * @param {number} tahun - 4 digit
   * @param {Array<Array>} rows - hasil batchRead (termasuk header di indeks 0)
   * @param {number} idx - indeks kolom KategoriID di sheet Transaksi
   * @returns {number} total pengeluaran
   */
  hitungRealisasi: function(kategoriId, bulan, tahun, rows, idx) {
    var total = 0;
    if (!rows || !Array.isArray(rows) || rows.length <= 1) return 0;

    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      if (!row) continue;

      var jenis        = row[TRANSAKSI_JENIS_IDX];
      var rowKategoriId = row[idx];

      if (jenis !== 'Pengeluaran' || rowKategoriId !== kategoriId) continue;

      var tanggal = new Date(row[TRANSAKSI_TANGGAL_IDX]);
      if (!tanggal || isNaN(tanggal.getTime())) continue;

      var rowBulan = tanggal.getMonth() + 1; // getMonth() adalah 0-based
      var rowTahun = tanggal.getFullYear();

      if (rowBulan === bulan && rowTahun === tahun) {
        total += Number(row[TRANSAKSI_JUMLAH_IDX]) || 0;
      }
    }
    return total;
  },

  /**
   * Tentukan status anggaran berdasarkan rasio aktual/anggaran.
   * Fungsi murni.
   *
   * @param {number} actual - pengeluaran aktual
   * @param {number} budget - jumlah anggaran
   * @returns {'normal'|'peringatan'|'kritis'}
   */
  hitungStatusAnggaran: function(actual, budget) {
    if (budget === 0) return 'kritis';
    var rasio = actual / budget;
    if (rasio >= 1.0) return 'kritis';
    if (rasio >= 0.8) return 'peringatan';
    return 'normal';
  },

  /**
   * Ambil semua anggaran beserta realisasi aktual.
   *
   * @param {object} deps
   * @returns {Array<object>} array anggaran dengan field realisasi dan status
   */
  getAnggaran: function(deps) {
    var getSheet               = deps.getSheet;
    var SpreadsheetHelper      = deps.SpreadsheetHelper;
    var ANGGARAN_HEADERS       = deps.ANGGARAN_HEADERS;
    var TRANSAKSI_KATEGORI_IDX = deps.TRANSAKSI_KATEGORI_IDX;
    var KategoriService        = deps.KategoriService;

    var anggaranRows  = [];
    var transaksiRows = [];

    try {
      if (deps.anggaranRows) {
        anggaranRows = deps.anggaranRows;
      } else {
        var anggaranSheet = getSheet('Anggaran');
        if (anggaranSheet) {
          anggaranRows = SpreadsheetHelper.batchRead(anggaranSheet) || [];
        }
      }
    } catch (e) {
      if (typeof Logger !== 'undefined') Logger.log('Warning getAnggaran (Anggaran Sheet): ' + e);
    }

    try {
      if (deps.transaksiRows) {
        transaksiRows = deps.transaksiRows;
      } else {
        var transaksiSheet = getSheet('Transaksi');
        if (transaksiSheet) {
          transaksiRows = SpreadsheetHelper.batchRead(transaksiSheet) || [];
        }
      }
    } catch (e) {
      if (typeof Logger !== 'undefined') Logger.log('Warning getAnggaran (Transaksi Sheet): ' + e);
    }

    var kategoriList = KategoriService ? (KategoriService.getKategori(deps) || []) : [];
    var mapKategori  = {};
    for (var ki = 0; ki < kategoriList.length; ki++) {
      var k  = kategoriList[ki];
      var id = k.id || k.ID;
      if (id) mapKategori[id] = k.nama || k.Nama;
    }

    if (anggaranRows.length <= 1) return [];

    var result = [];
    for (var i = 1; i < anggaranRows.length; i++) {
      var row = anggaranRows[i];
      if (!row) continue;

      var a = SpreadsheetHelper.rowToObject(ANGGARAN_HEADERS, row);
      if (!a || !a.ID) continue;

      var realisasi = AnggaranService.hitungRealisasi(
        a.KategoriID, a.Bulan, a.Tahun, transaksiRows, TRANSAKSI_KATEGORI_IDX
      );
      var status = AnggaranService.hitungStatusAnggaran(realisasi, Number(a.JumlahAnggaran || 0));

      result.push({
        id:             a.ID,
        kategoriId:     a.KategoriID     || '',
        kategoriNama:   mapKategori[a.KategoriID] || '',
        jumlahAnggaran: Number(a.JumlahAnggaran || 0),
        periode:        a.Periode        || 'Bulanan',
        bulan:          a.Bulan,
        tahun:          a.Tahun,
        realisasi:      realisasi,
        status:         status,
      });
    }
    return result;
  },

  /**
   * Buat anggaran baru atau update anggaran yang sudah ada.
   * - Jika data.id ada: update
   * - Jika data.id kosong: buat baru dengan ID yang di-generate
   *
   * @param {object} data
   * @param {object} deps
   * @returns {object} objek anggaran yang disimpan
   */
  saveAnggaran: function(data, deps) {
    var getSheet          = deps.getSheet;
    var SpreadsheetHelper = deps.SpreadsheetHelper;
    var Validator         = deps.Validator;
    var ANGGARAN_HEADERS  = deps.ANGGARAN_HEADERS;

    Validator.validateAnggaran(data);

    var sheet = getSheet('Anggaran');

    if (data.id) {
      // UPDATE
      var found = SpreadsheetHelper.findRowById(sheet, data.id);
      if (!found) throw new Error('Anggaran tidak ditemukan');

      var existing = SpreadsheetHelper.rowToObject(ANGGARAN_HEADERS, found.rowData);
      existing.KategoriID     = data.kategoriId;
      existing.JumlahAnggaran = Number(data.jumlahAnggaran);
      existing.Periode        = data.periode;
      existing.Bulan          = data.bulan !== undefined ? data.bulan : existing.Bulan;
      existing.Tahun          = data.tahun !== undefined ? data.tahun : existing.Tahun;

      var updatedRow = SpreadsheetHelper.objectToRow(ANGGARAN_HEADERS, existing);
      SpreadsheetHelper.updateRow(sheet, found.rowIndex, updatedRow);
      return existing;
    } else {
      // CREATE
      var id = 'anggaran-' + Date.now() + '-' + Math.floor(Math.random() * 10000);

      var anggaran = {
        ID:             id,
        KategoriID:     data.kategoriId,
        JumlahAnggaran: Number(data.jumlahAnggaran),
        Periode:        data.periode,
        Bulan:          data.bulan !== undefined ? data.bulan : null,
        Tahun:          data.tahun !== undefined ? data.tahun : null,
      };

      var row = SpreadsheetHelper.objectToRow(ANGGARAN_HEADERS, anggaran);
      SpreadsheetHelper.appendRow(sheet, row);
      return anggaran;
    }
  },

  /**
   * Hapus anggaran berdasarkan ID.
   *
   * @param {string} id
   * @param {object} deps
   * @returns {boolean} true jika berhasil
   */
  deleteAnggaran: function(id, deps) {
    var getSheet          = deps.getSheet;
    var SpreadsheetHelper = deps.SpreadsheetHelper;

    var sheet = getSheet('Anggaran');
    var found = SpreadsheetHelper.findRowById(sheet, id);
    if (!found) throw new Error('Anggaran tidak ditemukan');

    SpreadsheetHelper.deleteRow(sheet, found.rowIndex);
    return true;
  },
};
