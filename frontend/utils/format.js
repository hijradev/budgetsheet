/**
 * format.js — Utilitas format mata uang, tanggal, dan angka
 */

/**
 * Format angka sebagai mata uang.
 * @param {number} amount
 * @param {string} [locale='id-ID']
 * @param {string} [currency='IDR']
 * @returns {string} e.g. "Rp 1.500.000"
 */
function formatCurrency(amount, locale, currency) {
  locale = locale || 'id-ID';
  currency = currency || 'IDR';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount || 0));
}

/**
 * Format tanggal menjadi string yang mudah dibaca.
 * @param {string|Date} dateStr — ISO date string e.g. "2026-04-19" or full ISO "2026-04-19T17:00:00.000Z"
 * @returns {string} e.g. "19 Apr 2026"
 */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  var d;
  if (dateStr instanceof Date) {
    d = dateStr;
  } else {
    var s = String(dateStr);
    // If already a full ISO string (contains 'T'), parse directly
    // Otherwise append time to avoid timezone shifting on date-only strings
    d = s.indexOf('T') !== -1 ? new Date(s) : new Date(s + 'T00:00:00');
  }
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format tanggal relatif terhadap hari ini.
 * @param {string|Date} dateStr
 * @returns {string} "Hari ini", "Kemarin", atau "N hari lalu"
 */
function formatRelativeDate(dateStr) {
  if (!dateStr) return '-';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  var s = String(dateStr);
  const d = s.indexOf('T') !== -1 ? new Date(s) : new Date(s + 'T00:00:00');
  if (isNaN(d.getTime())) return '-';
  d.setHours(0, 0, 0, 0);
  const diffMs = today - d;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  if (diffDays > 1) return diffDays + ' hari lalu';
  return formatDate(dateStr);
}

/**
 * Format angka dengan pemisah ribuan, tanpa simbol mata uang.
 * @param {number} n
 * @returns {string} e.g. "1.500.000"
 */
function formatNumber(n) {
  return Math.round(n || 0).toLocaleString('id-ID');
}

if (typeof module !== 'undefined') {
  module.exports = { formatCurrency, formatDate, formatRelativeDate, formatNumber };
}
