/**
 * DompetService.gs — Layanan manajemen dompet untuk BudgetSheet
 * Mendukung dependency injection untuk testability tanpa GAS runtime.
 *
 * deps:
 *   - deps.getSheet(sheetName)   — mengembalikan sheet (mock atau nyata)
 *   - deps.SpreadsheetHelper     — modul SpreadsheetHelper
 *   - deps.Validator             — modul Validator
 *   - deps.DOMPET_HEADERS        — array header kolom Dompet
 */

var DompetService = {

  /**
   * Baca semua dompet dari sheet Dompet.
   *
   * @param {object} deps
   * @returns {Array<object>} array objek dompet
   */
  getDompet: function(deps) {
    var getSheet          = deps.getSheet;
    var SpreadsheetHelper = deps.SpreadsheetHelper;
    var DOMPET_HEADERS    = deps.DOMPET_HEADERS;

    var sheet = getSheet('Dompet');
    var rows  = SpreadsheetHelper.batchRead(sheet);

    // Lewati baris header (indeks 0)
    var result = [];
    for (var i = 1; i < rows.length; i++) {
      var d = SpreadsheetHelper.rowToObject(DOMPET_HEADERS, rows[i]);
      result.push({
        id:           d.ID,
        nama:         d.Nama,
        saldoAwal:    Number(d.SaldoAwal),
        saldoSaatIni: Number(d.SaldoSaatIni),
        ikon:         d.Ikon  || '',
        warna:        d.Warna || '',
        tanggalDibuat: d.TanggalDibuat,
      });
    }
    return result;
  },

  /**
   * Buat dompet baru atau update dompet yang sudah ada.
   * - Jika data.id ada: update hanya Nama, Ikon, Warna (saldo tidak diubah)
   * - Jika data.id kosong: buat baru, set SaldoSaatIni = SaldoAwal
   *
   * @param {object} data
   * @param {object} deps
   * @returns {object} objek dompet yang disimpan
   */
  saveDompet: function(data, deps) {
    var getSheet          = deps.getSheet;
    var SpreadsheetHelper = deps.SpreadsheetHelper;
    var Validator         = deps.Validator;
    var DOMPET_HEADERS    = deps.DOMPET_HEADERS;

    Validator.validateDompet(data);

    var sheet = getSheet('Dompet');

    if (data.id) {
      // UPDATE — hanya ubah Nama, Ikon, Warna; saldo dipertahankan
      var found = SpreadsheetHelper.findRowById(sheet, data.id);
      if (!found) throw new Error('Dompet tidak ditemukan');

      var existing = SpreadsheetHelper.rowToObject(DOMPET_HEADERS, found.rowData);
      existing.Nama  = Validator.sanitizeString(data.nama);
      existing.Ikon  = data.ikon  !== undefined ? data.ikon  : existing.Ikon;
      existing.Warna = data.warna !== undefined ? data.warna : existing.Warna;

      var updatedRow = SpreadsheetHelper.objectToRow(DOMPET_HEADERS, existing);
      SpreadsheetHelper.updateRow(sheet, found.rowIndex, updatedRow);
      return existing;
    } else {
      // CREATE — buat ID baru, set SaldoSaatIni = SaldoAwal
      var id            = 'dompet-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
      var tanggalDibuat = new Date().toISOString().split('T')[0];
      var saldoAwal     = Number(data.saldoAwal);

      var dompet = {
        ID:           id,
        Nama:         Validator.sanitizeString(data.nama),
        SaldoAwal:    saldoAwal,
        SaldoSaatIni: saldoAwal,
        Ikon:         data.ikon  || '',
        Warna:        data.warna || '',
        TanggalDibuat: tanggalDibuat,
      };

      var row = SpreadsheetHelper.objectToRow(DOMPET_HEADERS, dompet);
      SpreadsheetHelper.appendRow(sheet, row);
      return dompet;
    }
  },

  /**
   * Hapus dompet berdasarkan ID.
   * Tolak jika dompet masih direferensikan oleh transaksi.
   *
   * @param {string} id
   * @param {object} deps
   * @returns {boolean} true jika berhasil
   */
  deleteDompet: function(id, deps) {
    var getSheet          = deps.getSheet;
    var SpreadsheetHelper = deps.SpreadsheetHelper;

    // Cek referensi di sheet Transaksi (DompetAsalID = indeks 5, DompetTujuanID = indeks 6)
    var transaksiSheet = getSheet('Transaksi');
    var transaksiRows  = SpreadsheetHelper.batchRead(transaksiSheet);
    var DOMPET_ASAL_IDX   = 5;
    var DOMPET_TUJUAN_IDX = 6;

    for (var i = 1; i < transaksiRows.length; i++) {
      var row = transaksiRows[i];
      if (row[DOMPET_ASAL_IDX] === id || row[DOMPET_TUJUAN_IDX] === id) {
        throw new Error('Dompet masih memiliki transaksi terkait dan tidak dapat dihapus');
      }
    }

    // Hapus baris dompet
    var dompetSheet = getSheet('Dompet');
    var found       = SpreadsheetHelper.findRowById(dompetSheet, id);
    if (!found) throw new Error('Dompet tidak ditemukan');

    SpreadsheetHelper.deleteRow(dompetSheet, found.rowIndex);
    return true;
  },

  /**
   * Ubah saldo dompet dengan menambahkan delta ke SaldoSaatIni.
   * Delta bisa negatif untuk pengeluaran.
   *
   * @param {string} dompetId
   * @param {number} delta
   * @param {object} deps
   * @returns {object} objek dompet yang sudah diperbarui
   */
  updateSaldoDompet: function(dompetId, delta, deps) {
    var getSheet          = deps.getSheet;
    var SpreadsheetHelper = deps.SpreadsheetHelper;
    var DOMPET_HEADERS    = deps.DOMPET_HEADERS;

    var sheet = getSheet('Dompet');
    var found = SpreadsheetHelper.findRowById(sheet, dompetId);
    if (!found) throw new Error('Dompet tidak ditemukan');

    var dompet = SpreadsheetHelper.rowToObject(DOMPET_HEADERS, found.rowData);
    dompet.SaldoSaatIni = Number(dompet.SaldoSaatIni) + delta;

    var updatedRow = SpreadsheetHelper.objectToRow(DOMPET_HEADERS, dompet);
    SpreadsheetHelper.updateRow(sheet, found.rowIndex, updatedRow);
    return dompet;
  }

};
