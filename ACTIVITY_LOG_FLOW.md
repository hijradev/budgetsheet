# Dompet Activity Log - Data Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │  Dompet Page     │         │  Settings Page   │             │
│  │  (dompet.js)     │         │  (pengaturan.js) │             │
│  ├──────────────────┤         ├──────────────────┤             │
│  │ • Wallet Grid    │         │ • Migration Btn  │             │
│  │ • Activity Log   │         │ • Run Migration  │             │
│  │ • Add/Edit/Del   │         └────────┬─────────┘             │
│  └────────┬─────────┘                  │                        │
│           │                            │                        │
└───────────┼────────────────────────────┼────────────────────────┘
            │                            │
            │ API Calls                  │ runMigration()
            │                            │
┌───────────▼────────────────────────────▼────────────────────────┐
│                         BACKEND (Code.gs)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  getDompet()          saveDompet()         deleteDompet()       │
│  getDompetActivity()  saveTransaksi()      runMigration()       │
│                                                                   │
└───────────┬─────────────────────────────────────────────────────┘
            │
            │ Dependency Injection
            │
┌───────────▼─────────────────────────────────────────────────────┐
│                         SERVICES LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │ DompetService    │    │ TransaksiService │                  │
│  ├──────────────────┤    ├──────────────────┤                  │
│  │ • getDompet()    │    │ • saveTransaksi()│                  │
│  │ • saveDompet()   │───▶│ • hitungDelta()  │                  │
│  │ • deleteDompet() │    │ • updateSaldo()  │                  │
│  │ • updateSaldo()  │    └──────────────────┘                  │
│  └────────┬─────────┘                                            │
│           │                                                      │
│           │ Logs Activities                                     │
│           │                                                      │
│  ┌────────▼─────────┐    ┌──────────────────┐                  │
│  │DompetActivity    │    │ MigrationService │                  │
│  │Service           │    ├──────────────────┤                  │
│  ├──────────────────┤    │ • migrate        │                  │
│  │ • logActivity()  │    │   DompetActivity │                  │
│  │ • getActivities()│    └──────────────────┘                  │
│  └────────┬─────────┘                                            │
│           │                                                      │
└───────────┼──────────────────────────────────────────────────────┘
            │
            │ Read/Write
            │
┌───────────▼─────────────────────────────────────────────────────┐
│                    GOOGLE SPREADSHEET                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐      │
│  │ Dompet Sheet │  │ Transaksi    │  │ DompetActivity   │      │
│  │              │  │ Sheet        │  │ Sheet (NEW)      │      │
│  ├──────────────┤  ├──────────────┤  ├──────────────────┤      │
│  │ ID           │  │ ID           │  │ ID               │      │
│  │ Nama         │  │ Tanggal      │  │ Timestamp        │      │
│  │ SaldoAwal    │  │ Jenis        │  │ Aktivitas        │      │
│  │ SaldoSaatIni │  │ Jumlah       │  │ DompetID         │      │
│  │ Ikon         │  │ DompetAsalID │  │ DompetNama       │      │
│  │ Warna        │  │ DompetTujuan │  │ PerubahanSaldo   │      │
│  │ TanggalDibuat│  │ ...          │  │ SaldoSebelum     │      │
│  └──────────────┘  └──────────────┘  │ SaldoSesudah     │      │
│                                       │ DompetTerkaitID  │      │
│                                       │ DompetTerkaitNama│      │
│                                       │ Keterangan       │      │
│                                       └──────────────────┘      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Activity Logging Flow

### 1. Add Wallet Flow
```
User clicks "Tambah Dompet"
    ↓
Frontend: _dompetSubmit()
    ↓
Backend: saveDompet(data)
    ↓
DompetService.saveDompet()
    ├─ Create wallet in Dompet sheet
    └─ DompetActivityService.logActivity()
        └─ Write to DompetActivity sheet
            • Aktivitas: "Tambah Dompet"
            • PerubahanSaldo: +saldoAwal
            • SaldoSebelum: 0
            • SaldoSesudah: saldoAwal
    ↓
Frontend: Refresh wallet grid + activity log
```

