/**
 * Shared constants for BudgetSheet Backend
 * GAS global scope — no require/module.exports
 */

// Sheet name constants
var SHEET_TRANSAKSI = 'Transaksi';
var SHEET_DOMPET    = 'Dompet';
var SHEET_KATEGORI  = 'Kategori';
var SHEET_ANGGARAN  = 'Anggaran';
var SHEET_LANGGANAN = 'Langganan';

// Header arrays
var TRANSAKSI_HEADERS = ['ID', 'Tanggal', 'Jenis', 'Jumlah', 'KategoriID', 'DompetAsalID', 'DompetTujuanID', 'Catatan', 'URLLampiran'];
var DOMPET_HEADERS    = ['ID', 'Nama', 'SaldoAwal', 'SaldoSaatIni', 'Ikon', 'Warna', 'TanggalDibuat'];
var KATEGORI_HEADERS  = ['ID', 'Nama', 'Jenis', 'Ikon', 'Warna'];
var ANGGARAN_HEADERS  = ['ID', 'KategoriID', 'JumlahAnggaran', 'Periode', 'Bulan', 'Tahun'];
var LANGGANAN_HEADERS = ['ID', 'Nama', 'Jumlah', 'KategoriID', 'DompetID', 'Frekuensi', 'TanggalJatuhTempo', 'Catatan', 'Status'];

// Column index maps (0-based)
var TRANSAKSI_IDX = {
  ID:               0,
  TANGGAL:          1,
  JENIS:            2,
  JUMLAH:           3,
  KATEGORI_ID:      4,
  DOMPET_ASAL_ID:   5,
  DOMPET_TUJUAN_ID: 6,
  CATATAN:          7,
  URL_LAMPIRAN:     8,
};

var DOMPET_IDX = {
  ID:             0,
  NAMA:           1,
  SALDO_AWAL:     2,
  SALDO_SAAT_INI: 3,
  IKON:           4,
  WARNA:          5,
  TANGGAL_DIBUAT: 6,
};

var KATEGORI_IDX = {
  ID:    0,
  NAMA:  1,
  JENIS: 2,
  IKON:  3,
  WARNA: 4,
};

var ANGGARAN_IDX = {
  ID:              0,
  KATEGORI_ID:     1,
  JUMLAH_ANGGARAN: 2,
  PERIODE:         3,
  BULAN:           4,
  TAHUN:           5,
};

var LANGGANAN_IDX = {
  ID:                  0,
  NAMA:                1,
  JUMLAH:              2,
  KATEGORI_ID:         3,
  DOMPET_ID:           4,
  FREKUENSI:           5,
  TANGGAL_JATUH_TEMPO: 6,
  CATATAN:             7,
  STATUS:              8,
};
