# Dompet Activity Log - Testing Guide

## Pre-Testing Setup

### For New Installations
1. Deploy the code to Google Apps Script
2. Run initial setup
3. Create a test password
4. Login to the application

### For Existing Installations
1. Deploy the updated code
2. Login to the application
3. Navigate to Settings (Pengaturan)
4. Click "Jalankan Migrasi" button
5. Wait for success message: "Sheet DompetActivity berhasil ditambahkan"

## Test Cases

### Test 1: Add New Wallet
**Objective**: Verify that adding a new wallet creates an activity log entry

**Steps**:
1. Navigate to Dompet page
2. Click "Tambah Dompet" button
3. Fill in the form:
   - Nama: "Test Wallet 1"
   - Saldo Awal: 1000000
   - Ikon: wallet
   - Warna: #206bc4
4. Click "Simpan"
5. Scroll down to "Riwayat Aktivitas" section

**Expected Results**:
- ✅ New wallet appears in the grid
- ✅ Activity log shows new entry:
  - Aktivitas: "Tambah Dompet" (green icon)
  - Dompet: "Test Wallet 1"
  - Perubahan: +Rp 1.000.000 (green)
  - Saldo Sebelum: Rp 0
  - Saldo Sesudah: Rp 1.000.000
  - Keterangan: "Dompet baru dibuat dengan saldo awal Rp 1.000.000"

---

### Test 2: Edit Wallet
**Objective**: Verify that editing wallet details creates an activity log entry

**Steps**:
1. Navigate to Dompet page
2. Click "Edit" on "Test Wallet 1"
3. Change the name to "Test Wallet Updated"
4. Change the icon to "credit-card"
5. Click "Simpan"
6. Scroll down to activity log

**Expected Results**:
- ✅ Wallet name updated in grid
- ✅ Activity log shows new entry:
  - Aktivitas: "Edit Dompet" (orange icon)
  - Dompet: "Test Wallet Updated"
  - Perubahan: - (no change)
  - Saldo Sebelum: Rp 1.000.000
  - Saldo Sesudah: Rp 1.000.000
  - Keterangan: "Nama diubah dari 'Test Wallet 1'"

---

### Test 3: Create Transfer Transaction
**Objective**: Verify that transfers create two activity log entries

**Prerequisites**: Create two wallets:
- Wallet A: "BCA" with Rp 5.000.000
- Wallet B: "GoPay" with Rp 500.000

**Steps**:
1. Navigate to Transaksi page
2. Click "Tambah Transaksi"
3. Fill in the form:
   - Tanggal: Today
   - Jenis: Transfer
   - Jumlah: 1000000
   - Dompet Asal: BCA
   - Dompet Tujuan: GoPay
   - Catatan: "Top up GoPay"
4. Click "Simpan"
5. Navigate to Dompet page
6. Scroll to activity log

**Expected Results**:
- ✅ BCA balance: Rp 4.000.000 (decreased)
- ✅ GoPay balance: Rp 1.500.000 (increased)
- ✅ Activity log shows TWO entries:

  Entry 1 (GoPay - most recent):
  - Aktivitas: "Transfer Masuk" (green icon)
  - Dompet: "GoPay"
  - Perubahan: +Rp 1.000.000 (green)
  - Saldo Sebelum: Rp 500.000
  - Saldo Sesudah: Rp 1.500.000
  - Keterangan: "Transfer dari BCA: Top up GoPay"

  Entry 2 (BCA):
  - Aktivitas: "Transfer Keluar" (red icon)
  - Dompet: "BCA"
  - Perubahan: -Rp 1.000.000 (red)
  - Saldo Sebelum: Rp 5.000.000
  - Saldo Sesudah: Rp 4.000.000
  - Keterangan: "Transfer ke GoPay: Top up GoPay"

---

### Test 4: Delete Wallet
**Objective**: Verify that deleting a wallet creates an activity log entry

**Prerequisites**: Create a wallet with no transactions:
- "Test Delete" with Rp 100.000

**Steps**:
1. Navigate to Dompet page
2. Click "Hapus" on "Test Delete" wallet
3. Confirm deletion in the modal
4. Scroll to activity log

**Expected Results**:
- ✅ Wallet removed from grid
- ✅ Activity log shows new entry:
  - Aktivitas: "Hapus Dompet" (red icon)
  - Dompet: "Test Delete"
  - Perubahan: -Rp 100.000 (red)
  - Saldo Sebelum: Rp 100.000
  - Saldo Sesudah: Rp 0
  - Keterangan: "Dompet dihapus dengan saldo terakhir Rp 100.000"

---

### Test 5: Activity Log Display
**Objective**: Verify activity log displays correctly with proper formatting

**Steps**:
1. Navigate to Dompet page
2. Scroll to "Riwayat Aktivitas" section
3. Observe the table

**Expected Results**:
- ✅ Table has 7 columns: Waktu, Aktivitas, Dompet, Perubahan, Saldo Sebelum, Saldo Sesudah, Keterangan
- ✅ Activities are sorted by newest first
- ✅ Timestamps are formatted: "21 Apr 2026 14:30"
- ✅ Currency values are formatted: "Rp 1.000.000"
- ✅ Icons are displayed with correct colors:
  - Green: plus (add), arrow-down (transfer in)
  - Orange: edit (edit)
  - Red: trash (delete), arrow-up (transfer out)
