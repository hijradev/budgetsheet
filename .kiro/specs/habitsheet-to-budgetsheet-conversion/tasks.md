# Implementation Plan: HabitSheet to BudgetSheet Conversion

## Overview

Convert the HabitSheet codebase into BudgetSheet by reusing `AuthService.gs` and `CacheService.gs` unchanged, porting MoneySheet's six backend services as `.gs` files, replacing the frontend with a glassmorphism SPA, and wiring everything together through a rewritten `Code.gs` entry point. Tests are written with Jest + fast-check.

## Tasks

- [x] 1. Project scaffolding and configuration
  - Remove HabitSheet-specific `.gs` files (`HabitService.gs`, `CompletionService.gs`, `SettingsService.gs`, `SampleData.gs`) and their HTML counterparts (`Setup.html`, `Styles.html`, `I18n.html`, `Login.html`, `App.html`)
  - Update `appsscript.json` to set the correct webapp title and scopes for BudgetSheet (Drive, Spreadsheet, Script Properties, Cache)
  - Update `package.json` to rename the project to `budgetsheet`, add `fast-check` as a dev dependency, and configure Jest (`testEnvironment: node`, `testMatch: **/tests/**/*.test.js`)
  - Create the `frontend/` directory tree: `frontend/index.html`, `frontend/app.js`, `frontend/utils/`, `frontend/components/`, `frontend/pages/`
  - Create the `tests/` directory with a `.gitkeep`
  - _Requirements: 14.1, 14.6_

- [x] 2. Backend infrastructure — Constants, SpreadsheetHelper, Validator
  - [x] 2.1 Create `Constants.gs`
    - Define sheet name constants (`SHEET_TRANSAKSI`, `SHEET_DOMPET`, `SHEET_KATEGORI`, `SHEET_ANGGARAN`, `SHEET_LANGGANAN`)
    - Define header arrays (`TRANSAKSI_HEADERS`, `DOMPET_HEADERS`, `KATEGORI_HEADERS`, `ANGGARAN_HEADERS`, `LANGGANAN_HEADERS`)
    - Define column index maps (`TRANSAKSI_IDX`, `DOMPET_IDX`, `KATEGORI_IDX`, `ANGGARAN_IDX`, `LANGGANAN_IDX`)
    - _Requirements: 2.1, 3.1, 4.1, 5.1, 6.1_

  - [x] 2.2 Port `SpreadsheetHelper.gs` from `MoneySheet/backend/SpreadsheetHelper.js`
    - Adapt to `.gs` syntax (remove `module.exports`, keep all batch read/write helpers)
    - Ensure `getRows`, `appendRow`, `updateRow`, `deleteRow` use `getValues`/`setValues` batch operations
    - _Requirements: 12.1, 12.2_

  - [x] 2.3 Port `Validator.gs` from `MoneySheet/backend/Validator.js`
    - Adapt to `.gs` syntax
    - Implement `validateJumlah(value)` — throws for non-positive, NaN, null, empty string
    - Implement `sanitizeString(str)` — prepends `'` when first char is `=`, `+`, `-`, `@`
    - Implement all field validators (`validateJenis`, `validateRequired`, etc.)
    - _Requirements: 2.8, 11.1, 11.2_

  - [ ]* 2.4 Write unit tests for Validator (`tests/validator.unit.test.js`)
    - Test `validateJumlah` with zero, negative, NaN, null, empty string, and valid positive
    - Test `sanitizeString` with formula-injection prefixes and safe strings
    - _Requirements: 2.8, 11.2_

  - [ ]* 2.5 Write property test for `validateJumlah` — Property 9
    - **Property 9: Input validation rejects non-positive amounts**
    - **Validates: Requirements 2.8, 5.2**

  - [ ]* 2.6 Write property test for `sanitizeString` — Property 10
    - **Property 10: Input sanitization neutralizes formula injection**
    - **Validates: Requirements 11.2**

