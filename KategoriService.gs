/**
 * KategoriService.gs — Layanan manajemen kategori untuk BudgetSheet
 * Mendukung dependency injection untuk testability tanpa GAS runtime.
 *
 * deps:
 *   - deps.getSheet(sheetName)        — mengembalikan sheet (mock atau nyata)
 *   - deps.SpreadsheetHelper          — modul SpreadsheetHelper
 *   - deps.Validator                  — modul Validator
 *   - deps.KATEGORI_HEADERS           — array header kolom Kategori
 *   - deps.TRANSAKSI_KATEGORI_IDX     — indeks kolom KategoriID di sheet Transaksi
 */

var KategoriService = {

  /**
   * Baca semua kategori dari sheet Kategori.
   *
   * @param {object} deps
   * @returns {Array<object>} array objek kategori
   */
  getKategori: function(deps) {
    var getSheet          = deps.getSheet;
    var SpreadsheetHelper = deps.SpreadsheetHelper;
    var KATEGORI_HEADERS  = deps.KATEGORI_HEADERS;

    var sheet = getSheet('Kategori');
    var rows  = SpreadsheetHelper.batchRead(sheet);

    // Lewati baris header (indeks 0)
    var result = [];
    for (var i = 1; i < rows.length; i++) {
      var k = SpreadsheetHelper.rowToObject(KATEGORI_HEADERS, rows[i]);
      result.push({
        id:    k.ID,
        nama:  k.Nama,
        jenis: k.Jenis,
        ikon:  k.Ikon  || '',
        warna: k.Warna || '',
      });
    }
    return result;
  },

  /**
   * Buat kategori baru atau update kategori yang sudah ada.
   * - Jika data.id ada: update semua field (Nama, Jenis, Ikon, Warna)
   * - Jika data.id kosong: buat baru dengan ID yang di-generate
   *
   * @param {object} data
   * @param {object} deps
   * @returns {object} objek kategori yang disimpan
   */
  saveKategori: function(data, deps) {
    var getSheet          = deps.getSheet;
    var SpreadsheetHelper = deps.SpreadsheetHelper;
    var Validator         = deps.Validator;
    var KATEGORI_HEADERS  = deps.KATEGORI_HEADERS;

    var VALID_JENIS_KATEGORI = ['Pemasukan', 'Pengeluaran', 'Keduanya'];

    // Validasi nama
    if (!data.nama || typeof data.nama !== 'string' || data.nama.trim() === '') {
      throw new Error('Nama kategori harus diisi');
    }

    // Validasi Jenis secara manual (mendukung 'Keduanya' selain Pemasukan/Pengeluaran)
    if (VALID_JENIS_KATEGORI.indexOf(data.jenis) === -1) {
      throw new Error(
        'Jenis kategori tidak valid. Harus salah satu dari: ' + VALID_JENIS_KATEGORI.join(', ')
      );
    }

    var sheet = getSheet('Kategori');

    if (data.id) {
      // UPDATE — ubah semua field
      var found = SpreadsheetHelper.findRowById(sheet, data.id);
      if (!found) throw new Error('Kategori tidak ditemukan');

      var existing = SpreadsheetHelper.rowToObject(KATEGORI_HEADERS, found.rowData);
      existing.Nama  = Validator.sanitizeString(data.nama);
      existing.Jenis = data.jenis;
      existing.Ikon  = data.ikon  !== undefined ? data.ikon  : existing.Ikon;
      existing.Warna = data.warna !== undefined ? data.warna : existing.Warna;

      var updatedRow = SpreadsheetHelper.objectToRow(KATEGORI_HEADERS, existing);
      SpreadsheetHelper.updateRow(sheet, found.rowIndex, updatedRow);
      return existing;
    } else {
      // CREATE — buat ID baru
      var id = 'kategori-' + Date.now() + '-' + Math.floor(Math.random() * 10000);

      var kategori = {
        ID:    id,
        Nama:  Validator.sanitizeString(data.nama),
        Jenis: data.jenis,
        Ikon:  data.ikon  || '',
        Warna: data.warna || '',
      };

      var row = SpreadsheetHelper.objectToRow(KATEGORI_HEADERS, kategori);
      SpreadsheetHelper.appendRow(sheet, row);
      return kategori;
    }
  },

  /**
   * Hapus kategori berdasarkan ID.
   * Tolak jika kategori masih direferensikan oleh transaksi.
   *
   * @param {string} id
   * @param {object} deps
   * @returns {boolean} true jika berhasil
   */
  deleteKategori: function(id, deps) {
    var getSheet               = deps.getSheet;
    var SpreadsheetHelper      = deps.SpreadsheetHelper;
    var TRANSAKSI_KATEGORI_IDX = deps.TRANSAKSI_KATEGORI_IDX;

    // Cek referensi di sheet Transaksi (kolom KategoriID)
    var transaksiSheet = getSheet('Transaksi');
    var transaksiRows  = SpreadsheetHelper.batchRead(transaksiSheet);

    for (var i = 1; i < transaksiRows.length; i++) {
      if (transaksiRows[i][TRANSAKSI_KATEGORI_IDX] === id) {
        throw new Error('Kategori masih digunakan oleh transaksi dan tidak dapat dihapus');
      }
    }

    // Hapus baris kategori
    var kategoriSheet = getSheet('Kategori');
    var found         = SpreadsheetHelper.findRowById(kategoriSheet, id);
    if (!found) throw new Error('Kategori tidak ditemukan');

    SpreadsheetHelper.deleteRow(kategoriSheet, found.rowIndex);
    return true;
  },
};
