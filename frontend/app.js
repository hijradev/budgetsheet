/**
 * app.js — Hash router dan AppCache untuk BudgetSheet
 */

// ---------------------------------------------------------------------------
// AppCache — in-memory store untuk data yang jarang berubah
// ---------------------------------------------------------------------------
var AppCache = {
  _store: {},

  get: function(key) {
    return this._store[key] !== undefined ? this._store[key] : null;
  },

  set: function(key, value) {
    this._store[key] = value;
  },

  invalidate: function(key) {
    if (key) {
      delete this._store[key];
    } else {
      this._store = {};
    }
  },

  getKategori: function(forceRefresh) {
    var self = this;
    if (!forceRefresh && self.get('kategori')) {
      return Promise.resolve(self.get('kategori'));
    }
    return callBackend('getKategori', getToken()).then(function(res) {
      if (res && res.success) {
        self.set('kategori', res.data);
        return res.data;
      }
      return [];
    });
  },

  getDompet: function(forceRefresh) {
    var self = this;
    if (!forceRefresh && self.get('dompet')) {
      return Promise.resolve(self.get('dompet'));
    }
    return callBackend('getDompet', getToken()).then(function(res) {
      if (res && res.success) {
        self.set('dompet', res.data);
        return res.data;
      }
      return [];
    });
  },
};

// ---------------------------------------------------------------------------
// Route map
// ---------------------------------------------------------------------------
var routes = {
  '/login':      function() { renderLogin(); },
  '/dashboard':  function() { renderDashboard(); },
  '/transaksi':  function() { renderTransaksi(); },
  '/dompet':     function() { renderDompet(); },
  '/kategori':   function() { renderKategori(); },
  '/anggaran':   function() { renderAnggaran(); },
  '/langganan':  function() { renderLangganan(); },
  '/laporan':    function() { renderLaporan(); },
  '/pengaturan': function() { renderPengaturan(); },
  '/about':      function() { renderAbout(); },
  '/license':    function() { renderLicense(); },
  '/privacy':    function() { renderPrivacy(); },
  '/terms':      function() { renderTerms(); },
};

// ---------------------------------------------------------------------------
// Navigation helpers
// ---------------------------------------------------------------------------
function navigate(hash) {
  location.hash = hash;
}

// ---------------------------------------------------------------------------
// Sidebar nav items config
// ---------------------------------------------------------------------------
var navItems = [
  { route: '/dashboard',  label: 'Dashboard',   icon: 'ti-layout-dashboard' },
  { route: '/transaksi',  label: 'Transaksi',   icon: 'ti-arrows-exchange' },
  { route: '/dompet',     label: 'Dompet',      icon: 'ti-wallet' },
  { route: '/kategori',   label: 'Kategori',    icon: 'ti-tag' },
  { route: '/anggaran',   label: 'Anggaran',    icon: 'ti-chart-pie' },
  { route: '/langganan',  label: 'Langganan',   icon: 'ti-repeat' },
  { route: '/laporan',    label: 'Laporan',     icon: 'ti-report-analytics' },
  { route: '/pengaturan', label: 'Pengaturan',  icon: 'ti-settings' },
];

// ---------------------------------------------------------------------------
// renderNav — glassmorphism navbar
// ---------------------------------------------------------------------------
function renderNav() {
  var nav = document.getElementById('app-nav');
  if (!nav) return;
  nav.innerHTML =
    '<div class="nav-brand">' +
      '<i class="ti ti-coin me-2"></i>' +
      '<span class="nav-brand-text">BudgetSheet</span>' +
    '</div>' +
    '<button class="nav-hamburger" id="sidebar-toggle" aria-label="Toggle menu">' +
      '<i class="ti ti-menu-2"></i>' +
    '</button>' +
    '<div class="nav-actions">' +
      '<button class="btn btn-primary btn-sm" id="nav-add-transaksi-btn">' +
        '<i class="ti ti-plus"></i> <span class="btn-text">Tambah Transaksi</span>' +
      '</button>' +
      '<button class="btn btn-ghost btn-sm" id="logout-btn">' +
        '<i class="ti ti-logout"></i> <span class="btn-text">Keluar</span>' +
      '</button>' +
    '</div>';

  var toggleBtn = document.getElementById('sidebar-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      var sidebar = document.getElementById('app-sidebar');
      if (sidebar) sidebar.classList.toggle('sidebar-open');
    });
  }

  var logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      clearToken();
      AppCache.invalidate();
      navigate('#/login');
    });
  }

  var addTransaksiBtn = document.getElementById('nav-add-transaksi-btn');
  if (addTransaksiBtn) {
    addTransaksiBtn.addEventListener('click', function() {
      if (typeof showTambahTransaksiModal === 'function') {
        showTambahTransaksiModal();
      } else {
        navigate('#/transaksi');
      }
    });
  }
}