- [x] 3. Backend infrastructure — Setup and Code entry point
  - [x] 3.1 Port `Setup.gs` from `MoneySheet/backend/Setup.js`
    - Adapt to `.gs` syntax
    - Implement `setupApp()`: create Spreadsheet + all sheets with headers, create Drive folder, save IDs to PropertiesService
    - Implement idempotency guard: if IDs already exist in PropertiesService, skip creation
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 3.2 Write unit tests for Setup (`tests/setup.unit.test.js`)
    - Test first-run creates spreadsheet and folder
    - Test second-run reuses existing IDs without creating duplicates
    - _Requirements: 1.4_

  - [ ]* 3.3 Write property test for `setupApp` idempotency — Property 1
    - **Property 1: Setup idempotency**
    - **Validates: Requirements 1.4**

  - [x] 3.4 Rewrite `Code.gs`
    - Implement `doGet(e)`: serve `Index.html`; redirect to setup page if `SPREADSHEET_ID` not set
    - Implement `include(filename)` GAS template helper
    - Implement `createDeps()` factory (injects Constants, SpreadsheetHelper, Validator, all services, `getSheet`)
    - Implement `requireAuth(token)` guard using `AuthService`
    - Implement `_invalidateCache()` helper
    - Implement all public API functions: `saveTransaksi`, `getTransaksi`, `deleteTransaksi`, `saveDompet`, `getDompet`, `deleteDompet`, `saveKategori`, `getKategori`, `deleteKategori`, `saveAnggaran`, `getAnggaran`, `deleteAnggaran`, `saveLangganan`, `getLangganan`, `deleteLangganan`, `bayarLangganan`, `getLaporanData`, `getDashboardData`, `setupSystem`, `login`, `logout`, `serverSetAuth`, `serverClearAuth`
    - Each function wraps service call in try/catch and returns `{ success, data }` or `{ success: false, error }`
    - _Requirements: 11.3, 11.4, 14.1_

- [x] 4. Checkpoint — Backend infrastructure complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Backend services — TransaksiService and DompetService
  - [x] 5.1 Port `TransaksiService.gs` from `MoneySheet/backend/TransaksiService.js`
    - Adapt to `.gs` syntax
    - Implement `hitungDeltaSaldo(jenis, jumlah, dompetAsalId, dompetTujuanId)` — pure function returning delta array
    - Implement `saveTransaksi(data, deps)` — validate, compute deltas, append row, update wallet balances
    - Implement `getTransaksi(filter, offset, limit, deps)` — batch read, apply filter, paginate
    - Implement `updateTransaksi(data, deps)` — reverse old deltas, apply new deltas, update row
    - Implement `deleteTransaksi(id, deps)` — reverse deltas, delete row
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7, 2.9, 8.3, 8.4, 12.3_

  - [x] 5.2 Port `DompetService.gs` from `MoneySheet/backend/DompetService.js`
    - Adapt to `.gs` syntax
    - Implement `saveDompet(data, deps)` — create sets `SaldoSaatIni = SaldoAwal`; update preserves balance
    - Implement `getDompet(deps)` — batch read all wallets
    - Implement `deleteDompet(id, deps)` — guard: throw if wallet has transactions
    - Implement `updateSaldoDompet(deltas, deps)` — apply delta array to wallet rows
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 5.3 Write unit tests for TransaksiService (`tests/transaksi.unit.test.js`)
    - Test save, get with filters, update balance reversal, delete balance reversal
    - Test pagination: offset and limit slicing
    - Use `makeMockSheet` pattern from design
    - _Requirements: 2.1–2.7, 8.4, 12.3_

  - [ ]* 5.4 Write unit tests for DompetService (`tests/dompet.unit.test.js`)
    - Test create sets current balance, update preserves balance, delete guard
    - _Requirements: 3.2, 3.3, 3.4_

  - [ ]* 5.5 Write property test for `hitungDeltaSaldo` Income — Property 2
    - **Property 2: Transaction balance delta — Income**
    - **Validates: Requirements 2.3**

  - [ ]* 5.6 Write property test for `hitungDeltaSaldo` Expense — Property 3
    - **Property 3: Transaction balance delta — Expense**
    - **Validates: Requirements 2.4**

  - [ ]* 5.7 Write property test for `hitungDeltaSaldo` Transfer — Property 4
    - **Property 4: Transaction balance delta — Transfer**
    - **Validates: Requirements 2.2**

  - [ ]* 5.8 Write property test for transaction save round-trip — Property 5
    - **Property 5: Transaction save round-trip**
    - **Validates: Requirements 2.1**

  - [ ]* 5.9 Write property test for transaction delete reverses balance — Property 6
    - **Property 6: Transaction delete reverses balance**
    - **Validates: Requirements 2.7**

  - [ ]* 5.10 Write property test for wallet creation balance — Property 7
    - **Property 7: Wallet creation sets current balance equal to initial balance**
    - **Validates: Requirements 3.2**

  - [ ]* 5.11 Write property test for wallet update preserves balance — Property 8
    - **Property 8: Wallet update preserves balance**
    - **Validates: Requirements 3.3**

  - [ ]* 5.12 Write property test for transaction filter correctness — Property 16
    - **Property 16: Transaction filter correctness**
    - **Validates: Requirements 8.4**

  - [ ]* 5.13 Write property test for pagination slice correctness — Property 17
    - **Property 17: Pagination slice correctness**
    - **Validates: Requirements 12.3**

