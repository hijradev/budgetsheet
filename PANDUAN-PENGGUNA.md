# BudgetSheet

# Panduan Pengguna Lengkap

**Pelacak Keuangan Pribadi di Google Sheets**

**Versi 1.0.0**

---

## Daftar Isi

1. Pendahuluan
2. Mengapa BudgetSheet?
3. Persyaratan Sistem
4. Panduan Instalasi
5. Pengaturan Pertama Kali
6. Masuk ke Aplikasi
7. Gambaran Umum Aplikasi
8. Dashboard
9. Transaksi
10. Manajemen Dompet
11. Manajemen Kategori
12. Manajemen Anggaran
13. Langganan (Tagihan Berulang)
14. Laporan Keuangan
15. Pengaturan
16. Fitur Keamanan
17. Manajemen Data
18. Tips & Praktik Terbaik
19. Pertanyaan yang Sering Diajukan

---

## 1. Pendahuluan

BudgetSheet adalah aplikasi pelacak keuangan pribadi yang dibangun di atas Google Apps Script dan Google Sheets. Aplikasi ini berjalan sepenuhnya di dalam akun Google Anda — tanpa server eksternal, tanpa langganan pihak ketiga, dan tanpa data yang keluar dari Google Drive Anda sendiri.

Dirancang untuk individu yang ingin mengelola keuangan pribadi dengan mudah, BudgetSheet menyediakan fitur pencatatan transaksi, manajemen multi-dompet, pengaturan anggaran per kategori, pelacakan tagihan berulang, dan laporan keuangan visual — semuanya dengan antarmuka yang modern, ringan, dan responsif.

---

## 2. Mengapa BudgetSheet?

### Data Anda, Drive Anda

Semua data keuangan disimpan di Google Spreadsheet di dalam Google Drive Anda sendiri. Tidak ada perusahaan pihak ketiga yang menyimpan informasi Anda. Anda memilikinya sepenuhnya dan dapat mengakses data mentah langsung di Google Sheets kapan saja.

### Tanpa Biaya Bulanan

BudgetSheet adalah pembelian satu kali. Tidak ada biaya langganan berulang dan tidak ada fitur yang dikunci di balik paywall.

### Dibangun di Atas Infrastruktur Google

Karena BudgetSheet berjalan di Google Apps Script, aplikasi ini memanfaatkan keandalan dan keamanan Google. Data Anda didukung oleh infrastruktur yang sama yang menggerakkan Gmail dan Google Drive.

### Multi-Dompet

Kelola beberapa sumber dana sekaligus — rekening bank, dompet digital, uang tunai — dalam satu tampilan terpadu dengan saldo real-time.

### Anggaran & Peringatan

Tetapkan batas pengeluaran per kategori dan dapatkan indikator visual otomatis saat anggaran mendekati atau melampaui batas.

### Desain Glassmorphism

Antarmuka modern dengan efek frosted glass, gradien pastel lembut, dan tata letak responsif yang nyaman digunakan di desktop maupun ponsel.

---

## 3. Persyaratan Sistem

- Akun Google (Gmail atau Google Workspace)
- Browser web modern (Chrome, Firefox, Edge, atau Safari)
- Koneksi internet
- Hanya untuk instalasi: Node.js dan npm (opsional — instalasi manual juga didukung)

---

## 4. Panduan Instalasi

BudgetSheet di-deploy sebagai Google Apps Script Web App. Ada dua metode instalasi.

### Metode A — Menggunakan clasp (Command Line)

**Langkah 1: Instal Prasyarat**

```
npm install -g @google/clasp
```

**Langkah 2: Clone Repository**

```
git clone <repository-url>
cd budgetsheet
```

**Langkah 3: Masuk ke Google**

```
clasp login
```

**Langkah 4: Buat Proyek Apps Script**

```
clasp create --type standalone --title "BudgetSheet"
```

**Langkah 5: Build dan Push Kode**

```
npm run deploy
```

Perintah ini menjalankan build (menggabungkan file frontend ke dalam satu HTML) lalu mendorong semua file ke Apps Script.

**Langkah 6: Deploy sebagai Web App**

```
clasp deploy --description "Initial Deployment"
```

Salin URL Web App yang ditampilkan — ini adalah alamat aplikasi BudgetSheet Anda.

### Metode B — Instalasi Manual (Tanpa Command Line)

