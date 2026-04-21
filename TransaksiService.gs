/**
 * TransaksiService.gs — Logika bisnis manajemen transaksi untuk BudgetSheet
 * Mendukung dependency injection untuk testability tanpa GAS runtime.
 *
 * deps:
 *   - deps.getSheet(sheetName)   — mengembalikan sheet (mock atau nyata)
 *   - deps.SpreadsheetHelper     — modul SpreadsheetHelper
 *   - deps.Validator             — modul Validator
 *   - deps.DompetService         — modul DompetService (untuk updateSaldoDompet)
 *   - deps.TRANSAKSI_HEADERS     — array header kolom Transaksi
 *   - deps.DriveApp              — opsional, untuk upload gambar ke Drive
 */

var TransaksiService = {

  /**
   * Hitung perubahan saldo per dompet berdasarkan jenis transaksi.
   * Fungsi murni — tidak ada efek samping.
   *
   * @param {string} jenis - 'Pemasukan' | 'Pengeluaran' | 'Transfer'
   * @param {number} jumlah - jumlah positif
   * @param {string} dompetAsalId
   * @param {string} [dompetTujuanId] - hanya untuk Transfer
   * @returns {Array<{id: string, delta: number}>}
   */
  hitungDeltaSaldo: function(jenis, jumlah, dompetAsalId, dompetTujuanId) {
    if (jenis === 'Pemasukan') {
      return [{ id: dompetAsalId, delta: +jumlah }];
    } else if (jenis === 'Pengeluaran') {
      return [{ id: dompetAsalId, delta: -jumlah }];
    } else if (jenis === 'Transfer') {
      return [
        { id: dompetAsalId, delta: -jumlah },
        { id: dompetTujuanId, delta: +jumlah }
      ];
    }
    return [];
  },

  /**
   * Baca transaksi dengan filter dan pagination.
   *
   * @param {object} filter - { tanggalMulai, tanggalAkhir, kategoriId, dompetId, jenis, q }
   * @param {number} offset - default 0
   * @param {number} limit  - default 15
   * @param {object} deps
   * @returns {{ items: Array, total: number, offset: number, limit: number }}
   */
  getTransaksi: function(filter, offset, limit, deps) {
    filter = filter || {};
    offset = offset || 0;
    limit  = (limit === undefined || limit === null) ? 15 : limit;

    var getSheet         = deps.getSheet;
    var SpreadsheetHelper = deps.SpreadsheetHelper;

    var rows;
    if (deps.transaksiRows && deps.transaksiRows.length > 0) {
      rows = deps.transaksiRows;
    } else {
      var sheet = getSheet('Transaksi');
      rows = SpreadsheetHelper.batchRead(sheet);
    }

    var TRANSAKSI_HEADERS = deps.TRANSAKSI_HEADERS;
    // Lewati header (baris pertama)
    var items = [];
    for (var i = 1; i < rows.length; i++) {
      items.push(SpreadsheetHelper.rowToObject(TRANSAKSI_HEADERS, rows[i]));
    }

    // Normalisasi filter: camelCase dari frontend & snake_case dari internal
    var _mulaiStr = filter.tanggalMulai || filter.tanggal_mulai || '';
    var _akhirStr = filter.tanggalAkhir || filter.tanggal_akhir || '';

    // Filter tanggal mulai
    if (_mulaiStr) {
      var mulai = new Date(_mulaiStr);
      mulai.setHours(0, 0, 0, 0);
      var filtered = [];
      for (var i = 0; i < items.length; i++) {
        if (new Date(items[i].Tanggal) >= mulai) filtered.push(items[i]);
      }
      items = filtered;
    }

    // Filter tanggal akhir
    if (_akhirStr) {
      var akhir = new Date(_akhirStr);
      akhir.setHours(23, 59, 59, 999);
      var filtered = [];
      for (var i = 0; i < items.length; i++) {
        if (new Date(items[i].Tanggal) <= akhir) filtered.push(items[i]);
      }
      items = filtered;
    }

    // Filter kategori
    if (filter.kategoriId) {
      var filtered = [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].KategoriID === filter.kategoriId) filtered.push(items[i]);
      }
      items = filtered;
    }

    // Filter dompet (asal atau tujuan)
    if (filter.dompetId) {
      var filtered = [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].DompetAsalID === filter.dompetId || items[i].DompetTujuanID === filter.dompetId) {
          filtered.push(items[i]);
        }
      }
      items = filtered;
    }

    // Filter jenis
    if (filter.jenis) {
      var filtered = [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].Jenis === filter.jenis) filtered.push(items[i]);
      }
      items = filtered;
    }

    // Filter teks (q) — case-insensitive pada field Catatan
    if (filter.q) {
      var q = filter.q.toLowerCase();
      var filtered = [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].Catatan && items[i].Catatan.toLowerCase().indexOf(q) !== -1) {
          filtered.push(items[i]);
        }
      }
      items = filtered;
    }

    var total = items.length;

    // Sort by date descending, then by insertion time descending (ID contains timestamp)
    items.sort(function(a, b) {
      var dateDiff = new Date(b.Tanggal) - new Date(a.Tanggal);
      if (dateDiff !== 0) return dateDiff;
      // Tiebreak: extract timestamp from ID (format: trx-<timestamp>-<random>)
      var tsA = a.ID ? parseInt((a.ID.split('-')[1] || '0'), 10) : 0;
      var tsB = b.ID ? parseInt((b.ID.split('-')[1] || '0'), 10) : 0;
      return tsB - tsA;
    });

    // Pagination
    var paginated = items.slice(offset, offset + limit);

    var KategoriService = deps.KategoriService;
    var DompetService   = deps.DompetService;
    var kategoriList = deps.kategoriList || (KategoriService ? KategoriService.getKategori(deps) : []);
    var dompetList   = deps.dompetList   || (DompetService   ? DompetService.getDompet(deps)     : []);

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

    var mappedPaginated = [];
    for (var i = 0; i < paginated.length; i++) {
      var t = paginated[i];
      mappedPaginated.push({
        id:           t.ID,
        tanggal:      t.Tanggal,
        jenis:        t.Jenis,
        jumlah:       Number(t.Jumlah),
        kategoriId:   t.KategoriID || '',
        kategori:     mapKategori[t.KategoriID] || '',
        dompetAsalId: t.DompetAsalID,
        dompet:       mapDompet[t.DompetAsalID] || '',
        dompetTujuanId: t.DompetTujuanID || '',
        dompetTujuan: t.DompetTujuanID ? (mapDompet[t.DompetTujuanID] || '') : '',
        catatan:      t.Catatan || '',
        urlLampiran:  t.URLLampiran || ''
      });
    }

    return { items: mappedPaginated, total: total, offset: offset, limit: limit };
  },

  /**
   * Simpan transaksi baru.
   *
   * @param {object} data - { tanggal, jenis, jumlah, kategoriId, dompetAsalId, dompetTujuanId, catatan, imageBase64 }
   * @param {object} deps
   * @returns {{ success: true, data: object, warning?: string }}
   */
  saveTransaksi: function(data, deps) {
    var getSheet          = deps.getSheet;
    var SpreadsheetHelper = deps.SpreadsheetHelper;
    var Validator         = deps.Validator;
    var DompetService     = deps.DompetService;

    // Validasi input
    Validator.validateTransaksi(data);

    var jumlah = Number(data.jumlah);
    var sheet  = getSheet('Transaksi');

    // Generate ID unik
    var id = 'trx-' + Date.now() + '-' + Math.floor(Math.random() * 10000);

    // Upload gambar jika ada dan DriveApp tersedia
    var urlLampiran = data.urlLampiran || '';
    if (data.imageBase64 && deps.DriveApp) {
      try {
        var blob = deps.DriveApp.decodeBase64(data.imageBase64, data.imageMimeType || 'image/jpeg', data.imageName || 'lampiran.jpg');
        var file = deps.DriveApp.getFolderById(deps.driveFolderId || '').createFile(blob);
        file.setSharing(deps.DriveApp.Access.ANYONE_WITH_LINK, deps.DriveApp.Permission.VIEW);
        urlLampiran = file.getUrl();
      } catch (e) {
        // Gagal upload gambar tidak memblokir penyimpanan transaksi
      }
    }

    var transaksi = {
      ID:             id,
      Tanggal:        data.tanggal,
      Jenis:          data.jenis,
      Jumlah:         jumlah,
      KategoriID:     data.kategoriId || '',
      DompetAsalID:   data.dompetAsalId,
      DompetTujuanID: data.dompetTujuanId || '',
      Catatan:        Validator.sanitizeString(data.catatan || ''),
      URLLampiran:    urlLampiran
    };

    var TRANSAKSI_HEADERS = deps.TRANSAKSI_HEADERS;
    var row = SpreadsheetHelper.objectToRow(TRANSAKSI_HEADERS, transaksi);
    SpreadsheetHelper.appendRow(sheet, row);

    // Terapkan perubahan saldo
    var deltas = TransaksiService.hitungDeltaSaldo(data.jenis, jumlah, data.dompetAsalId, data.dompetTujuanId);
    var warning;
    var DompetActivityService = deps.DompetActivityService;

    // Untuk transfer, kita perlu nama dompet
    var dompetAsalNama = '';
    var dompetTujuanNama = '';
    if (data.jenis === 'Transfer' && DompetActivityService) {
      var dompetList = DompetService.getDompet(deps);
      for (var i = 0; i < dompetList.length; i++) {
        if (dompetList[i].id === data.dompetAsalId) {
          dompetAsalNama = dompetList[i].nama;
        }
        if (dompetList[i].id === data.dompetTujuanId) {
          dompetTujuanNama = dompetList[i].nama;
        }
      }
    }

    for (var i = 0; i < deltas.length; i++) {
      var dompetId = deltas[i].id;
      var delta    = deltas[i].delta;
      
      // Untuk transfer, kirim info dompet terkait
      var options = {};
      if (data.jenis === 'Transfer') {
        if (dompetId === data.dompetAsalId) {
          options.dompetTerkaitId = data.dompetTujuanId;
          options.dompetTerkaitNama = dompetTujuanNama;
          options.keterangan = 'Transfer ke ' + dompetTujuanNama + (data.catatan ? ': ' + data.catatan : '');
        } else {
          options.dompetTerkaitId = data.dompetAsalId;
          options.dompetTerkaitNama = dompetAsalNama;
          options.keterangan = 'Transfer dari ' + dompetAsalNama + (data.catatan ? ': ' + data.catatan : '');
        }
      }
      
      var updatedDompet = DompetService.updateSaldoDompet(dompetId, delta, deps, options);
      // Peringatan jika pengeluaran menyebabkan saldo negatif
      if (data.jenis === 'Pengeluaran' && updatedDompet.SaldoSaatIni < 0) {
        warning = 'Saldo dompet tidak mencukupi. Transaksi tetap disimpan.';
      }
    }

    var result = { success: true, data: transaksi };
    if (warning) result.warning = warning;
    return result;
  },

  /**
   * Perbarui transaksi yang sudah ada.
   * Menghitung delta saldo: balik efek lama, terapkan efek baru.
   *
   * @param {object} data - { id, tanggal, jenis, jumlah, kategoriId, dompetAsalId, dompetTujuanId, catatan, urlLampiran }
   * @param {object} deps
   * @returns {object} transaksi yang sudah diperbarui
   */
  updateTransaksi: function(data, deps) {
    var getSheet          = deps.getSheet;
    var SpreadsheetHelper = deps.SpreadsheetHelper;
    var Validator         = deps.Validator;
    var DompetService     = deps.DompetService;

    var id    = data.id;
    var sheet = getSheet('Transaksi');
    var found = SpreadsheetHelper.findRowById(sheet, id);
    if (!found) throw new Error('Transaksi tidak ditemukan');

    var TRANSAKSI_HEADERS = deps.TRANSAKSI_HEADERS;
    var existing = SpreadsheetHelper.rowToObject(TRANSAKSI_HEADERS, found.rowData);

    // Gabungkan data lama dengan data baru
    var updateData = {
      tanggal:        data.tanggal        !== undefined ? data.tanggal        : existing.Tanggal,
      jenis:          data.jenis          !== undefined ? data.jenis          : existing.Jenis,
      jumlah:         data.jumlah         !== undefined ? data.jumlah         : existing.Jumlah,
      dompetAsalId:   data.dompetAsalId   !== undefined ? data.dompetAsalId   : existing.DompetAsalID,
      dompetTujuanId: data.dompetTujuanId !== undefined ? data.dompetTujuanId : existing.DompetTujuanID,
      kategoriId:     data.kategoriId     !== undefined ? data.kategoriId     : existing.KategoriID,
      catatan:        data.catatan        !== undefined ? data.catatan        : existing.Catatan
    };

    Validator.validateTransaksi(updateData);

    var jumlahBaru = Number(updateData.jumlah);

    // Balik efek saldo lama
    var deltaLama = TransaksiService.hitungDeltaSaldo(existing.Jenis, Number(existing.Jumlah), existing.DompetAsalID, existing.DompetTujuanID);
    for (var i = 0; i < deltaLama.length; i++) {
      DompetService.updateSaldoDompet(deltaLama[i].id, -deltaLama[i].delta, deps);
    }

    // Terapkan efek saldo baru
    var deltaBaru = TransaksiService.hitungDeltaSaldo(updateData.jenis, jumlahBaru, updateData.dompetAsalId, updateData.dompetTujuanId);
    for (var i = 0; i < deltaBaru.length; i++) {
      DompetService.updateSaldoDompet(deltaBaru[i].id, deltaBaru[i].delta, deps);
    }

    // Update data transaksi
    var updated = {
      ID:             existing.ID,
      Tanggal:        updateData.tanggal,
      Jenis:          updateData.jenis,
      Jumlah:         jumlahBaru,
      KategoriID:     updateData.kategoriId,
      DompetAsalID:   updateData.dompetAsalId,
      DompetTujuanID: updateData.dompetTujuanId || '',
      Catatan:        Validator.sanitizeString(updateData.catatan || ''),
      URLLampiran:    data.urlLampiran !== undefined ? data.urlLampiran : existing.URLLampiran
    };

    var row = SpreadsheetHelper.objectToRow(TRANSAKSI_HEADERS, updated);
    SpreadsheetHelper.updateRow(sheet, found.rowIndex, row);

    return updated;
  },

  /**
   * Hapus transaksi dan balik efek saldo.
   *
   * @param {string} id
   * @param {object} deps
   * @returns {boolean} true jika berhasil
   */
  deleteTransaksi: function(id, deps) {
    var getSheet          = deps.getSheet;
    var SpreadsheetHelper = deps.SpreadsheetHelper;
    var DompetService     = deps.DompetService;

    var sheet = getSheet('Transaksi');
    var found = SpreadsheetHelper.findRowById(sheet, id);
    if (!found) throw new Error('Transaksi tidak ditemukan');

    var transaksi = SpreadsheetHelper.rowToObject(deps.TRANSAKSI_HEADERS, found.rowData);

    // Balik efek saldo
    var deltas = TransaksiService.hitungDeltaSaldo(transaksi.Jenis, Number(transaksi.Jumlah), transaksi.DompetAsalID, transaksi.DompetTujuanID);
    for (var i = 0; i < deltas.length; i++) {
      DompetService.updateSaldoDompet(deltas[i].id, -deltas[i].delta, deps);
    }

    // Hapus baris
    SpreadsheetHelper.deleteRow(sheet, found.rowIndex);
    return true;
  }

};
