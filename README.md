# Sistem Manajemen Bengkel AutoService

Aplikasi manajemen bengkel berbasis web untuk mengelola permintaan servis, antrean pekerjaan mekanik, dan data kendaraan pelanggan.

## Fitur Utama

### Manajemen Peran
- **Superadmin/Admin**: kelola permintaan servis, penugasan mekanik, data pelanggan, dan kendaraan.
- **Mekanik**: melihat antrean servis, memperbarui status pekerjaan, dan mencatat biaya akhir.
- **Pelanggan**: membuat permintaan servis, memantau status, serta mengelola kendaraan.

### Fitur Inti
- Dashboard ringkas per peran
- Permintaan servis lengkap dengan riwayat status
- Penugasan mekanik dan pembaruan pekerjaan
- Manajemen kendaraan pelanggan

## Teknologi
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Express + MySQL
- **Routing**: React Router v6
- **State Management**: React Context API

## Persiapan
Pastikan sudah terpasang:
- Node.js 16+
- MySQL 8+

## Instalasi & Menjalankan

1. Install dependencies frontend (root):
```bash
npm install
```

2. Siapkan konfigurasi frontend (buat file lokal dari template):
```bash
cp .env.example .env
```

3. Siapkan API:
```bash
cd api
npm install
cp .env.example .env
```

4. Impor skema database:
```bash
mysql -u root -p < database/schema.sql
```

5. Jalankan API:
```bash
npm run dev
```

6. Jalankan frontend (dari root repo):
```bash
npm run dev
```

7. Build untuk produksi:
```bash
npm run build
```

> Catatan: file `.env` hanya untuk kebutuhan lokal dan tidak disimpan di repo. Gunakan `.env.example` sebagai template.

## Akun Default

- **Superadmin**
  - Email: `superadmin@gmail.com`
  - Password: `superadmin`
- **Admin**
  - Email: `admin@gmail.com`
  - Password: `admin`
- **Mekanik**
  - Email: `mekanik@gmail.com`
  - Password: `mekanik`

Pelanggan dapat membuat akun melalui halaman registrasi.

## Struktur Proyek

```
src/
├── components/
├── contexts/
├── lib/
└── pages/
api/
├── src/
└── .env.example

database/
└── schema.sql
```