**Langkah 1:** Buka [script.google.com](https://script.google.com/) dan klik **New project**.

**Langkah 2:** Salin isi setiap file `.gs` dari repository ke file yang sesuai di editor Apps Script. File yang perlu disalin:
- `Code.gs`, `AuthService.gs`, `CacheService.gs`, `Constants.gs`
- `TransaksiService.gs`, `DompetService.gs`, `KategoriService.gs`
- `AnggaranService.gs`, `LanggananService.gs`, `LaporanService.gs`
- `DompetActivityService.gs`, `MigrationService.gs`
- `SetupService.gs`, `SpreadsheetHelper.gs`, `Validator.gs`

**Langkah 3:** Salin isi `appsscript.json` ke manifes proyek (aktifkan pengeditan manifes melalui Project Settings).

**Langkah 4:** Buat file `Index.html` dan tempel isi dari folder `dist/` (hasil build), atau jalankan `npm run build` secara lokal terlebih dahulu untuk menghasilkan file tersebut.

**Langkah 5:** Klik **Deploy > New deployment**, pilih tipe **Web app**, atur:
- **Execute as**: Me
- **Who has access**: Anyone

Klik **Deploy** dan salin URL Web App yang muncul.

---

## 5. Pengaturan Pertama Kali

Pertama kali Anda mengunjungi URL Web App BudgetSheet, aplikasi mendeteksi bahwa belum dikonfigurasi dan secara otomatis menampilkan **Halaman Setup**.

### Yang Dilakukan Setup Secara Otomatis

- Membuat Google Spreadsheet baru bernama **BudgetSheet** sebagai database
- Menginisialisasi semua sheet yang diperlukan: Transaksi, Dompet, Kategori, Anggaran, Langganan, DompetActivity
- Membuat folder **BudgetSheet Attachments** di Google Drive untuk menyimpan lampiran transaksi
- Menyimpan ID Spreadsheet dan ID folder Drive ke PropertiesService

### Menjalankan Setup

1. Buka URL Web App BudgetSheet di browser.
2. Halaman Setup akan muncul secara otomatis.
3. Klik tombol **Mulai Instalasi Otomatis**.
4. Tunggu hingga proses selesai. Jangan tutup halaman selama proses berlangsung.
5. Setelah selesai, Anda akan diarahkan ke halaman login.

### Kredensial Login Default

Setelah setup, gunakan kredensial ini untuk masuk pertama kali:

- **Password:** `admin123`

**Penting:** Segera ubah password Anda setelah login pertama. Buka **Pengaturan > Ubah Password** dan atur password yang kuat.

---

## 6. Masuk ke Aplikasi

BudgetSheet menggunakan sistem autentikasi berbasis sesi yang aman dengan satu akun pengguna.

### Proses Login

1. Buka URL Web App BudgetSheet Anda.
2. Masukkan password Anda.
3. Klik **Masuk**.

### Manajemen Sesi

- Sesi Anda tetap aktif hingga **6 jam**. Setelah itu, Anda akan diminta login kembali.
- Token sesi disimpan di session storage browser dan otomatis dihapus saat tab ditutup.

### Keamanan Login

- Setelah **5 percobaan login gagal berturut-turut**, akun dikunci selama **15 menit** untuk mencegah serangan brute-force.
- Semua percobaan login dicatat di sheet AuditLog.

### Keluar dari Aplikasi

Klik tombol **Logout** di sidebar atau di halaman Pengaturan untuk mengakhiri sesi.

---

## 7. Gambaran Umum Aplikasi

Setelah masuk, Anda akan melihat antarmuka SPA (Single Page Application) dengan dua area utama.

### Navigasi Sidebar

Sidebar kiri berisi tautan ke semua halaman aplikasi:

| Item Menu | Deskripsi |
|---|---|
| Dashboard | Ringkasan keuangan dan grafik |
| Transaksi | Daftar dan pencatatan transaksi |
| Dompet | Manajemen dompet/rekening |
| Kategori | Kelola kategori transaksi |
| Anggaran | Atur dan pantau anggaran |
| Langganan | Kelola tagihan berulang |
| Laporan | Analisis keuangan dan grafik |
| Pengaturan | Konfigurasi aplikasi |
| Logout | Akhiri sesi |

### Area Konten Utama

Sisi kanan layar menampilkan halaman yang sedang dipilih. Semua halaman dimuat tanpa refresh browser penuh menggunakan hash-based routing (`#/dashboard`, `#/transaksi`, dst.).

### Navigasi Cepat

Di halaman Dashboard terdapat tombol pintasan untuk langsung membuka form tambah transaksi tanpa harus berpindah halaman terlebih dahulu.

---

## 8. Dashboard

Dashboard adalah halaman beranda BudgetSheet yang memberikan gambaran instan kondisi keuangan Anda.

### Kartu Statistik

Empat kartu ringkasan muncul di bagian atas Dashboard:

- **Pemasukan Bulan Ini** — Total pemasukan pada bulan berjalan
- **Pengeluaran Bulan Ini** — Total pengeluaran pada bulan berjalan
- **Total Anggaran** — Jumlah anggaran yang telah ditetapkan
- **Anggaran Terpakai** — Total pengeluaran dibandingkan anggaran

### Ringkasan Keuangan

Panel ringkasan menampilkan:
- **Total Saldo** — Gabungan saldo semua dompet aktif
- **Jumlah Dompet** — Berapa dompet yang terdaftar
- **Anggaran Tersedia** — Sisa anggaran yang belum terpakai, ditampilkan dengan progress bar

### Grafik Pengeluaran Mingguan

Grafik batang menampilkan perbandingan pemasukan dan pengeluaran per minggu selama 4 minggu terakhir. Grafik ini membantu Anda melihat tren keuangan dari waktu ke waktu.

### Transaksi Terbaru

Tabel menampilkan 6 transaksi terakhir dengan kolom: Tanggal, Jenis, Kategori, Dompet, Jumlah, dan Catatan. Klik **Lihat Semua** untuk menuju halaman Transaksi lengkap.

### Langganan Jatuh Tempo

Tabel menampilkan semua langganan yang jatuh tempo dalam **7 hari ke depan**. Baris dengan jatuh tempo ≤ 3 hari ditandai dengan warna kuning sebagai peringatan.

---

## 9. Transaksi

Halaman Transaksi adalah pusat pencatatan semua aktivitas keuangan Anda.

### Jenis Transaksi

BudgetSheet mendukung tiga jenis transaksi:

- **Pemasukan** — Uang masuk ke dompet (gaji, freelance, dll.)
- **Pengeluaran** — Uang keluar dari dompet (makan, transportasi, dll.)
- **Transfer** — Perpindahan dana antar dompet (top-up e-wallet, ambil tunai, dll.)

### Melihat Daftar Transaksi

Transaksi ditampilkan dalam tabel dengan kolom: Tanggal, Jenis, Kategori, Dompet, Jumlah, Catatan, dan Aksi. Tabel menampilkan **15 transaksi per halaman** dengan tombol **Muat Lebih** untuk memuat data berikutnya.

### Filter Transaksi

Gunakan panel filter di atas tabel untuk mempersempit daftar:

- **Cari** — Pencarian teks bebas berdasarkan catatan, kategori, atau dompet
- **Dari Tanggal / Sampai Tanggal** — Filter berdasarkan rentang tanggal
- **Kategori** — Filter berdasarkan kategori tertentu
- **Dompet** — Filter berdasarkan dompet tertentu
- **Jenis** — Filter berdasarkan Pemasukan, Pengeluaran, atau Transfer

Klik tombol **Filter** untuk menerapkan filter yang dipilih.

### Menambah Transaksi Baru

Klik tombol **Tambah Transaksi** di pojok kanan atas untuk membuka form. Isi kolom berikut:

- **Tanggal** _(wajib)_ — Tanggal transaksi
- **Jenis** _(wajib)_ — Pemasukan, Pengeluaran, atau Transfer
- **Jumlah** _(wajib)_ — Nominal transaksi dalam Rupiah (angka tanpa pemisah)
- **Kategori** — Kategori transaksi
- **Dompet Asal** _(wajib)_ — Dompet sumber dana
- **Dompet Tujuan** _(wajib untuk Transfer)_ — Dompet penerima dana
- **Catatan** — Keterangan tambahan

Klik **Simpan** untuk menyimpan transaksi. Saldo dompet terkait akan diperbarui secara otomatis.

### Mengedit Transaksi

Klik ikon pensil di baris transaksi, atau klik langsung pada baris tersebut, untuk membuka form edit. Lakukan perubahan dan klik **Simpan**. Saldo dompet akan disesuaikan secara otomatis berdasarkan selisih nilai lama dan baru.

### Menghapus Transaksi

Klik ikon tempat sampah di baris transaksi. Dialog konfirmasi akan muncul sebelum transaksi dihapus. Penghapusan akan membalikkan efek transaksi pada saldo dompet terkait.

### Efek Transaksi pada Saldo Dompet

| Jenis | Efek pada Dompet |
|---|---|
| Pemasukan | Saldo dompet asal **bertambah** |
| Pengeluaran | Saldo dompet asal **berkurang** |
| Transfer | Saldo dompet asal **berkurang**, saldo dompet tujuan **bertambah** |

---

## 10. Manajemen Dompet

Dompet mewakili sumber dana Anda — rekening bank, dompet digital, uang tunai, dan lainnya.

### Melihat Daftar Dompet

Halaman Dompet menampilkan semua dompet dalam tampilan kartu dengan informasi: nama, ikon, warna, saldo awal, dan saldo saat ini.

### Menambah Dompet Baru

Klik **Tambah Dompet** dan isi:

- **Nama** _(wajib)_ — Nama dompet (contoh: BCA, GoPay, Tunai)
- **Saldo Awal** — Saldo awal saat dompet dibuat. Saldo saat ini akan diset sama dengan saldo awal.
- **Ikon** — Pilih ikon Tabler untuk representasi visual
- **Warna** — Pilih warna identifikasi dompet

### Mengedit Dompet

Klik ikon edit pada kartu dompet untuk mengubah nama, ikon, atau warna. Perubahan ini tidak mempengaruhi saldo yang sudah ada.

### Menghapus Dompet

Klik ikon hapus pada kartu dompet. Jika dompet masih memiliki transaksi terkait, penghapusan akan ditolak dan pesan error akan ditampilkan.

### Log Aktivitas Dompet

Di bagian bawah halaman Dompet terdapat tabel **Log Aktivitas** yang mencatat semua perubahan saldo dompet secara otomatis:

| Aktivitas | Deskripsi |
|---|---|
| Tambah Dompet | Dompet baru dibuat |
| Edit Dompet | Detail dompet diubah |
| Hapus Dompet | Dompet dihapus |
| Transfer Masuk | Dana masuk dari transfer |
| Transfer Keluar | Dana keluar karena transfer |

Setiap entri log mencatat: waktu, jenis aktivitas, nama dompet, perubahan saldo, saldo sebelum, saldo sesudah, dan keterangan.

---

## 11. Manajemen Kategori

Kategori membantu Anda mengklasifikasikan transaksi secara visual dan terstruktur.

### Melihat Daftar Kategori

Halaman Kategori menampilkan semua kategori dalam tampilan grid dengan ikon, warna, nama, dan jenis (Pemasukan / Pengeluaran / Keduanya).

### Menambah Kategori

Klik **Tambah Kategori** dan isi:

- **Nama** _(wajib)_ — Nama kategori
- **Jenis** — Pemasukan, Pengeluaran, atau Keduanya
- **Ikon** — Pilih dari koleksi ikon Tabler
- **Warna** — Pilih warna identifikasi kategori

### Mengedit Kategori

Klik ikon edit pada kartu kategori untuk mengubah atributnya. Perubahan nama kategori tidak mempengaruhi transaksi yang sudah ada.

### Menghapus Kategori

Klik ikon hapus. Jika kategori masih digunakan oleh transaksi aktif, penghapusan akan ditolak.

### Kategori dan Anggaran

Kategori yang sudah memiliki anggaran akan menampilkan progress bar yang membandingkan total pengeluaran aktual dengan batas anggaran yang ditetapkan.

---

## 12. Manajemen Anggaran

Anggaran memungkinkan Anda menetapkan batas pengeluaran per kategori untuk periode tertentu.

### Melihat Daftar Anggaran

Halaman Anggaran menampilkan semua anggaran dalam tampilan kartu dengan informasi: kategori, jumlah anggaran, periode, realisasi pengeluaran, dan progress bar.

### Indikator Visual Anggaran

- **Hijau** — Pengeluaran di bawah 70% dari anggaran
- **Kuning/Oranye** — Pengeluaran antara 70%–90% dari anggaran (peringatan)
- **Merah** — Pengeluaran melebihi 90% atau sudah melampaui anggaran (kritis)

### Menambah Anggaran

Klik **Tambah Anggaran** dan isi:

- **Kategori** _(wajib)_ — Pilih kategori yang ingin dianggarkan
- **Jumlah Anggaran** _(wajib)_ — Batas pengeluaran dalam Rupiah
- **Periode** — Bulanan, Mingguan, atau Tahunan
- **Bulan / Tahun** — Periode berlakunya anggaran

### Mengedit dan Menghapus Anggaran

Gunakan ikon edit atau hapus pada kartu anggaran. Menghapus anggaran tidak menghapus transaksi yang sudah ada.

---

## 13. Langganan (Tagihan Berulang)

Fitur Langganan membantu Anda melacak tagihan rutin seperti Netflix, Spotify, listrik, internet, dan lainnya.

### Melihat Daftar Langganan

Halaman Langganan menampilkan semua langganan dalam tabel dengan kolom: Nama, Jumlah, Kategori, Dompet, Frekuensi, Tanggal Jatuh Tempo, dan Status.

### Status Langganan

- **Aktif** — Langganan berjalan normal
- **Nonaktif** — Langganan dinonaktifkan
- **Jatuh Tempo!** — Tanggal jatuh tempo sudah lewat atau ≤ 3 hari lagi (ditandai kuning)

### Menambah Langganan

Klik **Tambah Langganan** dan isi:

- **Nama** _(wajib)_ — Nama layanan (contoh: Netflix, Listrik PLN)
- **Jumlah** _(wajib)_ — Nominal tagihan
- **Kategori** — Kategori pengeluaran
- **Dompet** — Dompet yang digunakan untuk membayar
- **Frekuensi** — Harian, Mingguan, Bulanan, atau Tahunan
- **Tanggal Jatuh Tempo** — Tanggal pembayaran berikutnya
- **Catatan** — Keterangan tambahan

### Menandai Langganan sebagai Dibayar

Klik tombol **Bayar** pada baris langganan. Sistem akan:
1. Membuat transaksi pengeluaran baru secara otomatis berdasarkan data langganan
2. Memperbarui **Tanggal Jatuh Tempo** ke periode berikutnya sesuai frekuensi
3. Mengurangi saldo dompet terkait

### Mengedit dan Menghapus Langganan

Gunakan ikon edit atau hapus pada baris langganan. Menghapus langganan tidak menghapus transaksi yang sudah dibuat sebelumnya.

---

## 14. Laporan Keuangan

Halaman Laporan menyediakan analisis keuangan berdasarkan periode waktu yang dipilih.

### Filter Periode

Pilih periode laporan:

- **Harian** — Laporan untuk satu hari tertentu
- **Mingguan** — Laporan untuk satu minggu
- **Bulanan** — Laporan untuk satu bulan (default)
- **Tahunan** — Laporan untuk satu tahun penuh
- **Rentang Kustom** — Tentukan tanggal mulai dan akhir secara bebas

### Ringkasan Periode

Laporan menampilkan tiga angka utama untuk periode yang dipilih:
- **Total Pemasukan**
- **Total Pengeluaran**
- **Saldo Bersih** (Pemasukan dikurangi Pengeluaran)

### Grafik Perbandingan

Grafik batang menampilkan perbandingan pemasukan dan pengeluaran per sub-periode (per hari, per minggu, atau per bulan tergantung filter yang dipilih).

### Tabel Pengeluaran per Kategori

Tabel detail menampilkan total pengeluaran per kategori beserta persentasenya terhadap total pengeluaran pada periode tersebut. Ini membantu Anda mengidentifikasi kategori mana yang paling banyak menguras anggaran.

### Perbandingan Anggaran vs Realisasi

Untuk laporan bulanan, tabel tambahan menampilkan perbandingan antara anggaran yang ditetapkan dan pengeluaran aktual per kategori, lengkap dengan indikator visual.

---

## 15. Pengaturan

Halaman Pengaturan memungkinkan Anda mengkonfigurasi preferensi aplikasi.

### Informasi Aplikasi

Menampilkan versi aplikasi (1.0.0) dan nama aplikasi (BudgetSheet). Jika URL Spreadsheet tersedia, terdapat tombol **Buka Spreadsheet** untuk langsung mengakses database di Google Sheets.

### Ubah Password

Perbarui password login Anda:

1. Masukkan password baru di kolom **Password Baru**
2. Ulangi di kolom **Konfirmasi Password**
3. Klik **Simpan Password**

Persyaratan password:
- Minimal 6 karakter

### Informasi Legal

Tautan ke halaman:
- **Tentang** — Informasi versi dan pengembang
- **Lisensi** — Informasi lisensi komersial
- **Kebijakan Privasi** — Cara data Anda ditangani
- **Syarat & Ketentuan** — Ketentuan penggunaan

### Logout

Klik tombol **Logout** di bagian bawah halaman Pengaturan untuk mengakhiri sesi dan menghapus data lokal.

---

## 16. Fitur Keamanan

BudgetSheet dibangun dengan keamanan sebagai prioritas.

### Autentikasi

- Password di-hash menggunakan **SHA-256** sebelum disimpan
- Password asli tidak pernah disimpan di mana pun
- Token sesi dihasilkan dengan UUID acak secara kriptografis

### Keamanan Sesi

- **Durasi sesi:** 6 jam sejak login
- **Tanpa sesi persisten:** Menutup tab browser mengakhiri sesi secara otomatis

### Perlindungan Brute Force

- Maksimal **5 percobaan login gagal** sebelum penguncian akun
- Periode penguncian **15 menit** setelah kegagalan maksimum
- Semua percobaan dicatat di AuditLog

### Keamanan Input

- Semua teks yang dimasukkan pengguna disanitasi sebelum ditulis ke Google Sheets untuk mencegah injeksi formula
- Unggahan file divalidasi untuk tipe dan ukuran sebelum diterima

### Kontrol Akses

- Semua fungsi backend memerlukan token sesi yang valid
- Percobaan akses tanpa token yang valid akan ditolak

---

## 17. Manajemen Data

### Database Google Sheets

Semua data disimpan di Google Spreadsheet di Google Drive Anda. Spreadsheet berisi sheet-sheet berikut:

| Sheet | Isi |
|---|---|
| Transaksi | Semua catatan transaksi |
| Dompet | Data dompet dan saldo |
| Kategori | Definisi kategori |
| Anggaran | Pengaturan anggaran per kategori |
| Langganan | Data tagihan berulang |
| DompetActivity | Log aktivitas perubahan saldo dompet |
| AuditLog | Log autentikasi dan keamanan |

### Lampiran Transaksi

Saat Anda melampirkan gambar ke transaksi, file disimpan di folder **BudgetSheet Attachments** di Google Drive Anda dan ditautkan ke catatan transaksi melalui URL-nya.

Tipe file yang didukung: JPG, JPEG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX

Ukuran file maksimal: **10 MB per lampiran**

### Format ID

Setiap record diberi ID unik saat dibuat menggunakan UUID yang dihasilkan secara otomatis oleh Google Apps Script.

### Ekspor Data

- Buka Spreadsheet langsung dari Google Sheets untuk mengekspor data ke format Excel atau CSV
- Gunakan fitur cetak browser untuk mencetak halaman laporan

### Migrasi

Jika Anda memperbarui BudgetSheet dari versi sebelumnya yang belum memiliki sheet DompetActivity, buka **Pengaturan** dan jalankan **Migrasi** untuk menambahkan sheet tersebut tanpa kehilangan data yang sudah ada.

---

## 18. Tips & Praktik Terbaik

### Buat Dompet Sesuai Rekening Nyata

Buat satu dompet untuk setiap sumber dana yang Anda miliki — rekening bank, dompet digital, uang tunai. Ini membuat saldo di BudgetSheet mencerminkan kondisi keuangan nyata Anda.

### Gunakan Kategori yang Bermakna

Targetkan 5–10 kategori yang mencerminkan pola pengeluaran Anda. Terlalu banyak kategori justru menyulitkan analisis. Kategori yang baik: Makan & Minum, Transportasi, Belanja, Hiburan, Kesehatan, Tagihan.

### Catat Transaksi Segera

Kebiasaan mencatat transaksi segera setelah terjadi jauh lebih akurat daripada mencatat di akhir hari atau akhir bulan dari ingatan.

### Manfaatkan Fitur Transfer

Saat top-up GoPay dari BCA atau ambil uang tunai dari ATM, gunakan jenis transaksi **Transfer** — bukan Pengeluaran. Ini menjaga total saldo tetap akurat karena uang hanya berpindah, tidak berkurang.

### Tetapkan Anggaran di Awal Bulan

Luangkan 5 menit di awal setiap bulan untuk menetapkan anggaran per kategori. Indikator visual di halaman Anggaran dan Kategori akan membantu Anda tetap dalam jalur sepanjang bulan.

### Gunakan Langganan untuk Tagihan Rutin

Daftarkan semua tagihan rutin (Netflix, Spotify, listrik, internet, cicilan) di fitur Langganan. Dashboard akan mengingatkan Anda 3 hari sebelum jatuh tempo sehingga tidak ada yang terlewat.

### Segera Ubah Password Default

Password default `admin123` didokumentasikan secara publik. Ubah ke password yang kuat segera setelah menyelesaikan setup pertama.

### Tinjau Laporan Bulanan

Luangkan waktu di akhir setiap bulan untuk membuka halaman Laporan dan menganalisis pola pengeluaran Anda. Ini membantu Anda membuat keputusan keuangan yang lebih baik di bulan berikutnya.

---

## 19. Pertanyaan yang Sering Diajukan

**T: Bisakah beberapa orang menggunakan BudgetSheet secara bersamaan?**

J: BudgetSheet dirancang sebagai pengelola keuangan pribadi satu pengguna. Aplikasi ini memiliki satu akun dan tidak ditujukan untuk kolaborasi multi-pengguna.

**T: Bisakah saya mengakses BudgetSheet di ponsel?**

J: Ya. BudgetSheet sepenuhnya responsif dan berfungsi di browser mobile. Tata letak menyesuaikan secara otomatis untuk ukuran layar mobile, tablet, dan desktop.

**T: Apa yang terjadi pada data saya jika saya berhenti menggunakan BudgetSheet?**

J: Data Anda tetap ada di Google Drive Anda selamanya. Google Spreadsheet dan folder Drive yang dibuat selama pengaturan adalah milik Anda dan tidak akan dihapus kecuali Anda menghapusnya sendiri.

**T: Bagaimana cara mencadangkan data saya?**

J: Data Anda sudah disimpan di Google Drive, yang menyediakan riwayat versi. Anda juga dapat mengunduh Google Spreadsheet sebagai file Excel kapan saja dari Google Sheets.

**T: Apa yang terjadi jika saya tidak sengaja menghapus transaksi?**

J: Transaksi yang dihapus tidak dapat dipulihkan dari dalam antarmuka BudgetSheet. Namun, Google Sheets menyimpan riwayat versi. Buka spreadsheet yang mendasari di Google Sheets, buka File > Version history > See version history, dan pulihkan versi sebelumnya untuk memulihkan data yang dihapus.

**T: Bisakah saya mengubah mata uang?**

J: Saat ini BudgetSheet menggunakan format Rupiah (Rp) secara default. Untuk versi mendatang, dukungan multi-mata uang dapat ditambahkan.

**T: Apakah password saya disimpan dengan aman?**

J: Password Anda di-hash menggunakan SHA-256 sebelum disimpan di Google Apps Script Properties. Password asli tidak pernah disimpan. Namun, untuk keamanan maksimum, gunakan password yang kuat dan unik yang tidak Anda gunakan di tempat lain.

**T: Bagaimana cara memperbarui BudgetSheet jika versi baru dirilis?**

J: Karena data Anda (Spreadsheet) terpisah dari kode aplikasi (Apps Script), Anda dapat memperbarui kode tanpa kehilangan data. Cukup salin file .gs dan .html versi baru ke file yang sudah ada di editor Apps Script, dan buat deployment baru. Spreadsheet dan folder Drive Anda yang sudah ada akan terus berfungsi dengan mulus.

**T: Apakah ada batasan penggunaan yang harus saya ketahui?**

J: BudgetSheet dibatasi oleh batasan akun Google standar. Untuk penggunaan pribadi, batasan ini sangat besar dan Anda sangat kecil kemungkinannya untuk mencapainya.

**T: Mengapa saldo dompet saya tidak sesuai dengan transaksi?**

J: Pastikan Anda tidak mengedit atau menghapus data langsung di Google Sheets. Selalu gunakan antarmuka BudgetSheet untuk menambah, mengedit, atau menghapus transaksi agar saldo dompet diperbarui secara konsisten.

---

_BudgetSheet — Pelacak Keuangan Pribadi di Google Sheets_  
_Versi 1.0.0_
