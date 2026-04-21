/**
 * DompetActivityService.gs — Layanan untuk mencatat aktivitas dompet
 * Mendukung dependency injection untuk testability.
 *
 * deps:
 *   - deps.getSheet(sheetName)
 *   - deps.SpreadsheetHelper
 *   - deps.DOMPET_ACTIVITY_HEADERS
 */

var DompetActivityService = {

  /**
   * Catat aktivitas dompet baru.
   *
   * @param {object} data
   * @param {string} data.aktivitas - Jenis aktivitas: 'Tambah Dompet', 'Edit Dompet', 'Hapus Dompet', 'Transfer Masuk', 'Transfer Keluar'
   * @param {string} data.dompetId - ID dompet yang terkait
   * @param {string} data.dompetNama - Nama dompet
   * @param {number} [data.perubahanSaldo] - Perubahan saldo (opsional)
   * @param {number} [data.saldoSebelum] - Saldo sebelum aktivitas (opsional)
   * @param {number} [data.saldoSesudah] - Saldo sesudah aktivitas (opsional)
   * @param {string} [data.dompetTerkaitId] - ID dompet terkait untuk transfer (opsional)
   * @param {string} [data.dompetTerkaitNama] - Nama dompet terkait untuk transfer (opsional)
   * @param {string} [data.keterangan] - Keterangan tambahan (opsional)
   * @param {object} deps
   * @returns {object} objek aktivitas yang disimpan
   */
  logActivity: function(data, deps) {
    var getSheet          = deps.getSheet;
    var SpreadsheetHelper = deps.SpreadsheetHelper;
    var DOMPET_ACTIVITY_HEADERS = deps.DOMPET_ACTIVITY_HEADERS;

    var sheet = getSheet('DompetActivity');
    
    var id = 'activity-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    var timestamp = new Date().toISOString();

    var activity = {
      ID: id,
      Timestamp: timestamp,
      Aktivitas: data.aktivitas,
      DompetID: data.dompetId,
      DompetNama: data.dompetNama,
      PerubahanSaldo: data.perubahanSaldo !== undefined ? Number(data.perubahanSaldo) : 0,
      SaldoSebelum: data.saldoSebelum !== undefined ? Number(data.saldoSebelum) : 0,
      SaldoSesudah: data.saldoSesudah !== undefined ? Number(data.saldoSesudah) : 0,
      DompetTerkaitID: data.dompetTerkaitId || '',
      DompetTerkaitNama: data.dompetTerkaitNama || '',
      Keterangan: data.keterangan || '',
    };

    var row = SpreadsheetHelper.objectToRow(DOMPET_ACTIVITY_HEADERS, activity);
    SpreadsheetHelper.appendRow(sheet, row);
    return activity;
  },

  /**
   * Ambil aktivitas dompet dengan filter opsional.
   *
   * @param {object} [filter]
   * @param {string} [filter.dompetId] - Filter berdasarkan ID dompet
   * @param {number} [filter.limit] - Batasi jumlah hasil (default: 50)
   * @param {object} deps
   * @returns {Array<object>} array objek aktivitas
   */
  getActivities: function(filter, deps) {
    var getSheet          = deps.getSheet;
    var SpreadsheetHelper = deps.SpreadsheetHelper;
    var DOMPET_ACTIVITY_HEADERS = deps.DOMPET_ACTIVITY_HEADERS;

    filter = filter || {};
    var limit = filter.limit || 50;

    var sheet = getSheet('DompetActivity');
    var rows  = SpreadsheetHelper.batchRead(sheet);

    var result = [];
    // Lewati header (indeks 0), baca dari bawah ke atas untuk mendapat yang terbaru
    for (var i = rows.length - 1; i >= 1; i--) {
      var activity = SpreadsheetHelper.rowToObject(DOMPET_ACTIVITY_HEADERS, rows[i]);
      
      // Filter berdasarkan dompetId jika ada
      if (filter.dompetId && activity.DompetID !== filter.dompetId) {
        continue;
      }

      result.push({
        id: activity.ID,
        timestamp: activity.Timestamp,
        aktivitas: activity.Aktivitas,
        dompetId: activity.DompetID,
        dompetNama: activity.DompetNama,
        perubahanSaldo: Number(activity.PerubahanSaldo),
        saldoSebelum: Number(activity.SaldoSebelum),
        saldoSesudah: Number(activity.SaldoSesudah),
        dompetTerkaitId: activity.DompetTerkaitID,
        dompetTerkaitNama: activity.DompetTerkaitNama,
        keterangan: activity.Keterangan,
      });

      // Batasi hasil
      if (result.length >= limit) break;
    }

    return result;
  }

};
