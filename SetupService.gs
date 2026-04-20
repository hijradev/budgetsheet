/**
 * Setup.gs — Inisialisasi otomatis Spreadsheet dan folder Drive
 * GAS global scope — no require/module.exports
 */

/**
 * Inisialisasi aplikasi: buat Spreadsheet, folder Drive, dan isi data sampel.
 * Idempoten — aman dijalankan berulang kali.
 *
 * @param {object} [deps] - dependency injection untuk testability
 * @param {object} [deps.PropertiesService]
 * @param {object} [deps.SpreadsheetApp]
 * @param {object} [deps.DriveApp]
 * @returns {{ spreadsheetId: string, driveFolderId: string }}
 */
function setupApp(deps) {
  deps = deps || {};
  var ps  = deps.PropertiesService || PropertiesService;
  var sa  = deps.SpreadsheetApp    || SpreadsheetApp;
  var da  = deps.DriveApp          || DriveApp;

  var props = ps.getScriptProperties();

  // Idempotency guard — return early if already set up
  var existingSpreadsheetId = props.getProperty('SPREADSHEET_ID');
  var existingFolderId      = props.getProperty('DRIVE_FOLDER_ID');
  if (existingSpreadsheetId && existingFolderId) {
    return { spreadsheetId: existingSpreadsheetId, driveFolderId: existingFolderId };
  }

  // --- Spreadsheet ---
  var spreadsheetId;
  var spreadsheet;

  if (!existingSpreadsheetId) {
    spreadsheet   = sa.create('BudgetSheet');
    spreadsheetId = spreadsheet.getId();

    var defaultSheet = spreadsheet.getSheets()[0];
    var sheetDefs = [
      { name: SHEET_TRANSAKSI, headers: TRANSAKSI_HEADERS },
      { name: SHEET_DOMPET,    headers: DOMPET_HEADERS    },
      { name: SHEET_KATEGORI,  headers: KATEGORI_HEADERS  },
      { name: SHEET_ANGGARAN,  headers: ANGGARAN_HEADERS  },
      { name: SHEET_LANGGANAN, headers: LANGGANAN_HEADERS },
    ];

    sheetDefs.forEach(function(def, index) {
      var sheet;
      if (index === 0) {
        sheet = defaultSheet;
        sheet.setName(def.name);
      } else {
        sheet = spreadsheet.insertSheet(def.name);
      }
      sheet.appendRow(def.headers);
    });

    props.setProperty('SPREADSHEET_ID', spreadsheetId);
  } else {
    spreadsheetId = existingSpreadsheetId;
    spreadsheet   = sa.openById(spreadsheetId);
  }

  // --- Drive Folder ---
  var driveFolderId;

  if (!existingFolderId) {
    var folder    = da.createFolder('BudgetSheet Attachments');
    driveFolderId = folder.getId();
    props.setProperty('DRIVE_FOLDER_ID', driveFolderId);
  } else {
    driveFolderId = existingFolderId;
  }

  return { spreadsheetId: spreadsheetId, driveFolderId: driveFolderId };
}

/**
 * Ambil SPREADSHEET_ID dari PropertiesService.
 * @param {object} [deps]
 * @returns {string|null}
 */
function getSpreadsheetId(deps) {
  deps = deps || {};
  var ps = deps.PropertiesService || PropertiesService;
  return ps.getScriptProperties().getProperty('SPREADSHEET_ID');
}

/**
 * Ambil DRIVE_FOLDER_ID dari PropertiesService.
 * @param {object} [deps]
 * @returns {string|null}
 */
function getDriveFolderId(deps) {
  deps = deps || {};
  var ps = deps.PropertiesService || PropertiesService;
  return ps.getScriptProperties().getProperty('DRIVE_FOLDER_ID');
}