// ---------------------------------------------------------------------------
// renderSidebar — sidebar nav links
// ---------------------------------------------------------------------------
function renderSidebar() {
  var sidebar = document.getElementById('app-sidebar');
  if (!sidebar) return;

  var currentPath = (location.hash || '#/dashboard').replace('#', '') || '/dashboard';

  var html = '<nav class="sidebar-nav">';
  navItems.forEach(function(item) {
    var isActive = currentPath === item.route ? ' active' : '';
    html +=
      '<a href="#' + item.route + '" class="sidebar-link' + isActive + '" data-route="' + item.route + '">' +
        '<i class="ti ' + item.icon + ' sidebar-icon"></i>' +
        '<span>' + item.label + '</span>' +
      '</a>';
  });
  html += '</nav>';
  sidebar.innerHTML = html;

  // Close sidebar on mobile after nav click
  sidebar.querySelectorAll('.sidebar-link').forEach(function(link) {
    link.addEventListener('click', function() {
      if (window.innerWidth < 768) {
        sidebar.classList.remove('sidebar-open');
      }
    });
  });
}

// ---------------------------------------------------------------------------
// renderApp — renders the full app shell
// ---------------------------------------------------------------------------
function renderApp() {
  var app = document.getElementById('app');
  if (!app) return;

  app.innerHTML =
    '<nav class="app-nav glass-nav" id="app-nav"></nav>' +
    '<div class="app-body">' +
      '<aside class="app-sidebar glass-sidebar" id="app-sidebar"></aside>' +
      '<main class="page-content" id="page-content"></main>' +
    '</div>' +
    '<div id="page-loader-overlay" class="page-loader-overlay" aria-hidden="true">' +
      '<div class="page-loader">' +
        '<div class="loader-ring loader-ring-1"></div>' +
        '<div class="loader-ring loader-ring-2"></div>' +
        '<div class="loader-ring loader-ring-3"></div>' +
        '<div class="loader-icon"><i class="ti ti-coin"></i></div>' +
      '</div>' +
      '<div class="loader-label">Memuat data...</div>' +
    '</div>' +
    '<div id="toast-container" class="toast-container"></div>' +
    '<div id="modal-container"></div>';

  renderNav();
  renderSidebar();
  handleRoute();
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
function handleRoute() {
  var hash = location.hash || '#/dashboard';
  var path = hash.replace('#', '') || '/dashboard';

  // Auth guard
  if (!getToken() && path !== '/login') {
    navigate('#/login');
    return;
  }

  // If authenticated and on /login, redirect to dashboard
  if (getToken() && path === '/login') {
    navigate('#/dashboard');
    return;
  }

  // Update active sidebar link
  var sidebar = document.getElementById('app-sidebar');
  if (sidebar) {
    sidebar.querySelectorAll('.sidebar-link').forEach(function(link) {
      var route = link.getAttribute('data-route');
      if (route === path) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  var handler = routes[path];
  if (!handler) {
    navigate('#/dashboard');
    return;
  }

  try {
    handler();
  } catch (e) {
    console.error('[Router] Error rendering route:', path, e);
    var content = document.getElementById('page-content');
    if (content) {
      content.innerHTML =
        '<div class="error-state">' +
          '<i class="ti ti-alert-circle"></i>' +
          '<p>Gagal memuat halaman. Coba lagi.</p>' +
        '</div>';
    }
  }
}

// ---------------------------------------------------------------------------
// renderLogin — login page (standalone, no shell)
// ---------------------------------------------------------------------------
function renderLogin() {
  var app = document.getElementById('app');
  if (!app) return;
  // Delegate to login page module if available
  if (typeof renderLoginPage === 'function') {
    renderLoginPage();
  } else {
    app.innerHTML = '<div class="login-placeholder"><p>Login page loading...</p></div>';
  }
}

// ---------------------------------------------------------------------------
// Hash change listener
// ---------------------------------------------------------------------------
window.addEventListener('hashchange', function() {
  // Re-render sidebar to update active state, then handle route
  var sidebar = document.getElementById('app-sidebar');
  if (sidebar && sidebar.innerHTML) {
    renderSidebar();
  }
  handleRoute();
});

// ---------------------------------------------------------------------------
// Page loader — fixed overlay over the content area
// ---------------------------------------------------------------------------
function showPageLoader() {
  var overlay = document.getElementById('page-loader-overlay');
  if (overlay) {
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
  }
}

function hidePageLoader() {
  var overlay = document.getElementById('page-loader-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
  }
}

// showInlineLoader kept as alias for backward compat — both now use the overlay
function showInlineLoader() {
  showPageLoader();
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
function bootstrap() {
  console.log('[App] Bootstrapping...');
  var token = getToken();
  var hash = location.hash || '';

  if (!token) {
    // Not authenticated — show login
    if (hash !== '#/login') {
      location.hash = '#/login';
    }
    if (typeof renderLoginPage === 'function') {
      renderLoginPage();
    } else {
      var app = document.getElementById('app');
      if (app) app.innerHTML = '<div class="flex-center" style="height:100vh">Gagal memuat modul login.</div>';
    }
    return;
  }

  // Authenticated — render full app shell
  if (!hash || hash === '#/login') {
    location.hash = '#/dashboard';
  }
  renderApp();
}

// Ensure bootstrap runs even if DOMContentLoaded already fired
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

// ---------------------------------------------------------------------------
// Node.js / Jest compatibility
// ---------------------------------------------------------------------------
if (typeof module !== 'undefined') {
  module.exports = { AppCache, routes, navigate, handleRoute, renderNav, renderSidebar, renderApp };
}
