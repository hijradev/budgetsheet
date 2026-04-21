/**
 * api.js — Wrapper google.script.run sebagai Promise + token helpers
 */

/**
 * Memanggil fungsi backend GAS dan mengembalikan Promise.
 * Backend sudah mengembalikan { success, data/error } — tidak dibungkus lagi.
 *
 * @param {string} fnName - Nama fungsi publik di Code.gs
 * @param {...*} args - Argumen yang diteruskan ke fungsi backend
 * @returns {Promise<{success: boolean, data?: *, error?: string}>}
 */
function callBackend(fnName) {
  var args = Array.prototype.slice.call(arguments, 1);
  return new Promise(function(resolve, reject) {
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      var runner = google.script.run
        .withSuccessHandler(function(res) {
          // Global interceptor for UNAUTHORIZED
          if (res && res.success === false && res.error === 'UNAUTHORIZED') {
            _handleUnauthorized();
            reject(new Error('Sesi telah berakhir. Silakan login kembali.'));
            return;
          }
          resolve(res);
        })
        .withFailureHandler(function(err) {
          if (err && (err === 'UNAUTHORIZED' || err.message === 'UNAUTHORIZED')) {
            _handleUnauthorized();
            reject(new Error('Sesi telah berakhir. Silakan login kembali.'));
            return;
          }
          reject(err);
        });
      runner[fnName].apply(runner, args);
    } else {
      reject(new Error('google.script.run tidak tersedia'));
    }
  });
}

function _handleUnauthorized() {
  clearToken();
  if (typeof AppCache !== 'undefined') {
    AppCache.invalidate();
  }
  if (typeof showToast !== 'undefined') {
    showToast('Sesi Anda telah berakhir', 'warning');
  }
  if (typeof navigate !== 'undefined') {
    navigate('#/login');
  } else {
    location.hash = '#/login';
  }
}

/**
 * Menambahkan class 'loading' + disabled ke elemen selama promise berjalan.
 * @param {HTMLElement} element
 * @param {Promise} promise
 * @returns {Promise}
 */
function withLoading(element, promise) {
  if (element) {
    element.classList.add('loading');
    element.disabled = true;
  }
  return promise.finally(function() {
    if (element) {
      element.classList.remove('loading');
      element.disabled = false;
    }
  });
}

/** @returns {string|null} */
function getToken() {
  try {
    return localStorage.getItem('bs_token');
  } catch (e) {
    console.error('[API] Error reading token:', e);
    return null;
  }
}

/** @param {string} token */
function setToken(token) {
  try {
    localStorage.setItem('bs_token', token);
  } catch (e) {
    console.error('[API] Error saving token:', e);
  }
}

function clearToken() {
  try {
    localStorage.removeItem('bs_token');
  } catch (e) {
    console.error('[API] Error clearing token:', e);
  }
}

if (typeof module !== 'undefined') {
  module.exports = { callBackend, withLoading, getToken, setToken, clearToken };
}