### 2. Edit Wallet Flow
```
User clicks "Edit" → modifies name/icon/color
    ↓
Frontend: _dompetSubmit(id)
    ↓
Backend: saveDompet(data with id)
    ↓
DompetService.saveDompet()
    ├─ Update wallet in Dompet sheet
    └─ DompetActivityService.logActivity()
        └─ Write to DompetActivity sheet
            • Aktivitas: "Edit Dompet"
            • Keterangan: "Nama diubah dari X"
            • No balance change
    ↓
Frontend: Refresh wallet grid + activity log
```

### 3. Delete Wallet Flow
```
User clicks "Hapus" → confirms
    ↓
Frontend: _dompetDelete(id)
    ↓
Backend: deleteDompet(id)
    ↓
DompetService.deleteDompet()
    ├─ Check for transactions (prevent if exists)
    ├─ DompetActivityService.logActivity()
    │   └─ Write to DompetActivity sheet
    │       • Aktivitas: "Hapus Dompet"
    │       • PerubahanSaldo: -saldoSaatIni
    │       • SaldoSebelum: saldoSaatIni
    │       • SaldoSesudah: 0
    └─ Delete wallet from Dompet sheet
    ↓
Frontend: Refresh wallet grid + activity log
```

### 4. Transfer Flow
```
User creates transfer transaction
    ↓
Frontend: Submit transfer form
    ↓
Backend: saveTransaksi(data)
    ↓
TransaksiService.saveTransaksi()
    ├─ Save transaction to Transaksi sheet
    └─ For each wallet (source & destination):
        DompetService.updateSaldoDompet(id, delta, options)
            ├─ Update balance in Dompet sheet
            └─ DompetActivityService.logActivity()
                └─ Write TWO activities:
                    
                    Activity 1 (Source Wallet):
                    • Aktivitas: "Transfer Keluar"
                    • PerubahanSaldo: -amount
                    • DompetTerkaitID: destination
                    • Keterangan: "Transfer ke [Dest]"
                    
                    Activity 2 (Destination Wallet):
                    • Aktivitas: "Transfer Masuk"
                    • PerubahanSaldo: +amount
                    • DompetTerkaitID: source
                    • Keterangan: "Transfer dari [Source]"
    ↓
Frontend: Refresh transaction list + wallet balances
```

## Activity Log Display Flow

```
User navigates to Dompet page
    ↓
Frontend: renderDompet()
    ├─ Fetch wallets: getDompet()
    └─ Fetch activities: getDompetActivity({ limit: 50 })
    ↓
Backend: getDompetActivity(filter)
    ↓
DompetActivityService.getActivities()
    ├─ Read DompetActivity sheet
    ├─ Filter by dompetId (if specified)
    ├─ Sort by timestamp (newest first)
    └─ Limit to 50 results
    ↓
Frontend: _dompetRenderActivityLog()
    ├─ Build HTML table
    ├─ Color-code activities
    ├─ Format timestamps
    ├─ Format currency
    └─ Display in activity log section
```

## Migration Flow (Existing Installations)

```
User clicks "Jalankan Migrasi" in Settings
    ↓
Frontend: _runMigration()
    ↓
Backend: runMigration(token)
    ↓
MigrationService.migrateDompetActivity()
    ├─ Check if DompetActivity sheet exists
    ├─ If not exists:
    │   ├─ Create new sheet
    │   └─ Add headers
    └─ Return success message
    ↓
Frontend: Show success toast
```

## Data Relationships

```
┌─────────────┐
│   Dompet    │
│   (Wallet)  │
└──────┬──────┘
       │
       │ 1:N
       │
       ▼
┌─────────────────┐
│ DompetActivity  │
│ (Activity Log)  │
└─────────────────┘
       ▲
       │
       │ References
       │
┌──────┴──────┐
│  Transaksi  │
│(Transaction)│
└─────────────┘
```

## Key Design Decisions

1. **Automatic Logging**: Activities are logged automatically by services, not manually by controllers
2. **Immutable Log**: Activities are append-only, never updated or deleted
3. **Denormalized Data**: Wallet names are stored in activities for historical accuracy
4. **Transfer Pairs**: Transfers create two activities for complete audit trail
5. **Timestamp Precision**: ISO format with milliseconds for accurate ordering
6. **Limit by Default**: Default 50 activities to prevent performance issues
7. **Backward Compatible**: Migration adds sheet without affecting existing data