- ✅ Positive changes are green with + sign
- ✅ Negative changes are red with - sign
- ✅ Zero changes show "-" in gray

---

### Test 6: Multiple Activities
**Objective**: Verify activity log handles multiple activities correctly

**Steps**:
1. Perform the following actions in sequence:
   - Add wallet "Test 1" with Rp 1.000.000
   - Add wallet "Test 2" with Rp 2.000.000
   - Edit "Test 1" name to "Test 1 Updated"
   - Transfer Rp 500.000 from "Test 1" to "Test 2"
   - Delete "Test 2"
2. Navigate to Dompet page
3. Check activity log

**Expected Results**:
- ✅ Activity log shows all activities in reverse chronological order
- ✅ Most recent activity is at the top
- ✅ All activities have correct details
- ✅ Transfer shows both entries (in/out)
- ✅ No duplicate or missing entries

---

### Test 7: Migration (Existing Installations Only)
**Objective**: Verify migration adds DompetActivity sheet correctly

**Steps**:
1. Navigate to Settings (Pengaturan)
2. Scroll to "Migrasi Database" section
3. Click "Jalankan Migrasi" button
4. Wait for response

**Expected Results**:
- ✅ Success toast appears: "Sheet DompetActivity berhasil ditambahkan" or "Sheet DompetActivity sudah ada"
- ✅ Button returns to normal state
- ✅ Open spreadsheet in new tab
- ✅ Verify "DompetActivity" sheet exists
- ✅ Sheet has correct headers: ID, Timestamp, Aktivitas, DompetID, DompetNama, PerubahanSaldo, SaldoSebelum, SaldoSesudah, DompetTerkaitID, DompetTerkaitNama, Keterangan

---

### Test 8: Empty State
**Objective**: Verify activity log handles empty state correctly

**Steps**:
1. Fresh installation or after migration
2. Navigate to Dompet page before creating any wallets
3. Scroll to activity log section

**Expected Results**:
- ✅ Activity log shows: "Belum ada aktivitas"
- ✅ No errors in console
- ✅ Page loads correctly

---

### Test 9: Activity Log Performance
**Objective**: Verify activity log performs well with many activities

**Steps**:
1. Create 10 wallets
2. Perform 20 transfers between wallets
3. Edit 5 wallets
4. Navigate to Dompet page
5. Observe loading time

**Expected Results**:
- ✅ Page loads within 2-3 seconds
- ✅ Activity log displays 50 most recent activities
- ✅ No performance degradation
- ✅ Smooth scrolling

---

### Test 10: Responsive Design
**Objective**: Verify activity log displays correctly on different screen sizes

**Steps**:
1. Navigate to Dompet page
2. Resize browser window to:
   - Desktop (1920x1080)
   - Tablet (768x1024)
   - Mobile (375x667)
3. Observe activity log table

**Expected Results**:
- ✅ Table is horizontally scrollable on small screens
- ✅ All columns are visible
- ✅ Text is readable
- ✅ No layout breaks
- ✅ Icons and colors display correctly

---

## Verification Checklist

After completing all tests, verify:

- [ ] All activity types are logged correctly
- [ ] Activity log displays in correct order (newest first)
- [ ] Timestamps are accurate
- [ ] Currency formatting is correct
- [ ] Colors and icons match activity types
- [ ] Transfer activities show both entries
- [ ] Balance calculations are accurate
- [ ] No console errors
- [ ] Migration works for existing installations
- [ ] Empty state displays correctly
- [ ] Performance is acceptable
- [ ] Responsive design works on all screen sizes

## Common Issues and Solutions

### Issue 1: Activity log not showing
**Solution**: 
- Check if migration was run (for existing installations)
- Verify DompetActivity sheet exists in spreadsheet
- Check browser console for errors
- Refresh the page

### Issue 2: Activities not being logged
**Solution**:
- Verify DompetActivityService is in Code.gs deps
- Check if DOMPET_ACTIVITY_HEADERS is defined in Constants.gs
- Verify DompetService and TransaksiService are calling logActivity()

### Issue 3: Transfer activities missing
**Solution**:
- Verify TransaksiService.saveTransaksi() passes options to updateSaldoDompet()
- Check if DompetService.updateSaldoDompet() accepts options parameter
- Verify wallet names are being fetched correctly

### Issue 4: Formatting issues
**Solution**:
- Verify formatCurrency() function is available
- Check CSS styles are loaded
- Verify icon classes are correct (ti ti-*)

### Issue 5: Migration button not working
**Solution**:
- Verify runMigration() endpoint exists in Code.gs
- Check if MigrationService.gs is deployed
- Verify user is authenticated (token is valid)

## Manual Verification in Spreadsheet

1. Open the Google Spreadsheet
2. Navigate to "DompetActivity" sheet
3. Verify:
   - Headers match DOMPET_ACTIVITY_HEADERS
   - Data is being written correctly
   - Timestamps are in ISO format
   - IDs are unique
   - Balance calculations are correct
   - Related wallet info is populated for transfers

## Automated Testing (Future)

Consider adding automated tests for:
- DompetActivityService.logActivity()
- DompetActivityService.getActivities()
- Activity filtering
- Activity sorting
- Balance calculations
- Transfer activity creation

## Reporting Issues

If you find any issues:
1. Note the exact steps to reproduce
2. Check browser console for errors
3. Verify spreadsheet data
4. Check if migration was run
5. Document expected vs actual behavior
