/**
 * modal.js — Komponen Modal glassmorphism generik
 */

var _activeModal = null;

/**
 * Membuka modal dengan glass-card panel.
 * Menutup saat klik overlay atau tombol X.
 *
 * @param {string} title
 * @param {string} contentHtml
 * @param {string} [footerHtml]
 * @returns {HTMLElement}
 */
function openModal(title, contentHtml, footerHtml) {
  closeModal();

  var overlay = document.createElement('div');
  overlay.id = 'bs-modal-overlay';
  overlay.className = 'bs-modal-overlay';

  var panel = document.createElement('div');
  panel.className = 'bs-modal-panel glass-card';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'bs-modal-title');

  panel.innerHTML =
    '<div class="bs-modal-header">' +
      '<h5 class="bs-modal-title" id="bs-modal-title">' + title + '</h5>' +
      '<button class="bs-modal-close" id="bs-modal-close-btn" aria-label="Tutup">&times;</button>' +
    '</div>' +
    '<div class="bs-modal-body">' + contentHtml + '</div>' +
    (footerHtml ? '<div class="bs-modal-footer">' + footerHtml + '</div>' : '');

  var container = document.getElementById('modal-container') || document.body;
  overlay.appendChild(panel);
  container.appendChild(overlay);

  _activeModal = overlay;

  panel.querySelector('#bs-modal-close-btn').addEventListener('click', closeModal);

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeModal();
  });

  var _escHandler = function(e) {
    if (e.key === 'Escape') closeModal();
  };
  document.addEventListener('keydown', _escHandler);
  overlay._escHandler = _escHandler;

  return overlay;
}

/**
 * Chiude il modal attivo e pulisce il DOM.
 */
function closeModal() {
  if (_activeModal) {
    if (_activeModal._escHandler) {
      document.removeEventListener('keydown', _activeModal._escHandler);
    }
    _activeModal.remove();
    _activeModal = null;
  }
}

/**
 * Mostra un dialog di conferma.
 * @param {string} message
 * @returns {Promise<boolean>}
 */
function confirmModal(message) {
  return new Promise(function(resolve) {
    var footerHtml =
      '<button class="btn btn-secondary" id="confirm-cancel-btn">Batal</button>' +
      '<button class="btn btn-primary" id="confirm-ok-btn">OK</button>';

    var modal = openModal('Konfirmasi', '<p>' + message + '</p>', footerHtml);

    modal.querySelector('#confirm-ok-btn').addEventListener('click', function() {
      closeModal();
      resolve(true);
    });

    modal.querySelector('#confirm-cancel-btn').addEventListener('click', function() {
      closeModal();
      resolve(false);
    });
  });
}

if (typeof module !== 'undefined') {
  module.exports = { openModal, closeModal, confirmModal };
}