- [x] 6. Backend services — KategoriService, AnggaranService, LanggananService, LaporanService
  - [x] 6.1 Port `KategoriService.gs` from `MoneySheet/backend/KategoriService.js`
    - Adapt to `.gs` syntax
    - Implement `saveKategori`, `getKategori`, `deleteKategori` (guard: throw if category used in transactions)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 6.2 Port `AnggaranService.gs` from `MoneySheet/backend/AnggaranService.js`
    - Adapt to `.gs` syntax
    - Implement `hitungRealisasi(kategoriId, bulan, tahun, rows, idx)` — pure function summing matching expense rows
    - Implement `hitungStatusAnggaran(actual, budget)` — returns `'normal'`, `'peringatan'`, or `'kritis'`
    - Implement `saveAnggaran`, `getAnggaran` (with realization attached), `deleteAnggaran`
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6_

  - [x] 6.3 Port `LanggananService.gs` from `MoneySheet/backend/LanggananService.js`
    - Adapt to `.gs` syntax
    - Implement `hitungDueDateBerikutnya(tanggal, frekuensi)` — pure function advancing date by period
    - Implement `hitungStatusLangganan(dueDate, today)` — returns `true` if due within 3 days
    - Implement `saveLangganan`, `getLangganan`, `deleteLangganan`, `bayarLangganan` (creates expense transaction + advances due date)
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

  - [x] 6.4 Port `LaporanService.gs` from `MoneySheet/backend/LaporanService.js`
    - Adapt to `.gs` syntax
    - Implement `getLaporanData(filter, deps)` — aggregate income, expenses, net balance, per-category breakdown, period grouping
    - Implement `getDashboardData(deps)` — total balance, monthly income/expense, recent transactions, upcoming subscriptions
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 9.1, 9.2, 9.3, 9.4_

  - [ ]* 6.5 Write unit tests for KategoriService (`tests/kategori.unit.test.js`)
    - Test CRUD and delete guard
    - _Requirements: 4.2, 4.3, 4.4_

  - [ ]* 6.6 Write unit tests for AnggaranService (`tests/anggaran.unit.test.js`)
    - Test realization calculation, status thresholds, CRUD
    - _Requirements: 5.3, 5.5, 5.6_

  - [ ]* 6.7 Write unit tests for LanggananService (`tests/langganan.unit.test.js`)
    - Test due date advance per frequency, pay action creates transaction and advances date
    - _Requirements: 6.3, 6.2_

  - [ ]* 6.8 Write unit tests for LaporanService (`tests/laporan.unit.test.js`)
    - Test net balance identity, period grouping, per-category breakdown
    - _Requirements: 9.2_

  - [ ]* 6.9 Write property test for `hitungRealisasi` — Property 12
    - **Property 12: Budget realization calculation**
    - **Validates: Requirements 5.3**

  - [ ]* 6.10 Write property test for `hitungStatusAnggaran` — Property 11
    - **Property 11: Budget status thresholds**
    - **Validates: Requirements 5.5, 5.6**

  - [ ]* 6.11 Write property test for `hitungDueDateBerikutnya` — Property 13
    - **Property 13: Subscription due date advance**
    - **Validates: Requirements 6.3**

  - [ ]* 6.12 Write property test for `hitungStatusLangganan` — Property 14
    - **Property 14: Subscription warning threshold**
    - **Validates: Requirements 6.5**

  - [ ]* 6.13 Write property test for report net balance identity — Property 15
    - **Property 15: Report net balance identity**
    - **Validates: Requirements 9.2**

