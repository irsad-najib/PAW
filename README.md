# Aplikasi Web Katering Bu Lala

## 1. Deskripsi Aplikasi

Aplikasi ini adalah solusi digital untuk memodernisasi operasional katering “Bu Lala”. Pelanggan dapat:

- Melihat daftar menu harian/mingguan lengkap dengan harga & ketersediaan.
- Melakukan pemesanan untuk satu atau beberapa hari dalam satu transaksi (multi-day order).
- Menambahkan catatan khusus per item.
- Memilih metode pengambilan: Ambil sendiri (pickup) atau Pengantaran (delivery).
- Menerima konfirmasi otomatis via WhatsApp setelah pembayaran/pemesanan.

Dari sisi admin (Bu Lala):

- Mengelola menu (CRUD) dan stok harian dengan cepat.
- Menandai hari libur (planned / mendadak) agar pelanggan tidak bisa memesan pada tanggal tersebut.
- Melihat daftar pesanan beserta catatan khusus dan status pembayaran/pengantaran.
- Memverifikasi pembayaran (tunai & Midtrans) dan status pengantaran.
- Mendukung autentikasi Google OAuth untuk kemudahan login.

## 2. Anggota Kelompok

| No  | Nama                           | NIM                |
| --- | ------------------------------ | ------------------ |
| 1   | Irsad Najib Eka Putra          | 23/518119/TK/57005 |
| 2   | Fadel Aulia Naldi              | 23/519144/TK/57236 |
| 3   | Bernards Widiyazulfathirrochim | 23/512647/TK/56341 |
| 4   | Aurellya Ratna Dewanti         | 23/517176/TK/56870 |
| 5   | Hammam Priyandono              | 23/521232/TK/57494 |

## 3. Struktur Folder & File

```
PAW/
├── Backend/
│   ├── server.js
│   ├── package.json
│   └── src/
│       ├── config/
│       │   ├── db.js          # Koneksi MongoDB
│       │   ├── midtrans.js    # Inisialisasi Midtrans Snap
│       │   ├── passport.js    # Strategy Google OAuth
│       │   └── swagger.js     # Konfigurasi Swagger (API Docs)
│       ├── controller/
│       │   └── payment.controller.js
│       ├── middleware/
│       │   └── JWT.js         # Middleware verifikasi JWT
│       ├── models/
│       │   ├── holiday.model.js
│       │   ├── menu.model.js
│       │   ├── order.model.js
│       │   └── user.model.js
│       ├── routes/
│       |   ├── holiday.routes.js
│       |   ├── menu.routes.js
│       |   ├── notification.routes.js
│       |   ├── order.routes.js
│       |   ├── payment.routes.js
│       |   └── user.routes.js
│       └── test/
│           ├── cleanup-db.js
│           ├── generate-test-data-midtrans.js
│           └── test-midtrans.js
├── frontend/
└── README.md
```

## 4. Teknologi yang Digunakan

### Backend

- Runtime: Node.js
- Framework: Express.js (v5.x)
- Database: MongoDB (Mongoose ODM)
- Autentikasi: JWT, Google OAuth 2.0 (passport-google-oauth20)
- Pembayaran: Midtrans Snap API
- Dokumentasi API: Postman & Swagger (swagger-jsdoc + swagger-ui-express)
- Keamanan & Utilitas: bcryptjs, cors, cookie-parser, dotenv
- Lainnya: axios, nodemon (dev)

## 5. Environment Variables (Backend)

Buat file `.env` di folder `Backend/` dengan variabel berikut:

```
PORT=5000
MongoURI=mongodb+srv://<user>:<password>@cluster/<dbName>
JWT_SECRET=your_jwt_secret
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
googleClientID=your_google_oauth_client_id
googleClientSecret=your_google_oauth_client_secret
```

## 6. Cara Menjalankan Proyek

### 6.1 Backend

```bash
cd Backend
npm install   # atau yarn
npm run dev   # jalankan dalam mode development (nodemon)
# atau
npm start     # produksi
```

Server berjalan di: `http://localhost:5000`

## 7. Dokumentasi API (Swagger)

Setelah backend berjalan, akses:

```
http://localhost:5000/api-docs
```

Swagger mencakup endpoint: autentikasi (register/login/Google OAuth), user profile, menu, order, payment, holiday, dan notifikasi.

## 8. Endpoint Autentikasi (Contoh Ringkas)

| Method | Endpoint                  | Deskripsi                        |
| ------ | ------------------------- | -------------------------------- |
| POST   | /api/user/register        | Register user baru               |
| POST   | /api/user/login           | Login dan mendapatkan JWT        |
| GET    | /api/user/me              | Profil user (butuh Bearer Token) |
| GET    | /api/user/google          | Redirect Google OAuth            |
| GET    | /api/user/google/callback | Callback OAuth Google            |

Endpoint lain (menu, order, payment, holiday) dapat dilihat di Swagger UI.

## 9. Link Laporan (Google Drive)
https://drive.google.com/drive/folders/1n6JWPrD3h9vLz-0bWRTrdK1rlMacNbwB?usp=sharing
