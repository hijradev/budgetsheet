# Dompet Activity Log Feature

## Overview
The Dompet Activity Log feature provides a comprehensive audit trail of all wallet-related activities in BudgetSheet. This feature automatically tracks and displays all changes made to wallets, including creation, editing, deletion, and transfers.

## Features

### Tracked Activities
1. **Tambah Dompet** (Add Wallet) - When a new wallet is created
2. **Edit Dompet** (Edit Wallet) - When wallet details are modified
3. **Hapus Dompet** (Delete Wallet) - When a wallet is deleted
4. **Transfer Masuk** (Incoming Transfer) - When money is transferred into a wallet
5. **Transfer Keluar** (Outgoing Transfer) - When money is transferred out of a wallet

### Activity Log Columns
- **Waktu** (Time) - Date and time when the activity occurred
- **Aktivitas** (Activity) - Type of activity with color-coded icon
- **Dompet** (Wallet) - Name of the affected wallet
- **Perubahan** (Change) - Amount of balance change (with +/- indicator)
- **Saldo Sebelum** (Balance Before) - Balance before the activity
- **Saldo Sesudah** (Balance After) - Balance after the activity
- **Keterangan** (Description) - Additional details about the activity

### Visual Design
- Color-coded activities:
  - Green: Add wallet, incoming transfers
  - Orange: Edit wallet
  - Red: Delete wallet, outgoing transfers
  - Blue: General wallet operations
- Icons for quick visual identification
- Responsive table layout
- Most recent activities displayed first

## Implementation

### Backend Components

#### 1. DompetActivityService.gs
New service that handles activity logging:
- `logActivity(data, deps)` - Records a new activity
- `getActivities(filter, deps)` - Retrieves activities with optional filtering

#### 2. Updated Services
- **DompetService.gs** - Now logs activities for add, edit, and delete operations
- **TransaksiService.gs** - Logs transfer activities when transfers are created
- **Constants.gs** - Added DOMPET_ACTIVITY_HEADERS and DOMPET_ACTIVITY_IDX
- **SetupService.gs** - Includes DompetActivity sheet in initial setup
- **Code.gs** - Added getDompetActivity endpoint and DompetActivityService to deps

#### 3. MigrationService.gs
Helper service for existing installations:
- `migrateDompetActivity()` - Adds DompetActivity sheet to existing spreadsheets

### Frontend Components

#### 1. Updated Dompet Page (frontend/pages/dompet.js)
- Added activity log section below wallet grid
- `_dompetRenderActivityLog()` - Renders the activity table
- Fetches and displays up to 50 most recent activities
- Color-coded activity types with icons

#### 2. Updated Settings Page (frontend/pages/pengaturan.js)
- Added migration button to run database migration
- `_runMigration()` - Executes migration for existing users

### Database Schema

#### DompetActivity Sheet
Columns:
1. ID - Unique activity identifier
2. Timestamp - ISO timestamp of the activity
3. Aktivitas - Activity type
4. DompetID - ID of the affected wallet
5. DompetNama - Name of the affected wallet
6. PerubahanSaldo - Balance change amount
7. SaldoSebelum - Balance before activity
8. SaldoSesudah - Balance after activity
9. DompetTerkaitID - Related wallet ID (for transfers)
10. DompetTerkaitNama - Related wallet name (for transfers)
11. Keterangan - Additional notes/description

## Installation

### For New Installations
The DompetActivity sheet will be automatically created during initial setup. No additional steps required.

### For Existing Installations
1. Deploy the updated code to your Google Apps Script project
2. Open the app and navigate to Settings (Pengaturan)
3. Click "Jalankan Migrasi" (Run Migration) button
4. The DompetActivity sheet will be added to your spreadsheet
5. Navigate to the Dompet page to see the activity log

## Usage

### Viewing Activity Log
1. Navigate to the Dompet (Wallets) page
2. Scroll down below the wallet cards
3. The activity log table shows all recent activities
4. Activities are sorted by most recent first

### Activity Details
Each activity entry shows:
- When it happened
- What type of activity it was
- Which wallet was affected
- How the balance changed
- What the balance was before and after
- Additional context (e.g., transfer source/destination)

## Benefits

1. **Audit Trail** - Complete history of all wallet changes
2. **Transparency** - See exactly when and how balances changed
3. **Troubleshooting** - Quickly identify when issues occurred
4. **Transfer Tracking** - Easily see money movements between wallets
5. **Accountability** - Know what actions were performed and when

## Technical Notes

- Activities are stored in the DompetActivity sheet
- Default limit is 50 most recent activities
- Activities are read in reverse order (newest first)
- Transfer activities create two log entries (one for each wallet)
- Activity logging is automatic and requires no user intervention
- The feature is backward compatible with existing data

## Future Enhancements

Potential improvements for future versions:
- Filter activities by date range
- Filter activities by wallet
- Filter activities by activity type
- Export activity log to CSV
- Pagination for large activity logs
- Search functionality
- Activity statistics and charts