- [x] 7. Checkpoint — All backend services complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Frontend shell — glassmorphism design system and layout
  - [x] 8.1 Create `frontend/index.html`
    - Write shell HTML with `<div id="app">` mount point
    - Embed glassmorphism CSS design tokens (CSS custom properties from design: `--bg-gradient`, `--glass-bg`, `--glass-border`, `--glass-blur`, `--glass-shadow`, `--radius-card`, `--radius-btn`, `--radius-input`, status colors)
    - Add global styles: body gradient background, frosted glass card class (`.glass-card`), button styles, input styles, toast container, modal overlay
    - Link Tabler Icons CDN and Chart.js CDN
    - Add `<script>` tags for all frontend JS files in correct load order
    - _Requirements: 10.7, 10.8, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [x] 8.2 Create `frontend/utils/format.js`
    - Implement `formatCurrency(amount, locale, currency)` — thousand separators, decimal places
    - Implement `formatDate(dateStr)` — human-readable date display
    - Implement `formatRelativeDate(dateStr)` — "today", "yesterday", N days ago
    - _Requirements: 10.9_

  - [x] 8.3 Create `frontend/utils/api.js`
    - Implement `callBackend(fnName, ...args)` — wraps `google.script.run` in a Promise
    - Implement `withLoading(element, promise)` — shows spinner on element during async op
    - _Requirements: 10.2, 12.2_

  - [x] 8.4 Create `frontend/components/toast.js`
    - Implement `showToast(message, type)` — renders toast with `success`/`error`/`warning` styles, auto-closes after 5 seconds
    - _Requirements: 10.3, 10.4_

  - [x] 8.5 Create `frontend/components/modal.js`
    - Implement `openModal(title, contentHtml)` — renders modal overlay with frosted glass panel
    - Implement `closeModal()` — removes modal from DOM
    - _Requirements: 10.5_

  - [x] 8.6 Create `frontend/components/charts.js`
    - Implement `renderPieChart(canvasId, labels, data, colors)` — Chart.js pie/doughnut wrapper
    - Implement `renderLineChart(canvasId, labels, datasets)` — Chart.js line chart wrapper
    - Implement `renderBarChart(canvasId, labels, datasets)` — Chart.js bar chart wrapper
    - _Requirements: 7.3, 7.4, 9.3_

  - [x] 8.7 Create `frontend/app.js` — hash router and AppCache
    - Implement hash router: parse `location.hash`, map to page render functions, listen to `hashchange`
    - Implement `AppCache` with `getKategori()`, `getDompet()`, `invalidate(key)` using in-memory store + localStorage fallback
    - Implement `navigate(hash)` helper
    - Implement auth guard: redirect to `#/login` if no token in localStorage
    - _Requirements: 10.1, 10.6, 12.4_

- [x] 9. Frontend pages — Login and Dashboard
  - [x] 9.1 Create `frontend/pages/login.js`
    - Render login form with glassmorphism card, password input, submit button
    - On submit: call `callBackend('login', password)`, store token in localStorage, navigate to `#/dashboard`
    - Handle `mustChangePassword` flag
    - _Requirements: 14.1_

  - [x] 9.2 Create `frontend/pages/dashboard.js`
    - Call `getDashboardData` on render
    - Display total wallet balance (formatted currency)
    - Display monthly income and expense summary cards
    - Render expense-by-category pie chart and weekly expense line chart
    - Display recent transactions list (max 6 items) with link to `#/transaksi`
    - Display upcoming subscriptions (due within 7 days) with warning indicator for ≤3 days
    - Render quick-nav links to `#/transaksi`, `#/anggaran`, `#/dompet`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 6.5_

