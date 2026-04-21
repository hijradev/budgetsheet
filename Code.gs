/**
 * Code.gs — BudgetSheet GAS Entry Point
 *
 * Responsibilities:
 * - doGet(e)        : serve Index.html (or setup page on first run)
 * - include()       : GAS template helper
 * - createDeps()    : dependency factory for all services
 * - requireAuth()   : auth guard
 * - _invalidateCache(): cache invalidation helper
 * - Public API functions (auth-guarded wrappers around services)
 */

// ─── Web App Entry Point ──────────────────────────────────────────────────────

/**
 * Serve the SPA or the setup page if SPREADSHEET_ID is not yet configured.
 */
function doGet(e) {
  var props = PropertiesService.getScriptProperties();
  var spreadsheetId = props.getProperty('SPREADSHEET_ID');

  if (!spreadsheetId) {
    return HtmlService.createHtmlOutputFromFile('Setup')
      .setTitle('Setup - BudgetSheet')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, viewport-fit=cover')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('BudgetSheet')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ─── Template Helper ──────────────────────────────────────────────────────────

/**
 * GAS template include helper.
 * @param {string} filename
 * @returns {string}
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ─── Dependency Factory ───────────────────────────────────────────────────────

/**
 * Build the deps object injected into all services.
 * @returns {object}
 */
function createDeps() {
  return {
    // Constants — headers
    TRANSAKSI_HEADERS: TRANSAKSI_HEADERS,
    DOMPET_HEADERS:    DOMPET_HEADERS,
    KATEGORI_HEADERS:  KATEGORI_HEADERS,
    ANGGARAN_HEADERS:  ANGGARAN_HEADERS,
    LANGGANAN_HEADERS: LANGGANAN_HEADERS,
    DOMPET_ACTIVITY_HEADERS: DOMPET_ACTIVITY_HEADERS,

    // Constants — column index maps
    TRANSAKSI_IDX: TRANSAKSI_IDX,
    DOMPET_IDX:    DOMPET_IDX,
    KATEGORI_IDX:  KATEGORI_IDX,
    ANGGARAN_IDX:  ANGGARAN_IDX,
    LANGGANAN_IDX: LANGGANAN_IDX,

    // Shorthand column indices used by services
    TRANSAKSI_KATEGORI_IDX: TRANSAKSI_IDX.KATEGORI_ID,

    // Services
    SpreadsheetHelper: SpreadsheetHelper,
    Validator:         Validator,
    TransaksiService:  TransaksiService,
    DompetService:     DompetService,
    KategoriService:   KategoriService,
    AnggaranService:   AnggaranService,
    LanggananService:  LanggananService,
    LaporanService:    LaporanService,
    DompetActivityService: DompetActivityService,

    // Sheet accessor
    getSheet: function(sheetName) {
      var ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
      if (!ssId) throw new Error('SPREADSHEET_ID belum dikonfigurasi. Jalankan setupSystem() terlebih dahulu.');
      return SpreadsheetApp.openById(ssId).getSheetByName(sheetName);
    }
  };
}

// ─── Auth Guard ───────────────────────────────────────────────────────────────
// requireAuth(token) is defined in AuthService.gs as a GAS global.
// It calls validateSession(token) and throws Error('UNAUTHORIZED') if invalid.

// ─── Cache Helpers ────────────────────────────────────────────────────────────

/**
 * Invalidate all cached data by bumping the cache prefix version.
 */
function _invalidateCache() {
  try {
    CacheService.getScriptCache().put('CACHE_PREFIX_VERSION', new Date().getTime().toString(), 21600);
  } catch (e) {
    Logger.log('_invalidateCache error: ' + e);
  }
}

// ─── Server-Side Auth Session ─────────────────────────────────────────────────

/**
 * Set a server-side user cache flag after successful login (used by doGet preloading).
 * @param {string} token
 */
function serverSetAuth(token) {
  try {
    var cache = CacheService.getUserCache();
    if (cache) cache.put('budgetsheet_auth', 'true', 3600); // 1 hour
    return { success: true, data: true };
  } catch (e) {
    Logger.log('Error serverSetAuth: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Clear the server-side user cache flag on logout.
 */
function serverClearAuth() {
  try {
    var cache = CacheService.getUserCache();
    if (cache) cache.remove('budgetsheet_auth');
    return { success: true, data: true };
  } catch (e) {
    Logger.log('Error serverClearAuth: ' + e);
    return { success: false, error: e.message };
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────────

/**
 * Initialize the spreadsheet and Drive folder. No auth required.
 */
function setupSystem() {
  try {
    var result = setupApp();
    return { success: true, data: result };
  } catch (e) {
    Logger.log('Error setupSystem: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Run migration to add DompetActivity sheet. Auth required.
 * @param {string} token
 */
function runMigration(token) {
  try {
    requireAuth(token);
    var result = migrateDompetActivity();
    return result;
  } catch (e) {
    Logger.log('Error runMigration: ' + e);
    return { success: false, message: e.message };
  }
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

/**
 * Login with password. No auth required.
 * Wraps the auth primitives from AuthService.gs in the standard response envelope.
 * This definition takes precedence over the bare login() in AuthService.gs.
 * @param {string} password
 */
function login(password) {
  try {
    // Delegate to the internal auth implementation.
    // In GAS all .gs globals are shared; we call the underlying primitives directly.
    if (isLockedOut()) {
      throw new Error('Too many failed attempts. Please wait 15 minutes before trying again.');
    }
    if (!password || typeof password !== 'string') {
      throw new Error('Invalid request');
    }
    var storedHash = getStoredPasswordHash();
    var inputHash = hashPassword(password);
    if (inputHash !== storedHash) {
      recordFailedAttempt();
      throw new Error('Incorrect password');
    }
    clearFailedAttempts();
    var token = Utilities.getUuid();
    var sessionData = JSON.stringify({ created: Date.now() });
    var cache = CacheService.getScriptCache();
    cache.put(AUTH_CONFIG.SESSION_PREFIX + token, sessionData, AUTH_CONFIG.SESSION_DURATION);
    var props = PropertiesService.getScriptProperties();
    var hasCustomPwd = !!props.getProperty(AUTH_CONFIG.PASSWORD_KEY);
    writeAuditLog('LOGIN_SUCCESS', 'Successful login');
    return { success: true, data: { token: token, mustChangePassword: !hasCustomPwd } };
  } catch (e) {
    Logger.log('Error login: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Logout — invalidate session token.
 * @param {string} token
 */
function logout(token) {
  try {
    if (token) {
      var cache = CacheService.getScriptCache();
      cache.remove(AUTH_CONFIG.SESSION_PREFIX + token);
      writeAuditLog('LOGOUT', 'User logged out');
    }
    return { success: true, data: true };
  } catch (e) {
    Logger.log('Error logout: ' + e);
    return { success: false, error: e.message };
  }
}

// ─── Transaksi API ────────────────────────────────────────────────────────────

/**
 * Save a new transaction or update an existing one.
 * @param {object} data
 * @param {string} token
 */
function saveTransaksi(data, token) {
  try {
    requireAuth(token);
    var d = createDeps();
    var result;
    if (data && data.id) {
      result = TransaksiService.updateTransaksi(data, d);
    } else {
      result = TransaksiService.saveTransaksi(data, d);
    }
    _invalidateCache();
    return { success: true, data: result.data !== undefined ? result.data : result };
  } catch (e) {
    Logger.log('Error saveTransaksi: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Get transactions with optional filter and pagination.
 * @param {object} filter
 * @param {number} offset
 * @param {number} limit
 * @param {string} token
 */
function getTransaksi(filter, offset, limit, token) {
  try {
    requireAuth(token);
    var d = createDeps();
    var result = TransaksiService.getTransaksi(filter || {}, offset || 0, limit || 15, d);
    return { success: true, data: result };
  } catch (e) {
    Logger.log('Error getTransaksi: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Delete a transaction by ID.
 * @param {string} id
 * @param {string} token
 */
function deleteTransaksi(id, token) {
  try {
    requireAuth(token);
    var d = createDeps();
    var result = TransaksiService.deleteTransaksi(id, d);
    _invalidateCache();
    return { success: true, data: result };
  } catch (e) {
    Logger.log('Error deleteTransaksi: ' + e);
    return { success: false, error: e.message };
  }
}

// ─── Dompet API ───────────────────────────────────────────────────────────────

/**
 * Save a new wallet or update an existing one.
 * @param {object} data
 * @param {string} token
 */
function saveDompet(data, token) {
  try {
    requireAuth(token);
    var d = createDeps();
    var result = DompetService.saveDompet(data, d);
    _invalidateCache();
    return { success: true, data: result };
  } catch (e) {
    Logger.log('Error saveDompet: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Get all wallets.
 * @param {string} token
 */
function getDompet(token) {
  try {
    requireAuth(token);
    var d = createDeps();
    var result = DompetService.getDompet(d);
    return { success: true, data: result };
  } catch (e) {
    Logger.log('Error getDompet: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Delete a wallet by ID.
 * @param {string} id
 * @param {string} token
 */
function deleteDompet(id, token) {
  try {
    requireAuth(token);
    var d = createDeps();
    var result = DompetService.deleteDompet(id, d);
    _invalidateCache();
    return { success: true, data: result };
  } catch (e) {
    Logger.log('Error deleteDompet: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Get dompet activity log with optional filters.
 * @param {object} filter - { dompetId: string, limit: number }
 * @param {string} token
 */
function getDompetActivity(filter, token) {
  try {
    requireAuth(token);
    var d = createDeps();
    var result = DompetActivityService.getActivities(filter, d);
    return { success: true, data: result };
  } catch (e) {
    Logger.log('Error getDompetActivity: ' + e);
    return { success: false, error: e.message };
  }
}

// ─── Kategori API ─────────────────────────────────────────────────────────────

/**
 * Save a new category or update an existing one.
 * @param {object} data
 * @param {string} token
 */
function saveKategori(data, token) {
  try {
    requireAuth(token);
    var d = createDeps();
    var result = KategoriService.saveKategori(data, d);
    _invalidateCache();
    return { success: true, data: result };
  } catch (e) {
    Logger.log('Error saveKategori: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Get all categories.
 * @param {string} token
 */
function getKategori(token) {
  try {
    requireAuth(token);
    var d = createDeps();
    var result = KategoriService.getKategori(d);
    return { success: true, data: result };
  } catch (e) {
    Logger.log('Error getKategori: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Delete a category by ID.
 * @param {string} id
 * @param {string} token
 */
function deleteKategori(id, token) {
  try {
    requireAuth(token);
    var d = createDeps();
    var result = KategoriService.deleteKategori(id, d);
    _invalidateCache();
    return { success: true, data: result };
  } catch (e) {
    Logger.log('Error deleteKategori: ' + e);
    return { success: false, error: e.message };
  }
}

// ─── Anggaran API ─────────────────────────────────────────────────────────────

/**
 * Save a new budget or update an existing one.
 * @param {object} data
 * @param {string} token
 */
function saveAnggaran(data, token) {
  try {
    requireAuth(token);
    var d = createDeps();
    var result = AnggaranService.saveAnggaran(data, d);
    _invalidateCache();
    return { success: true, data: result };
  } catch (e) {
    Logger.log('Error saveAnggaran: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Get budgets with realization for a given month/year.
 * @param {string} token
 */
function getAnggaran(token) {
  try {
    requireAuth(token);
    var d = createDeps();
    var result = AnggaranService.getAnggaran(d);
    return { success: true, data: result };
  } catch (e) {
    Logger.log('Error getAnggaran: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Delete a budget by ID.
 * @param {string} id
 * @param {string} token
 */
function deleteAnggaran(id, token) {
  try {
    requireAuth(token);
    var d = createDeps();
    var result = AnggaranService.deleteAnggaran(id, d);
    _invalidateCache();
    return { success: true, data: result };
  } catch (e) {
    Logger.log('Error deleteAnggaran: ' + e);
    return { success: false, error: e.message };
  }
}

// ─── Langganan API ────────────────────────────────────────────────────────────

/**
 * Save a new subscription or update an existing one.
 * @param {object} data
 * @param {string} token
 */
function saveLangganan(data, token) {
  try {
    requireAuth(token);
    var d = createDeps();
    var result = LanggananService.saveLangganan(data, d);
    _invalidateCache();
    return { success: true, data: result };
  } catch (e) {
    Logger.log('Error saveLangganan: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Get all subscriptions.
 * @param {string} token
 */
function getLangganan(token) {
  try {
    requireAuth(token);
    var d = createDeps();
    var result = LanggananService.getLangganan(d);
    return { success: true, data: result };
  } catch (e) {
    Logger.log('Error getLangganan: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Delete a subscription by ID.
 * @param {string} id
 * @param {string} token
 */
function deleteLangganan(id, token) {
  try {
    requireAuth(token);
    var d = createDeps();
    var result = LanggananService.deleteLangganan(id, d);
    _invalidateCache();
    return { success: true, data: result };
  } catch (e) {
    Logger.log('Error deleteLangganan: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Mark a subscription as paid and advance its due date.
 * @param {string} id
 * @param {string} token
 */
function bayarLangganan(id, token) {
  try {
    requireAuth(token);
    var d = createDeps();
    var result = LanggananService.bayarLangganan(id, d);
    _invalidateCache();
    return { success: true, data: result };
  } catch (e) {
    Logger.log('Error bayarLangganan: ' + e);
    return { success: false, error: e.message };
  }
}

// ─── Laporan API ──────────────────────────────────────────────────────────────

/**
 * Get report data for a given period filter.
 * @param {object} filter
 * @param {string} token
 */
function getLaporanData(filter, token) {
  try {
    requireAuth(token);
    var d = createDeps();
    var result = LaporanService.getLaporanData(filter || {}, d);
    return { success: true, data: result };
  } catch (e) {
    Logger.log('Error getLaporanData: ' + e);
    return { success: false, error: e.message };
  }
}

// ─── Dashboard API ────────────────────────────────────────────────────────────

/**
 * Get all data needed by the Dashboard page in a single call.
 * @param {string} token
 */
function getDashboardData(token) {
  try {
    requireAuth(token);
    var d = createDeps();
    var result = LaporanService.getDashboardData(d);
    return { success: true, data: result };
  } catch (e) {
    Logger.log('Error getDashboardData: ' + e);
    return { success: false, error: e.message };
  }
}

// ─── Seed / Sample Data ───────────────────────────────────────────────────────

/**
 * Run directly from the GAS editor — no token required.
 * Select this function in the editor and click Run.
 */
function runSeedSampleData() {
  var result = _doSeedSampleData();
  Logger.log(JSON.stringify(result));
}

/**
 * Web API wrapper — requires a valid session token.
 * @param {string} token
 */
function seedSampleData(token) {
  try {
    requireAuth(token);
    return _doSeedSampleData();
  } catch (e) {
    Logger.log('Error seedSampleData: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Core seed logic — no auth, called by both wrappers above.
 */
function _doSeedSampleData() {
  try {
    var d = createDeps();

    // ── 1. Kategori ──────────────────────────────────────────────────────────
    var kategoriDefs = [
      { nama: 'Gaji',          jenis: 'Pemasukan',   ikon: 'briefcase',      warna: '#6BCB77' },
      { nama: 'Freelance',     jenis: 'Pemasukan',   ikon: 'device-laptop',  warna: '#74B9FF' },
      { nama: 'Makan & Minum', jenis: 'Pengeluaran', ikon: 'tools-kitchen-2',warna: '#EF6C6C' },
      { nama: 'Transportasi',  jenis: 'Pengeluaran', ikon: 'car',            warna: '#FFD166' },
      { nama: 'Belanja',       jenis: 'Pengeluaran', ikon: 'shopping-cart',  warna: '#C9B8E8' },
      { nama: 'Hiburan',       jenis: 'Pengeluaran', ikon: 'device-tv',      warna: '#A8D8EA' },
      { nama: 'Kesehatan',     jenis: 'Pengeluaran', ikon: 'heart-rate-monitor', warna: '#EF6C6C' },
      { nama: 'Tagihan',       jenis: 'Pengeluaran', ikon: 'file-invoice',   warna: '#718096' },
    ];
    var kategoriIds = [];
    for (var i = 0; i < kategoriDefs.length; i++) {
      var k = KategoriService.saveKategori(kategoriDefs[i], d);
      kategoriIds.push(k.ID || k.id);
    }
    // id map by name for readability below
    var kGaji = kategoriIds[0], kFreelance = kategoriIds[1];
    var kMakan = kategoriIds[2], kTransport = kategoriIds[3];
    var kBelanja = kategoriIds[4], kHiburan = kategoriIds[5];
    var kKesehatan = kategoriIds[6], kTagihan = kategoriIds[7];

    // ── 2. Dompet ────────────────────────────────────────────────────────────
    var dompetDefs = [
      { nama: 'BCA',    saldoAwal: 5000000,  ikon: 'building-bank',  warna: '#0066AE' },
      { nama: 'GoPay',  saldoAwal: 500000,   ikon: 'brand-google-pay', warna: '#00AED6' },
      { nama: 'Tunai',  saldoAwal: 1000000,  ikon: 'cash',           warna: '#6BCB77' },
    ];
    var dompetIds = [];
    for (var i = 0; i < dompetDefs.length; i++) {
      var dmp = DompetService.saveDompet(dompetDefs[i], d);
      dompetIds.push(dmp.ID || dmp.id);
    }
    var dBCA = dompetIds[0], dGoPay = dompetIds[1], dTunai = dompetIds[2];

    // ── 3. Transaksi (50 entries spread over last 60 days) ───────────────────
    var now = new Date();
    function daysAgo(n) {
      var dt = new Date(now);
      dt.setDate(dt.getDate() - n);
      return dt.toISOString().split('T')[0];
    }

    var transaksiDefs = [
      // Pemasukan
      { tanggal: daysAgo(58), jenis: 'Pemasukan',   jumlah: 8000000,  kategoriId: kGaji,      dompetAsalId: dBCA,    catatan: 'Gaji bulan lalu' },
      { tanggal: daysAgo(45), jenis: 'Pemasukan',   jumlah: 1500000,  kategoriId: kFreelance, dompetAsalId: dBCA,    catatan: 'Proyek desain logo' },
      { tanggal: daysAgo(30), jenis: 'Pemasukan',   jumlah: 8000000,  kategoriId: kGaji,      dompetAsalId: dBCA,    catatan: 'Gaji bulan ini' },
      { tanggal: daysAgo(20), jenis: 'Pemasukan',   jumlah: 750000,   kategoriId: kFreelance, dompetAsalId: dGoPay,  catatan: 'Jasa konsultasi' },
      { tanggal: daysAgo(10), jenis: 'Pemasukan',   jumlah: 2000000,  kategoriId: kFreelance, dompetAsalId: dBCA,    catatan: 'Proyek website' },
      // Pengeluaran — Makan
      { tanggal: daysAgo(57), jenis: 'Pengeluaran', jumlah: 45000,    kategoriId: kMakan,     dompetAsalId: dTunai,  catatan: 'Makan siang' },
      { tanggal: daysAgo(55), jenis: 'Pengeluaran', jumlah: 85000,    kategoriId: kMakan,     dompetAsalId: dGoPay,  catatan: 'Dinner keluarga' },
      { tanggal: daysAgo(52), jenis: 'Pengeluaran', jumlah: 35000,    kategoriId: kMakan,     dompetAsalId: dTunai,  catatan: 'Sarapan' },
      { tanggal: daysAgo(50), jenis: 'Pengeluaran', jumlah: 120000,   kategoriId: kMakan,     dompetAsalId: dGoPay,  catatan: 'Makan bersama teman' },
      { tanggal: daysAgo(47), jenis: 'Pengeluaran', jumlah: 55000,    kategoriId: kMakan,     dompetAsalId: dTunai,  catatan: 'Makan siang kantor' },
      { tanggal: daysAgo(43), jenis: 'Pengeluaran', jumlah: 40000,    kategoriId: kMakan,     dompetAsalId: dTunai,  catatan: 'Kopi & snack' },
      { tanggal: daysAgo(38), jenis: 'Pengeluaran', jumlah: 95000,    kategoriId: kMakan,     dompetAsalId: dGoPay,  catatan: 'Makan malam' },
      { tanggal: daysAgo(33), jenis: 'Pengeluaran', jumlah: 60000,    kategoriId: kMakan,     dompetAsalId: dTunai,  catatan: 'Makan siang' },
      { tanggal: daysAgo(28), jenis: 'Pengeluaran', jumlah: 75000,    kategoriId: kMakan,     dompetAsalId: dGoPay,  catatan: 'Restoran padang' },
      { tanggal: daysAgo(22), jenis: 'Pengeluaran', jumlah: 50000,    kategoriId: kMakan,     dompetAsalId: dTunai,  catatan: 'Warteg' },
      { tanggal: daysAgo(15), jenis: 'Pengeluaran', jumlah: 110000,   kategoriId: kMakan,     dompetAsalId: dGoPay,  catatan: 'Makan keluarga' },
      { tanggal: daysAgo(8),  jenis: 'Pengeluaran', jumlah: 45000,    kategoriId: kMakan,     dompetAsalId: dTunai,  catatan: 'Makan siang' },
      { tanggal: daysAgo(3),  jenis: 'Pengeluaran', jumlah: 80000,    kategoriId: kMakan,     dompetAsalId: dGoPay,  catatan: 'Dinner' },
      // Pengeluaran — Transportasi
      { tanggal: daysAgo(56), jenis: 'Pengeluaran', jumlah: 35000,    kategoriId: kTransport, dompetAsalId: dGoPay,  catatan: 'Grab ke kantor' },
      { tanggal: daysAgo(49), jenis: 'Pengeluaran', jumlah: 50000,    kategoriId: kTransport, dompetAsalId: dGoPay,  catatan: 'Ojek online' },
      { tanggal: daysAgo(42), jenis: 'Pengeluaran', jumlah: 200000,   kategoriId: kTransport, dompetAsalId: dBCA,    catatan: 'Bensin bulanan' },
      { tanggal: daysAgo(35), jenis: 'Pengeluaran', jumlah: 45000,    kategoriId: kTransport, dompetAsalId: dGoPay,  catatan: 'Grab pulang' },
      { tanggal: daysAgo(21), jenis: 'Pengeluaran', jumlah: 200000,   kategoriId: kTransport, dompetAsalId: dBCA,    catatan: 'Bensin' },
      { tanggal: daysAgo(7),  jenis: 'Pengeluaran', jumlah: 60000,    kategoriId: kTransport, dompetAsalId: dGoPay,  catatan: 'Taksi online' },
      // Pengeluaran — Belanja
      { tanggal: daysAgo(54), jenis: 'Pengeluaran', jumlah: 350000,   kategoriId: kBelanja,   dompetAsalId: dBCA,    catatan: 'Belanja bulanan supermarket' },
      { tanggal: daysAgo(40), jenis: 'Pengeluaran', jumlah: 180000,   kategoriId: kBelanja,   dompetAsalId: dBCA,    catatan: 'Baju baru' },
      { tanggal: daysAgo(25), jenis: 'Pengeluaran', jumlah: 450000,   kategoriId: kBelanja,   dompetAsalId: dBCA,    catatan: 'Belanja mingguan' },
      { tanggal: daysAgo(12), jenis: 'Pengeluaran', jumlah: 250000,   kategoriId: kBelanja,   dompetAsalId: dBCA,    catatan: 'Perlengkapan rumah' },
      { tanggal: daysAgo(4),  jenis: 'Pengeluaran', jumlah: 150000,   kategoriId: kBelanja,   dompetAsalId: dTunai,  catatan: 'Pasar tradisional' },
      // Pengeluaran — Hiburan
      { tanggal: daysAgo(51), jenis: 'Pengeluaran', jumlah: 100000,   kategoriId: kHiburan,   dompetAsalId: dBCA,    catatan: 'Bioskop' },
      { tanggal: daysAgo(36), jenis: 'Pengeluaran', jumlah: 150000,   kategoriId: kHiburan,   dompetAsalId: dBCA,    catatan: 'Konser musik' },
      { tanggal: daysAgo(18), jenis: 'Pengeluaran', jumlah: 80000,    kategoriId: kHiburan,   dompetAsalId: dGoPay,  catatan: 'Game online top-up' },
      { tanggal: daysAgo(6),  jenis: 'Pengeluaran', jumlah: 100000,   kategoriId: kHiburan,   dompetAsalId: dBCA,    catatan: 'Bioskop weekend' },
      // Pengeluaran — Kesehatan
      { tanggal: daysAgo(48), jenis: 'Pengeluaran', jumlah: 150000,   kategoriId: kKesehatan, dompetAsalId: dBCA,    catatan: 'Obat apotek' },
      { tanggal: daysAgo(29), jenis: 'Pengeluaran', jumlah: 300000,   kategoriId: kKesehatan, dompetAsalId: dBCA,    catatan: 'Dokter umum' },
      { tanggal: daysAgo(11), jenis: 'Pengeluaran', jumlah: 85000,    kategoriId: kKesehatan, dompetAsalId: dTunai,  catatan: 'Vitamin & suplemen' },
      // Pengeluaran — Tagihan
      { tanggal: daysAgo(59), jenis: 'Pengeluaran', jumlah: 350000,   kategoriId: kTagihan,   dompetAsalId: dBCA,    catatan: 'Listrik bulan lalu' },
      { tanggal: daysAgo(58), jenis: 'Pengeluaran', jumlah: 150000,   kategoriId: kTagihan,   dompetAsalId: dBCA,    catatan: 'Internet bulan lalu' },
      { tanggal: daysAgo(57), jenis: 'Pengeluaran', jumlah: 120000,   kategoriId: kTagihan,   dompetAsalId: dBCA,    catatan: 'Air PDAM' },
      { tanggal: daysAgo(29), jenis: 'Pengeluaran', jumlah: 350000,   kategoriId: kTagihan,   dompetAsalId: dBCA,    catatan: 'Listrik bulan ini' },
      { tanggal: daysAgo(28), jenis: 'Pengeluaran', jumlah: 150000,   kategoriId: kTagihan,   dompetAsalId: dBCA,    catatan: 'Internet bulan ini' },
      { tanggal: daysAgo(27), jenis: 'Pengeluaran', jumlah: 120000,   kategoriId: kTagihan,   dompetAsalId: dBCA,    catatan: 'Air PDAM' },
      // Transfer
      { tanggal: daysAgo(44), jenis: 'Transfer',    jumlah: 500000,   kategoriId: '',         dompetAsalId: dBCA,    dompetTujuanId: dGoPay,  catatan: 'Top-up GoPay' },
      { tanggal: daysAgo(23), jenis: 'Transfer',    jumlah: 300000,   kategoriId: '',         dompetAsalId: dBCA,    dompetTujuanId: dTunai,  catatan: 'Ambil tunai' },
      { tanggal: daysAgo(9),  jenis: 'Transfer',    jumlah: 200000,   kategoriId: '',         dompetAsalId: dBCA,    dompetTujuanId: dGoPay,  catatan: 'Top-up GoPay' },
      // Extra pengeluaran to reach 50
      { tanggal: daysAgo(46), jenis: 'Pengeluaran', jumlah: 75000,    kategoriId: kMakan,     dompetAsalId: dTunai,  catatan: 'Makan siang bersama' },
      { tanggal: daysAgo(32), jenis: 'Pengeluaran', jumlah: 55000,    kategoriId: kTransport, dompetAsalId: dGoPay,  catatan: 'Ojek pagi' },
      { tanggal: daysAgo(17), jenis: 'Pengeluaran', jumlah: 90000,    kategoriId: kMakan,     dompetAsalId: dGoPay,  catatan: 'Makan malam' },
      { tanggal: daysAgo(2),  jenis: 'Pengeluaran', jumlah: 65000,    kategoriId: kMakan,     dompetAsalId: dTunai,  catatan: 'Sarapan & kopi' },
    ];

    for (var i = 0; i < transaksiDefs.length; i++) {
      TransaksiService.saveTransaksi(transaksiDefs[i], d);
    }

    // ── 4. Anggaran ──────────────────────────────────────────────────────────
    var bulanIni = now.getMonth() + 1;
    var tahunIni = now.getFullYear();
    var anggaranDefs = [
      { kategoriId: kMakan,     jumlahAnggaran: 1500000, periode: 'Bulanan', bulan: bulanIni, tahun: tahunIni },
      { kategoriId: kTransport, jumlahAnggaran: 600000,  periode: 'Bulanan', bulan: bulanIni, tahun: tahunIni },
      { kategoriId: kBelanja,   jumlahAnggaran: 1000000, periode: 'Bulanan', bulan: bulanIni, tahun: tahunIni },
    ];
    for (var i = 0; i < anggaranDefs.length; i++) {
      AnggaranService.saveAnggaran(anggaranDefs[i], d);
    }

    // ── 5. Langganan ─────────────────────────────────────────────────────────
    function addDays(n) {
      var dt = new Date(now);
      dt.setDate(dt.getDate() + n);
      return dt.toISOString().split('T')[0];
    }
    var langgananDefs = [
      { nama: 'Netflix',  jumlah: 186000, kategoriId: kHiburan,  dompetId: dBCA,   frekuensi: 'Bulanan', tanggalJatuhTempo: addDays(5),  catatan: 'Paket standar' },
      { nama: 'Spotify',  jumlah: 54990,  kategoriId: kHiburan,  dompetId: dGoPay, frekuensi: 'Bulanan', tanggalJatuhTempo: addDays(2),  catatan: 'Premium individual' },
    ];
    for (var i = 0; i < langgananDefs.length; i++) {
      LanggananService.saveLangganan(langgananDefs[i], d);
    }

    _invalidateCache();
    return {
      success: true,
      data: {
        kategori:  kategoriDefs.length,
        dompet:    dompetDefs.length,
        transaksi: transaksiDefs.length,
        anggaran:  anggaranDefs.length,
        langganan: langgananDefs.length,
      }
    };
  } catch (e) {
    Logger.log('Error _doSeedSampleData: ' + e);
    return { success: false, error: e.message };
  }
}
