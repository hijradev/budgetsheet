/**
 * Validator.gs — Validasi dan sanitasi input untuk BudgetSheet App
 * Ported dari MoneySheet/backend/Validator.js
 * Dijalankan sebagai GAS global object (tanpa module.exports / require).
 */

var Validator = (function () {

  function validateJumlah(val) {
    var n = Number(val);
    if (val === null || val === undefined || val === '' || isNaN(n) || n <= 0) {
      throw new Error('Jumlah harus berupa angka positif');
    }
    return true;
  }

  function validateRequired(value, fieldName) {
    var name = fieldName || 'Field';
    if (value === null || value === undefined || value === '') {
      throw new Error(name + ' harus diisi');
    }
    return true;
  }

  function validateJenis(val) {
    if (['Pemasukan', 'Pengeluaran', 'Transfer'].indexOf(val) === -1) {
      throw new Error('Jenis transaksi tidak valid. Harus salah satu dari: Pemasukan, Pengeluaran, Transfer');
    }
    return true;
  }

  function validatePeriode(val) {
    if (['Bulanan', 'Mingguan', 'Tahunan'].indexOf(val) === -1) {
      throw new Error('Periode tidak valid. Harus salah satu dari: Bulanan, Mingguan, Tahunan');
    }
    return true;
  }

  function validateFrekuensi(val) {
    if (['Harian', 'Mingguan', 'Bulanan', 'Tahunan'].indexOf(val) === -1) {
      throw new Error('Frekuensi tidak valid. Harus salah satu dari: Harian, Mingguan, Bulanan, Tahunan');
    }
    return true;
  }

  function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    if (['+', '-', '=', '@'].indexOf(str[0]) !== -1) return "'" + str;
    return str;
  }

  function validateTransaksi(data) {
    if (!data.tanggal) throw new Error('Tanggal transaksi harus diisi');
    validateJenis(data.jenis);
    validateJumlah(data.jumlah);
    if (!data.dompetAsalId) throw new Error('Dompet asal harus diisi');
    return true;
  }

  function validateDompet(data) {
    if (!data.nama || typeof data.nama !== 'string' || data.nama.trim() === '') {
      throw new Error('Nama dompet harus diisi');
    }
    validateJumlah(data.saldoAwal);
    return true;
  }

  function validateKategori(data) {
    if (!data.nama || typeof data.nama !== 'string' || data.nama.trim() === '') {
      throw new Error('Nama kategori harus diisi');
    }
    validateJenis(data.jenis);
    return true;
  }

  function validateAnggaran(data) {
    if (!data.kategoriId) throw new Error('Kategori harus diisi');
    validateJumlah(data.jumlahAnggaran);
    validatePeriode(data.periode);
    return true;
  }

  function validateLangganan(data) {
    if (!data.nama || typeof data.nama !== 'string' || data.nama.trim() === '') {
      throw new Error('Nama langganan harus diisi');
    }
    validateJumlah(data.jumlah);
    validateFrekuensi(data.frekuensi);
    return true;
  }

  return {
    validateJumlah: validateJumlah,
    validateRequired: validateRequired,
    validateJenis: validateJenis,
    validatePeriode: validatePeriode,
    validateFrekuensi: validateFrekuensi,
    sanitizeString: sanitizeString,
    validateTransaksi: validateTransaksi,
    validateDompet: validateDompet,
    validateKategori: validateKategori,
    validateAnggaran: validateAnggaran,
    validateLangganan: validateLangganan
  };
})();