- [x] 10. Frontend pages — Transaksi, Dompet, Kategori
  - [x] 10.1 Create `frontend/pages/transaksi.js`
    - Render transaction list grid (15 per page, "Load More" button)
    - Implement client-side text search on notes/category name
    - Implement filter bar: date range, category, wallet, type
    - On filter change: call `getTransaksi(filter, offset, limit)` and re-render
    - "New Transaction" button opens modal with form (date, type, amount, category, wallet, notes, attachment)
    - Click on item opens detail modal with edit/delete options
    - On save/delete: show toast, close modal, refresh list
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 10.2 Create `frontend/pages/dompet.js`
    - Render wallet grid with glassmorphism cards showing name, icon, color, current balance
    - "New Wallet" button opens modal form (name, initial balance, icon, color)
    - Click on wallet card opens edit/delete modal
    - On save: call `saveDompet`, show toast, refresh; on delete: confirm then call `deleteDompet`
    - Invalidate `AppCache.dompet` after any mutation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 10.2, 10.3, 10.4_

  - [x] 10.3 Create `frontend/pages/kategori.js`
    - Render category grid with glassmorphism cards showing name, icon, color, type
    - "New Category" button opens modal form (name, type, icon, color)
    - Click on category card opens edit/delete modal
    - On save: call `saveKategori`, show toast, refresh; on delete: confirm then call `deleteKategori`
    - Invalidate `AppCache.kategori` after any mutation
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 10.2, 10.3, 10.4_

- [x] 11. Frontend pages — Anggaran, Langganan, Laporan, Pengaturan
  - [x] 11.1 Create `frontend/pages/anggaran.js`
    - Call `getAnggaran` on render (returns budgets with realization attached)
    - Render budget cards with glassmorphism progress bar: actual vs budget amount
    - Apply warning style (amber) when `actual/budget >= 0.8`, critical style (red) when `>= 1.0`
    - "New Budget" button opens modal form (category, amount, period, month/year)
    - On save/delete: show toast, refresh
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 11.2 Create `frontend/pages/langganan.js`
    - Call `getLangganan` on render
    - Render subscription list with name, amount, frequency, next due date
    - Show warning indicator for subscriptions due within 3 days
    - "Pay" button calls `bayarLangganan(id)`, shows toast, refreshes
    - "New Subscription" button opens modal form (name, amount, category, wallet, frequency, due date, notes)
    - On save/delete: show toast, refresh
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 11.3 Create `frontend/pages/laporan.js`
    - Render period filter tabs: Daily, Weekly, Monthly, Yearly + custom date range inputs
    - On filter change: call `getLaporanData(filter)` and re-render
    - Display income, expense, net balance summary cards
    - Render income vs expense bar chart
    - Render per-category expense table with percentage of total
    - Render budget vs actual comparison table (monthly only)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 11.4 Create `frontend/pages/pengaturan.js`
    - Display app info (version, spreadsheet link)
    - Provide logout button: call `logout`, clear localStorage, navigate to `#/login`
    - Provide "Change Password" form
    - _Requirements: 11.3_

- [x] 12. Checkpoint — All frontend pages complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Build pipeline
  - [x] 13.1 Rewrite `build.js`
    - Read `frontend/index.html` as the shell template
    - Inline all JS files from `frontend/utils/`, `frontend/components/`, `frontend/pages/`, and `frontend/app.js` into a single `<script>` block
    - Write the bundled output to `dist/Index.html` (or root `Index.html` for GAS deployment via clasp)
    - Preserve `<?!= include(...) ?>` GAS template tags if present
    - _Requirements: 14.6_

  - [x] 13.2 Verify build output
    - Run `node build.js` and confirm `Index.html` is generated without errors
    - Confirm all frontend JS is inlined and no external file references remain
    - _Requirements: 14.6_

- [x] 14. Final checkpoint — Full integration
  - Ensure all tests pass (`npm test`), ask the user if questions arise.
  - Confirm `node build.js` produces a valid `Index.html`
  - Confirm `clasp push` would include all `.gs` files and `Index.html`

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All property-based tests are collected in `tests/budgetsheet.property.test.js`; unit tests are in their respective `*.unit.test.js` files
- `AuthService.gs` and `CacheService.gs` are copied verbatim from HabitSheet — do not modify them
- The `MoneySheet/` directory is reference-only; port logic by adapting `.js` files to `.gs` syntax (remove `module.exports`, keep DI pattern)
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
