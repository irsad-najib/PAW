# Setup dan Fitur Baru

## Fitur yang Sudah Ditambahkan

### 1. Authentication System ✅

- **Login/Register**: Username & password based authentication
- **Google OAuth**: Login dengan akun Google
- **JWT Token**: Token-based authentication dengan auto-refresh
- **Protected Routes**: Route protection untuk halaman yang memerlukan login

### 2. Riwayat Pesanan ✅

- **List Orders**: Halaman untuk melihat semua pesanan user
- **Order Details**: Detail lengkap setiap pesanan
- **Order Status**: Status pesanan (pending, processing, completed, cancelled)
- **Payment Status**: Status pembayaran (pending, paid, unpaid)
- **Pagination**: Navigasi halaman untuk list pesanan

### 3. WhatsApp Notifications ✅

- **Order Created**: Notifikasi otomatis ketika pesanan dibuat
- **Order Ready**: Notifikasi ketika pesanan sudah siap (status: completed)
- **Multi-day Orders**: Support notifikasi untuk pesanan multi-hari
- **User Phone**: User dapat menambahkan nomor WhatsApp di profile

### 4. Profile Management ✅

- **Update Profile**: User dapat update nama dan nomor WhatsApp
- **View Profile**: Lihat informasi profile

## Setup Instructions

### Backend Setup

1. Install dependencies:

```bash
cd Backend
npm install
```

2. Update `.env` file (sudah dikonfigurasi):

```env
FONNTE_TOKEN=XjPNU83VXZfJ7jFoStfT
FRONTEND_URL=http://localhost:3000
ADMIN_EMAIL=admin@katering.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

3. Jalankan server:

```bash
npm start
```

Server akan berjalan di `http://localhost:5000`

### Frontend Setup

1. Install dependencies:

```bash
cd frontend
npm install
```

2. File `.env.local` sudah dibuat dengan konfigurasi:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

3. Jalankan development server:

```bash
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`

## Struktur File Baru

### Frontend

```
src/
├── contexts/
│   └── AuthContext.tsx          # Auth state management
├── components/
│   └── ProtectedRoute.tsx       # Route protection component
├── app/
│   ├── login/
│   │   └── page.tsx            # Login/Register page (updated)
│   ├── orders/
│   │   └── page.tsx            # Order history page (NEW)
│   ├── profile/
│   │   └── page.tsx            # User profile page (NEW)
│   └── auth/
│       └── google/
│           └── callback/
│               └── page.tsx     # Google OAuth callback (NEW)
└── component/
    └── api.tsx                  # API utils with interceptors (updated)
```

### Backend

```
src/
├── models/
│   └── user.model.js           # Updated: added phone field
└── routes/
    ├── user.routes.js          # Updated: added profile endpoint
    └── order.routes.js         # Updated: added WhatsApp notifications
```

## API Endpoints Baru

### User/Auth

- `PUT /api/auth/profile` - Update user profile (name, phone)

### Orders

- `GET /api/orders` - Get user's order history (paginated)
- `GET /api/orders/:id` - Get order details
- `GET /api/orders/group/:groupId` - Get orders in a group

## Cara Menggunakan

### 1. Login/Register

- Buka `http://localhost:3000/login`
- Pilih:
  - Login dengan username & password
  - Register akun baru
  - Login dengan Google

### 2. Tambah Nomor WhatsApp

- Setelah login, buka `http://localhost:3000/profile`
- Masukkan nomor WhatsApp (format: 08XXXXXXXXXX)
- Klik "Simpan Perubahan"
- Sekarang Anda akan menerima notifikasi WhatsApp

### 3. Lihat Riwayat Pesanan

- Buka `http://localhost:3000/orders`
- Lihat semua pesanan Anda dengan detail lengkap
- Status pesanan dan pembayaran ditampilkan dengan badge

### 4. Test WhatsApp Notification

Backend akan otomatis mengirim notifikasi WhatsApp ketika:

- User membuat pesanan baru
- Admin mengubah status pesanan menjadi "completed" (ready)

**Note**: User harus menambahkan nomor WhatsApp di profile terlebih dahulu untuk menerima notifikasi.

## Admin Features

Admin dapat:

1. Update order status melalui API
2. Notifikasi WhatsApp otomatis terkirim ke customer ketika order ready
3. Mark payment as paid untuk group orders

## Testing

### Test Login

1. Register user baru atau gunakan Google OAuth
2. Setelah login, akan redirect ke home page
3. Token akan tersimpan di localStorage

### Test Order Notification

1. Login sebagai user
2. Tambahkan nomor WhatsApp di profile
3. Buat pesanan baru
4. User akan menerima notifikasi WhatsApp

### Test Order Ready Notification

1. Login sebagai admin
2. Update order status ke "completed"
3. Customer akan menerima notifikasi WhatsApp

## Environment Variables

### Backend (.env)

```env
MongoURI=<your-mongodb-uri>
PORT=5000
googleClientID=<your-google-client-id>
googleClientSecret=<your-google-client-secret>
JWT_SECRET=<your-jwt-secret>
FONNTE_TOKEN=<your-fonnte-token>
FRONTEND_URL=http://localhost:3000
ADMIN_EMAIL=admin@katering.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Google OAuth Setup

Untuk production, update Google OAuth callback URL:

1. Go to Google Cloud Console
2. Update callback URL ke: `https://your-backend-domain.com/api/auth/google/callback`
3. Update `FRONTEND_URL` di backend `.env`

## Fonnte WhatsApp Setup

Token Fonnte sudah dikonfigurasi. Untuk production:

1. Login ke https://fonnte.com
2. Copy API token
3. Update `FONNTE_TOKEN` di `.env`

## Notes

- Semua route yang memerlukan authentication sudah dilindungi
- JWT token auto-expire setelah 1 jam
- Google OAuth callback akan redirect ke frontend dengan token
- WhatsApp notification hanya terkirim jika user sudah menambahkan nomor phone
- Admin account otomatis dibuat saat server start (username: admin, password: admin123)

## Troubleshooting

### Token expired

- Logout dan login kembali
- Token akan auto-refresh setiap kali request

### WhatsApp notification tidak terkirim

- Pastikan user sudah menambahkan nomor WhatsApp di profile
- Cek FONNTE_TOKEN di backend .env
- Cek backend console untuk error logs

### Google OAuth error

- Pastikan Google Client ID dan Secret sudah benar
- Cek callback URL sudah sesuai di Google Cloud Console
