# API Endpoints Documentation

## Authentication Endpoints

### Register

```
POST /api/auth/register
Body: {
  "username": "string",
  "email": "string",
  "password": "string"
}
Response: {
  "message": "User berhasil didaftarkan",
  "user": { ... }
}
```

### Login

```
POST /api/auth/login
Body: {
  "username": "string",  // atau "email"
  "password": "string"
}
Response: {
  "token": "jwt_token",
  "user": { ... }
}
```

### Google OAuth

```
GET /api/auth/google
→ Redirects to Google OAuth

GET /api/auth/google/callback
→ Callback dari Google, redirect ke frontend dengan token
```

### Get Profile

```
GET /api/auth/me
Headers: {
  "Authorization": "Bearer <token>"
}
Response: {
  "id": "string",
  "username": "string",
  "email": "string",
  "name": "string",
  "phone": "string",
  "role": "string"
}
```

### Update Profile

```
PUT /api/auth/profile
Headers: {
  "Authorization": "Bearer <token>"
}
Body: {
  "name": "string",
  "phone": "string"
}
Response: {
  "message": "Profile updated",
  "user": { ... }
}
```

### Logout

```
POST /api/auth/logout
Headers: {
  "Authorization": "Bearer <token>"
}
Response: {
  "message": "Logged out"
}
```

## Order Endpoints

### Get User Orders (Paginated)

```
GET /api/orders?page=1&limit=10
Headers: {
  "Authorization": "Bearer <token>"
}
Response: {
  "page": 1,
  "limit": 10,
  "total": 50,
  "items": [ ... ]
}
```

### Get Order by ID

```
GET /api/orders/:id
Headers: {
  "Authorization": "Bearer <token>"
}
Response: {
  "_id": "string",
  "userId": "string",
  "items": [ ... ],
  "orderStatus": "string",
  "paymentStatus": "string",
  ...
}
```

### Create Order

```
POST /api/orders
Headers: {
  "Authorization": "Bearer <token>"
}
Body: {
  "items": [
    {
      "menuId": "string",
      "quantity": number,
      "specialNotes": "string"
    }
  ],
  "deliveryType": "Delivery" | "Pickup",
  "deliveryAddress": "string",
  "deliveryTime": "Pagi" | "Siang" | "Sore",
  "paymentMethod": "cash" | "transfer"
}
Response: {
  "message": "Order created",
  "order": { ... }
}
```

**Note:**

- WhatsApp notification otomatis terkirim setelah order dibuat (jika user punya phone)
- Support multi-day orders (akan di-split otomatis)

### Get Orders by Group

```
GET /api/orders/group/:groupId
Headers: {
  "Authorization": "Bearer <token>"
}
Response: {
  "groupId": "string",
  "count": number,
  "paymentMethod": "string",
  "paymentStatuses": [ ... ],
  "totalAmount": number,
  "orders": [ ... ]
}
```

### Update Order Status (Admin Only)

```
PATCH /api/orders/:id/status
Headers: {
  "Authorization": "Bearer <token>"
}
Body: {
  "orderStatus": "processing" | "completed" | "cancelled"
}
Response: {
  "message": "Status updated",
  "order": { ... }
}
```

**Note:**

- WhatsApp notification otomatis terkirim ketika status berubah ke "completed" (ready)
- Hanya admin yang bisa update status

### Cancel Order (Admin Only)

```
POST /api/orders/:id/cancel
Headers: {
  "Authorization": "Bearer <token>"
}
Response: {
  "message": "Order cancelled",
  "order": { ... }
}
```

### Mark Payment as Paid (Admin Only)

```
PATCH /api/orders/:id/payment
Headers: {
  "Authorization": "Bearer <token>"
}
Body: {
  "action": "markPaid"
}
Response: {
  "message": "Payment set to paid",
  "order": { ... }
}
```

### Mark Group Payment as Paid (Admin Only)

```
PATCH /api/orders/group/:groupId/payment
Headers: {
  "Authorization": "Bearer <token>"
}
Body: {
  "action": "markPaid"
}
Response: {
  "message": "Group payment set to paid",
  "groupId": "string",
  "orders": [ ... ]
}
```

## Notification Endpoints

### Send WhatsApp Notification (Internal)

```
POST /api/notifications/send
Body: {
  "phone": "string",
  "type": "order_success" | "payment_success" | "order_ready",
  "order_id": "string",
  "name": "string",
  "amount": number
}
Response: {
  "status": "success",
  "info": { ... }
}
```

**Note:** Endpoint ini dipanggil otomatis dari order routes, tidak perlu dipanggil manual.

## Menu Endpoints

### Get All Menus

```
GET /api/menu
Response: [ ... ]
```

### Get Menu by ID

```
GET /api/menu/:id
Response: { ... }
```

## Order Status Values

- `pending` - Pesanan baru dibuat, menunggu konfirmasi
- `processing` - Pesanan sedang diproses
- `completed` - Pesanan selesai/ready
- `cancelled` - Pesanan dibatalkan

## Payment Status Values

- `pending` - Menunggu pembayaran (transfer)
- `unpaid` - Belum bayar (cash)
- `paid` - Sudah lunas

## WhatsApp Notification Triggers

1. **Order Created**

   - Trigger: POST /api/orders
   - Condition: User memiliki phone number
   - Message: Detail pesanan & total harga

2. **Order Ready**
   - Trigger: PATCH /api/orders/:id/status dengan orderStatus="completed"
   - Condition: User memiliki phone number
   - Message: Pesanan ready untuk diambil/dikirim

## Error Responses

### 400 Bad Request

```json
{
  "error": "Error message"
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "message": "Forbidden: admin only"
}
```

### 404 Not Found

```json
{
  "message": "Not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Server error message"
}
```

## Testing with cURL

### Register

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

### Get Orders

```bash
curl http://localhost:5000/api/orders?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Profile

```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","phone":"081234567890"}'
```

## Frontend Integration Examples

### Login

```typescript
import api from "@/component/api";

const login = async (username: string, password: string) => {
  const response = await api.post("/auth/login", {
    username,
    password,
  });
  const { token, user } = response.data;
  localStorage.setItem("token", token);
  return user;
};
```

### Get Orders

```typescript
import api from "@/component/api";

const getOrders = async (page = 1, limit = 10) => {
  const response = await api.get(`/orders?page=${page}&limit=${limit}`);
  return response.data;
};
```

### Update Profile

```typescript
import api from "@/component/api";

const updateProfile = async (name: string, phone: string) => {
  const response = await api.put("/auth/profile", {
    name,
    phone,
  });
  return response.data;
};
```

**Note:** JWT token otomatis di-attach ke setiap request via axios interceptor di `api.tsx`
