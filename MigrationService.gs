/**
 * MigrationService.gs — Helper untuk migrasi dan update schema
 */

/**
 * Tambahkan sheet DompetActivity jika belum ada.
 * Fungsi ini aman dipanggil berulang kali (idempoten).
 * 
 * @returns {object} { success: boolean, message: string }
 */
function migrateDompetActivity() {
  try {
    var ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (!ssId) {
      return { success: false, message: 'SPREADSHEET_ID belum dikonfigurasi' };
    }

    var ss = SpreadsheetApp.openById(ssId);
    var sheet = ss.getSheetByName('DompetActivity');
    
    if (sheet) {
      return { success: true, message: 'Sheet DompetActivity sudah ada' };
    }

    // Buat sheet baru
    sheet = ss.insertSheet('DompetActivity');
    sheet.appendRow(DOMPET_ACTIVITY_HEADERS);
    
    return { success: true, message: 'Sheet DompetActivity berhasil ditambahkan' };
  } catch (e) {
    Logger.log('Error migrateDompetActivity: ' + e);
    return { success: false, message: e.message };
  }
}
