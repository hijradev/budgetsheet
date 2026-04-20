/**
 * SpreadsheetHelper.gs — Utilitas batch read/write untuk Google Spreadsheet
 * Global GAS helper; semua fungsi dapat diakses sebagai SpreadsheetHelper.xxx()
 */

var SpreadsheetHelper = {

  /**
   * Ambil sheet berdasarkan nama dari spreadsheet.
   *
   * @param {string} spreadsheetId
   * @param {string} sheetName
   * @returns {object} sheet object
   */
  getSheet: function(spreadsheetId, sheetName) {
    return SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
  },

  /**
   * Baca semua data sekaligus menggunakan getDataRange().getValues().
   * Mengembalikan array of arrays (baris). Baris pertama adalah header.
   *
   * @param {object} sheet
   * @returns {Array<Array>}
   */
  batchRead: function(sheet) {
    return sheet.getDataRange().getValues();
  },

  /**
   * Tambah baris baru ke sheet.
   *
   * @param {object} sheet
   * @param {Array} rowData
   */
  appendRow: function(sheet, rowData) {
    sheet.appendRow(rowData);
  },

  /**
   * Update baris pada rowIndex (1-based) dengan data baru menggunakan setValues batch.
   *
   * @param {object} sheet
   * @param {number} rowIndex - 1-based row index
   * @param {Array} rowData
   */
  updateRow: function(sheet, rowIndex, rowData) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  },

  /**
   * Hapus baris pada rowIndex (1-based).
   *
   * @param {object} sheet
   * @param {number} rowIndex - 1-based row index
   */
  deleteRow: function(sheet, rowIndex) {
    sheet.deleteRow(rowIndex);
  },

  /**
   * Cari baris di mana kolom pertama cocok dengan id.
   * Menggunakan batchRead secara internal.
   *
   * @param {object} sheet
   * @param {string} id
   * @returns {{ rowIndex: number, rowData: Array }|null}
   */
  findRowById: function(sheet, id) {
    var data = SpreadsheetHelper.batchRead(sheet);
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        return { rowIndex: i + 1, rowData: data[i] };
      }
    }
    return null;
  },

  /**
   * Konversi array baris menjadi objek menggunakan headers sebagai kunci.
   *
   * @param {Array<string>} headers
   * @param {Array} row
   * @returns {object}
   */
  rowToObject: function(headers, row) {
    var obj = {};
    for (var i = 0; i < headers.length; i++) {
      var val = row[i] !== undefined ? row[i] : null;
      if (val instanceof Date) {
        val = val.toISOString();
      }
      obj[headers[i]] = val;
    }
    return obj;
  },

  /**
   * Konversi objek menjadi array baris menggunakan headers sebagai kunci.
   * Nilai yang tidak ada di objek akan diisi dengan null.
   *
   * @param {Array<string>} headers
   * @param {object} obj
   * @returns {Array}
   */
  objectToRow: function(headers, obj) {
    return headers.map(function(key) {
      return obj[key] !== undefined ? obj[key] : null;
    });
  },

  /**
   * Alias: ambil semua baris data (tanpa header) sebagai array of objects.
   * Baris pertama dianggap header.
   *
   * @param {object} sheet
   * @returns {Array<object>}
   */
  getRows: function(sheet) {
    var data = SpreadsheetHelper.batchRead(sheet);
    if (data.length < 2) return [];
    var headers = data[0];
    var rows = [];
    for (var i = 1; i < data.length; i++) {
      rows.push(SpreadsheetHelper.rowToObject(headers, data[i]));
    }
    return rows;
  }

};
