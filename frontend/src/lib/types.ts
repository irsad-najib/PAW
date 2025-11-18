// KAMUS BARU: Sesuai dengan Skema Mongoose Anda

// dari userSchema
export interface User {
  _id: string;
  userID: string;
  username: string;
  email?: string;
  role: 'user' | 'admin';
  name?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// dari menuSchema
export interface Menu {
  _id: string;
  name: string;
  price: number;
  description?: string;
  stock: number;
  image?: string;
  date: string; // Menggunakan string ISO untuk kemudahan
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

// dari orderItemSchema (sub-dokumen)
export interface OrderItem {
  _id: string; // Mongoose akan menambah _id
  menuId: string | Menu; // Kita anggap di frontend bisa ID string atau populated Menu object
  quantity: number;
  specialNotes?: string;
}

// dari orderSchema
export type OrderPaymentStatus = 'pending' | 'paid' | 'unpaid';
export type OrderStatus = 'accepted' | 'processing' | 'ready' | 'completed' | 'cancelled';
export type OrderDeliveryType = 'Delivery' | 'Pickup';
export type OrderDeliveryTime = 'Pagi' | 'Siang' | 'Sore';
export type OrderPaymentMethod = 'cash' | 'transfer'; 

export interface Order {
  _id: string;
  userId: string | User; // ID dari User atau populated User object
  groupId?: string;
  items: OrderItem[];
  orderDates: string[]; // Array string ISO
  deliveryType: OrderDeliveryType;
  deliveryAddress?: string;
  deliveryTime: OrderDeliveryTime;
  paymentMethod: OrderPaymentMethod;
  paymentReference?: string;
  totalPrice: number;
  paymentStatus: OrderPaymentStatus;
  orderStatus: OrderStatus;
  orderId?: string; // Untuk Midtrans
  midtransToken?: string;
  customerName?: string; // Nama customer (bisa dari User atau input)
  customerPhone?: string;
  createdAt: string;
  updatedAt: string;
}

// dari holidaySchema
export interface Holiday {
  _id: string;
  startDate: string;
  endDate: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

// Helper functions to safely handle populated userId
export function getUserDisplayName(userId: string | User | undefined): string {
  if (!userId) return 'Unknown';
  if (typeof userId === 'string') return userId;
  return userId.username || userId.name || userId._id || 'Unknown';
}

export function getUserId(userId: string | User | undefined): string {
  if (!userId) return '';
  if (typeof userId === 'string') return userId;
  return userId._id || '';
}

// Helper function to safely get menu name
export function getMenuName(menuId: string | Menu | undefined): string {
  if (!menuId) return 'Unknown';
  if (typeof menuId === 'string') return menuId;
  return menuId.name || menuId._id || 'Unknown';
}

// Helper function to safely get menu ID
export function getMenuId(menuId: string | Menu | undefined): string {
  if (!menuId) return '';
  if (typeof menuId === 'string') return menuId;
  return menuId._id || '';
}
