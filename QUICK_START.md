# 🚀 Quick Start Guide - Fitur Baru

## ✅ Yang Sudah Dibuat

### 1. **Login & Register System**

- Login dengan username/password ✅
- Login dengan Google OAuth ✅
- Register akun baru ✅
- Auto-redirect setelah login ✅

### 2. **Riwayat Pesanan**

- Halaman list semua pesanan user ✅
- Detail pesanan lengkap ✅
- Status order & payment ✅
- Pagination ✅

### 3. **WhatsApp Notifications**

- Notif saat order dibuat ✅
- Notif saat order ready (completed) ✅
- User bisa tambah nomor WA di profile ✅

### 4. **Profile Management**

- Update nama & nomor WhatsApp ✅
- View profile info ✅

## 🏃 Cara Jalankan

### Backend

```bash
cd Backend
npm install
npm start
# Server: http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# App: http://localhost:3000
```

## 📝 Testing Flow

### 1. Register & Login

1. Buka http://localhost:3000/login
2. Klik "Belum punya akun? Daftar di sini"
3. Isi username, email, password
4. Atau klik "Masuk dengan Google"

### 2. Tambah Nomor WhatsApp

1. Setelah login, klik profile di navbar
2. Atau buka http://localhost:3000/profile
3. Isi nomor WhatsApp (format: 08XXXXXXXXXX)
4. Simpan

### 3. Buat Pesanan (Test Notifikasi)

1. Buat pesanan di aplikasi
2. Cek WhatsApp - akan ada notifikasi pesanan berhasil dibuat

### 4. Lihat Riwayat

1. Klik "Pesanan Saya" di navbar
2. Atau buka http://localhost:3000/orders
3. Lihat semua pesanan dengan status lengkap

### 5. Admin - Update Status (Test Notif Ready)

1. Login sebagai admin (username: admin, password: admin123)
2. Update order status ke "completed"
3. Customer akan terima notifikasi WhatsApp "Pesanan Ready"

## 🔑 Important Files

### Frontend (Baru)

- `src/contexts/AuthContext.tsx` - Auth management
- `src/app/login/page.tsx` - Login/Register page
- `src/app/orders/page.tsx` - Order history
- `src/app/profile/page.tsx` - User profile
- `src/component/api.tsx` - API utils with JWT interceptor

### Backend (Updated)

- `src/routes/order.routes.js` - Added WhatsApp notifications
- `src/routes/user.routes.js` - Added profile endpoint
- `src/models/user.model.js` - Added phone field

## 🎯 Features Ready

✅ Login/Register/OAuth Google
✅ Riwayat Pesanan  
✅ WhatsApp Notifications (Order Created & Ready)
✅ Profile Management
✅ Protected Routes
✅ JWT Authentication
✅ Auto-redirect setelah login
✅ Navbar dengan user info & logout

## 🔧 Environment Variables

Backend `.env` sudah dikonfigurasi:

```env
FONNTE_TOKEN=XjPNU83VXZfJ7jFoStfT
FRONTEND_URL=http://localhost:3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

Frontend `.env.local` sudah dibuat:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 📱 Navbar Features

- Logo klik → Home
- "Pesanan Saya" → Order history
- "Admin Dashboard" → Admin (jika role admin)
- Dropdown user → Profile, Riwayat, Logout

## ⚠️ Notes

- User **HARUS** tambah nomor WA di profile untuk terima notifikasi
- Admin account auto-dibuat saat server start
- Token expire 1 jam, auto-refresh via interceptor
- WhatsApp notif pakai Fonnte API

## 🐛 Troubleshooting

**Notif WA tidak terkirim?**
→ Cek user sudah tambah nomor WA di profile

**Token expired?**
→ Logout & login lagi

**Google OAuth error?**
→ Cek Google Client ID/Secret di `.env`

---

Semua fitur yang diminta sudah dibuat! 🎉
