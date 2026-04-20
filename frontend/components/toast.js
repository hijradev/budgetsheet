/**
 * toast.js — Komponen notifikasi Toast dengan Tabler Icons
 */

/**
 * Menampilkan notifikasi toast.
 * Auto-close setelah 5000ms dengan animasi fade-out.
 *
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} [type='success']
 * @returns {HTMLElement}
 */
function showToast(message, type) {
  type = type || 'success';
  var container = document.getElementById('toast-container') || document.body;

  var typeMap = {
    success: { cls: 'toast-success', icon: 'ti-check' },
    error:   { cls: 'toast-error',   icon: 'ti-x' },
    warning: { cls: 'toast-warning', icon: 'ti-alert-triangle' },
    info:    { cls: 'toast-info',    icon: 'ti-info-circle' },
  };
  var config = typeMap[type] || typeMap.info;

  var toast = document.createElement('div');
  toast.className = 'bs-toast ' + config.cls;
  toast.setAttribute('role', 'alert');
  toast.innerHTML =
    '<i class="ti ' + config.icon + ' toast-icon"></i>' +
    '<span class="toast-message">' + message + '</span>' +
    '<button class="toast-close" aria-label="Tutup">&times;</button>';

  toast.querySelector('.toast-close').addEventListener('click', function() {
    _removeToast(toast);
  });

  container.appendChild(toast);

  // Trigger reflow for CSS transition
  toast.getBoundingClientRect();
  toast.classList.add('toast-visible');

  toast._timerId = setTimeout(function() {
    _removeToast(toast);
  }, 5000);

  return toast;
}

function _removeToast(toast) {
  if (!toast || !toast.parentNode) return;
  clearTimeout(toast._timerId);
  toast.classList.remove('toast-visible');
  toast.style.transition = 'opacity 0.3s';
  toast.style.opacity = '0';
  setTimeout(function() {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 300);
}

if (typeof module !== 'undefined') {
  module.exports = { showToast, _removeToast };
}
