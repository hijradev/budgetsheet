/**
 * LanggananService.gs — Layanan manajemen langganan (transaksi berulang)
 * GAS global scope — no require/module.exports
 *
 * deps:
 *   - deps.getSheet(sheetName)   — mengembalikan sheet (mock atau nyata)
 *   - deps.SpreadsheetHelper     — modul SpreadsheetHelper
 *   - deps.Validator             — modul Validator
 *   - deps.TransaksiService      — modul TransaksiService (untuk saveTransaksi saat bayar)
 *   - deps.KategoriService       — modul KategoriService (opsional)
 *   - deps.DompetService         — modul DompetService (opsional)
 *   - deps.LANGGANAN_HEADERS     — array header kolom Langganan
 */

var LanggananService = {

  /**
   * Hitung tanggal jatuh tempo berikutnya berdasarkan frekuensi.
   * Fungsi murni.
   *
   * @param {Date|string} tanggal - tanggal saat ini
   * @param {string} frekuensi - 'Harian' | 'Mingguan' | 'Bulanan' | 'Tahunan'
   * @returns {Date} tanggal jatuh tempo berikutnya
   */
  hitungDueDateBerikutnya: function(tanggal, frekuensi) {
    var d = new Date(tanggal);

    switch (frekuensi) {
      case 'Harian':
        d.setDate(d.getDate() + 1);
        break;
      case 'Mingguan':
        d.setDate(d.getDate() + 7);
        break;
      case 'Bulanan':
        d.setMonth(d.getMonth() + 1);
        break;
      case 'Tahunan':
        d.setFullYear(d.getFullYear() + 1);
        break;
      default:
        throw new Error('Frekuensi tidak valid: ' + frekuensi);
    }

    return d;
  },

  /**
   * Hitung apakah langganan perlu peringatan berdasarkan tanggal jatuh tempo.
   * Fungsi murni.
   *
   * @param {Date|string} dueDate
   * @param {Date|string} today
   * @returns {boolean} true jika jatuh tempo <= 3 hari dari hari ini (termasuk lewat jatuh tempo)
   */
  hitungStatusLangganan: function(dueDate, today) {
    var jatuhTempo = new Date(dueDate);
    var hariIni = new Date(today);

    // Normalisasi ke awal hari untuk perbandingan hari
    jatuhTempo.setHours(0, 0, 0, 0);
    hariIni.setHours(0, 0, 0, 0);

    var selisihMs = jatuhTempo.getTime() - hariIni.getTime();
    var selisihHari = selisihMs / (1000 * 60 * 60 * 24);

    return selisihHari <= 3;
  },

  /**
   * Ambil semua langganan beserta indikator statusPeringatan.
   *
   * @param {object} deps
   * @returns {Array<object>} array langganan dengan field statusPeringatan
   */
  getLangganan: function(deps) {
    var getSheet = deps.getSheet;
    var SpreadsheetHelper = deps.SpreadsheetHelper;
    var LANGGANAN_HEADERS = deps.LANGGANAN_HEADERS;
    var KategoriService = deps.KategoriService;
    var DompetService = deps.DompetService;

    var sheet = getSheet('Langganan');
    var rows = SpreadsheetHelper.batchRead(sheet);
    var hariIni = new Date();

    var kategoriList = KategoriService ? KategoriService.getKategori(deps) : [];
    var dompetList = DompetService ? DompetService.getDompet(deps) : [];

    var mapKategori = {};
    kategoriList.forEach(function(k) { mapKategori[k.id || k.ID] = k.nama || k.Nama; });

    var mapDompet = {};
    dompetList.forEach(function(d) { mapDompet[d.id || d.ID] = d.nama || d.Nama; });

    return rows.slice(1).map(function(row) {
      var l = SpreadsheetHelper.rowToObject(LANGGANAN_HEADERS, row);
      var statusPeringatan = LanggananService.hitungStatusLangganan(l.TanggalJatuhTempo, hariIni);
      return {
        id: l.ID,
        nama: l.Nama,
        jumlah: Number(l.Jumlah),
        kategoriId: l.KategoriID || '',
        kategoriNama: mapKategori[l.KategoriID] || '',
        dompetId: l.DompetID || '',
        dompetNama: mapDompet[l.DompetID] || '',
        frekuensi: l.Frekuensi,
        tanggalJatuhTempo: l.TanggalJatuhTempo,
        catatan: l.Catatan || '',
        status: l.Status,
        statusPeringatan: statusPeringatan
      };
    });
  },

  /**
   * Buat langganan baru atau update langganan yang sudah ada.
   * TIDAK membuat transaksi otomatis.
   *
   * @param {object} data
   * @param {object} deps
   * @returns {object} objek langganan yang disimpan
   */
  saveLangganan: function(data, deps) {
    var getSheet = deps.getSheet;
    var SpreadsheetHelper = deps.SpreadsheetHelper;
    var Validator = deps.Validator;
    var LANGGANAN_HEADERS = deps.LANGGANAN_HEADERS;

    Validator.validateLangganan(data);

    var sheet = getSheet('Langganan');

    if (data.id) {
      // UPDATE
      var found = SpreadsheetHelper.findRowById(sheet, data.id);
      if (!found) throw new Error('Langganan tidak ditemukan');

      var existing = SpreadsheetHelper.rowToObject(LANGGANAN_HEADERS, found.rowData);

      existing.Nama = Validator.sanitizeString(data.nama);
      existing.Jumlah = Number(data.jumlah);
      existing.KategoriID = data.kategoriId !== undefined ? data.kategoriId : existing.KategoriID;
      existing.DompetID = data.dompetId !== undefined ? data.dompetId : existing.DompetID;
      existing.Frekuensi = data.frekuensi;
      existing.TanggalJatuhTempo = data.tanggalJatuhTempo !== undefined ? data.tanggalJatuhTempo : existing.TanggalJatuhTempo;
      existing.Catatan = Validator.sanitizeString(data.catatan || '');
      existing.Status = data.status !== undefined ? data.status : existing.Status;

      var updatedRow = SpreadsheetHelper.objectToRow(LANGGANAN_HEADERS, existing);
      SpreadsheetHelper.updateRow(sheet, found.rowIndex, updatedRow);
      return existing;
    } else {
      // CREATE
      var id = 'langganan-' + Date.now() + '-' + Math.floor(Math.random() * 10000);

      var langganan = {
        ID: id,
        Nama: Validator.sanitizeString(data.nama),
        Jumlah: Number(data.jumlah),
        KategoriID: data.kategoriId || '',
        DompetID: data.dompetId || '',
        Frekuensi: data.frekuensi,
        TanggalJatuhTempo: data.tanggalJatuhTempo || null,
        Catatan: Validator.sanitizeString(data.catatan || ''),
        Status: 'Aktif'
      };

      var row = SpreadsheetHelper.objectToRow(LANGGANAN_HEADERS, langganan);
      SpreadsheetHelper.appendRow(sheet, row);
      return langganan;
    }
  },

  /**
   * Tandai langganan sebagai dibayar:
   * 1. Buat transaksi Pengeluaran baru via TransaksiService.saveTransaksi
   * 2. Update TanggalJatuhTempo sesuai frekuensi
   *
   * @param {string} id - ID langganan
   * @param {object} deps
   * @returns {{ transaksi: object, langganan: object }}
   */
  bayarLangganan: function(id, deps) {
    var getSheet = deps.getSheet;
    var SpreadsheetHelper = deps.SpreadsheetHelper;
    var TransaksiService = deps.TransaksiService;
    var LANGGANAN_HEADERS = deps.LANGGANAN_HEADERS;

    var sheet = getSheet('Langganan');
    var found = SpreadsheetHelper.findRowById(sheet, id);
    if (!found) throw new Error('Langganan tidak ditemukan');

    var langganan = SpreadsheetHelper.rowToObject(LANGGANAN_HEADERS, found.rowData);

    // Buat transaksi pengeluaran
    var today = new Date();
    var tanggalStr = today.toISOString().split('T')[0];

    var transaksiData = {
      tanggal: tanggalStr,
      jenis: 'Pengeluaran',
      jumlah: langganan.Jumlah,
      kategoriId: langganan.KategoriID,
      dompetAsalId: langganan.DompetID,
      catatan: 'Pembayaran: ' + langganan.Nama
    };

    var hasilTransaksi = TransaksiService.saveTransaksi(transaksiData, deps);

    // Update TanggalJatuhTempo berikutnya
    var dueDateBaru = LanggananService.hitungDueDateBerikutnya(langganan.TanggalJatuhTempo, langganan.Frekuensi);
    langganan.TanggalJatuhTempo = dueDateBaru.toISOString().split('T')[0];

    var updatedRow = SpreadsheetHelper.objectToRow(LANGGANAN_HEADERS, langganan);
    SpreadsheetHelper.updateRow(sheet, found.rowIndex, updatedRow);

    return { transaksi: hasilTransaksi.data, langganan: langganan };
  },

  /**
   * Hapus langganan berdasarkan ID.
   *
   * @param {string} id
   * @param {object} deps
   * @returns {boolean} true jika berhasil
   */
  deleteLangganan: function(id, deps) {
    var getSheet = deps.getSheet;
    var SpreadsheetHelper = deps.SpreadsheetHelper;

    var sheet = getSheet('Langganan');
    var found = SpreadsheetHelper.findRowById(sheet, id);
    if (!found) throw new Error('Langganan tidak ditemukan');

    SpreadsheetHelper.deleteRow(sheet, found.rowIndex);
    return true;
  }

};
