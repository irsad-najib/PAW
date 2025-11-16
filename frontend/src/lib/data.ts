import { Order, Menu } from './types';

// ===== DASHBOARD DATA =====
export const DASHBOARD_STATS = {
  totalOrdersToday: 6,
  totalRevenue: 665000,
  totalUnpaid: 255000,
};

// Data untuk ringkasan pesanan hari ini
export const TODAY_MEAL_DATA = [
  {
    mealTime: "Pagi (125 Porsi Total)",
    totalPortions: 125,
    hasPreparationFocus: true,
    items: [
      {
        name: "Nasi Ayam Bakar Spesial",
        portions: 45,
        notes: ["Tanpa sambal 5 porsi", "Bumbu dipisah 2 porsi"],
      },
      {
        name: "Es Teh Manis",
        portions: 80,
        notes: [],
      },
    ],
  },
  {
    mealTime: "Siang (5 Porsi Total)",
    totalPortions: 5,
    hasPreparationFocus: true,
    items: [
      {
        name: "Nasi Ayam Bakar Spesial",
        portions: 5,
        notes: ["Extra sambal 1 porsi"],
      },
    ],
  },
  {
    mealTime: "Sore (30 Porsi Total)",
    totalPortions: 30,
    hasPreparationFocus: true,
    items: [
      {
        name: "Gulai Ikan Patin",
        portions: 30,
        notes: ["Tidak pedas sama sekali 1 porsi"],
      },
    ],
  },
];

// Data untuk ringkasan besok
export const TOMORROW_MEAL_DATA = [
  {
    mealTime: "Rencana Besok",
    totalPortions: 0,
    hasStockFocus: true,
    items: [
      {
        name: "Soto Ayam Komplit",
        portions: 40,
        notes: ["Tanpa koya 3 porsi"],
        stock: 50,
      },
      {
        name: "Gulai Ikan Patin",
        portions: 35,
        notes: ["Kuah kental 2 porsi"],
        stock: 15,
      },
    ],
  },
];

// Data dummy untuk tabel verifikasi pesanan
export const DASHBOARD_ORDERS: Order[] = [
  {
    _id: "ORD-001",
    userId: "user-001",
    customerName: "Ibu Ani",
    customerPhone: "081234567890",
    items: [],
    orderDates: ["2025-11-10"],
    deliveryType: "Delivery",
    deliveryAddress: "Jl. Contoh No. 1",
    deliveryTime: "Pagi",
    paymentMethod: "cash",
    totalPrice: 50000,
    paymentStatus: "unpaid",
    orderStatus: "accepted",
    createdAt: "2025-11-10T08:00:00Z",
    updatedAt: "2025-11-10T08:00:00Z",
  },
  {
    _id: "ORD-002",
    userId: "user-002",
    customerName: "Budi",
    customerPhone: "081234567891",
    items: [],
    orderDates: ["2025-11-10"],
    deliveryType: "Pickup",
    deliveryTime: "Pagi",
    paymentMethod: "transfer",
    totalPrice: 75000,
    paymentStatus: "paid",
    orderStatus: "processing",
    createdAt: "2025-11-10T08:15:00Z",
    updatedAt: "2025-11-10T08:15:00Z",
  },
  {
    _id: "ORD-003",
    userId: "user-003",
    customerName: "Mahasiswa Kos",
    customerPhone: "081234567892",
    items: [],
    orderDates: ["2025-11-10"],
    deliveryType: "Delivery",
    deliveryAddress: "Jl. Kampus No. 5",
    deliveryTime: "Siang",
    paymentMethod: "cash",
    totalPrice: 45000,
    paymentStatus: "unpaid",
    orderStatus: "accepted",
    createdAt: "2025-11-10T09:00:00Z",
    updatedAt: "2025-11-10T09:00:00Z",
  },
  {
    _id: "ORD-004",
    userId: "user-004",
    customerName: "Siti",
    customerPhone: "081234567893",
    items: [],
    orderDates: ["2025-11-10"],
    deliveryType: "Delivery",
    deliveryAddress: "Jl. Merdeka No. 10",
    deliveryTime: "Pagi",
    paymentMethod: "transfer",
    totalPrice: 60000,
    paymentStatus: "paid",
    orderStatus: "processing",
    createdAt: "2025-11-10T07:45:00Z",
    updatedAt: "2025-11-10T07:45:00Z",
  },
  {
    _id: "ORD-005",
    userId: "user-005",
    customerName: "Pak RT",
    customerPhone: "081234567894",
    items: [],
    orderDates: ["2025-11-10"],
    deliveryType: "Pickup",
    deliveryTime: "Pagi",
    paymentMethod: "transfer",
    totalPrice: 100000,
    paymentStatus: "paid",
    orderStatus: "ready",
    createdAt: "2025-11-10T07:30:00Z",
    updatedAt: "2025-11-10T07:30:00Z",
  },
];

// ===== MENU DATA =====
// Data Menu Baru (sesuai Tipe Menu)
export const DUMMY_MENU: { [key: string]: Menu[] } = {
  '2025-11-17': [
    {
      _id: 'M-001', name: 'Nasi Ayam Bakar', price: 20000, stock: 50,
      description: 'Ayam bakar spesial dengan bumbu kecap',
      date: '2025-11-17T00:00:00.000Z', isAvailable: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    },
    {
      _id: 'M-002', name: 'Es Teh Manis', price: 5000, stock: 100,
      description: 'Teh manis dingin menyegarkan',
      date: '2025-11-17T00:00:00.000Z', isAvailable: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    },
  ],
  '2025-11-18': [
    {
      _id: 'M-003', name: 'Soto Ayam Komplit', price: 17000, stock: 45,
      description: 'Soto ayam dengan koya dan telur',
      date: '2025-11-18T00:00:00.000Z', isAvailable: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    },
  ],
  '2025-11-19': [], // Libur
};

// Data Pesanan Baru (sesuai Tipe Order)
export const DUMMY_ORDERS: Order[] = [
  {
    _id: 'ORD-001',
    userId: 'USER-1',
    customerName: 'Ibu Ani',
    customerPhone: '08123456789',
    totalPrice: 200000,
    paymentMethod: 'cash',
    paymentStatus: 'unpaid',
    orderStatus: 'accepted',
    deliveryTime: 'Pagi',
    deliveryType: 'Delivery',
    deliveryAddress: 'Jl. Merdeka No. 1',
    orderDates: ['2025-11-17T00:00:00.000Z', '2025-11-18T00:00:00.000Z'],
    groupId: 'GRP-100',
    isGroupMaster: true,
    items: [
      { _id: 'ITEM-1', menuId: 'M-001', quantity: 1, specialNotes: 'Tanpa sambal' }
    ],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  },
  {
    _id: 'ORD-002',
    userId: 'USER-2',
    customerName: 'Budi Santoso',
    customerPhone: '08123456789',
    totalPrice: 150000,
    paymentMethod: 'transfer',
    paymentStatus: 'paid',
    orderStatus: 'processing',
    deliveryTime: 'Pagi',
    deliveryType: 'Pickup',
    orderDates: ['2025-11-17T00:00:00.000Z'],
    items: [
      { _id: 'ITEM-2', menuId: 'M-001', quantity: 2 },
      { _id: 'ITEM-3', menuId: 'M-002', quantity: 2 }
    ],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  },
  {
    _id: 'ORD-003',
    userId: 'USER-3',
    customerName: 'Mahasiswa Kos A',
    customerPhone: '08123456789',
    totalPrice: 55000,
    paymentMethod: 'cash',
    paymentStatus: 'unpaid',
    orderStatus: 'accepted',
    deliveryTime: 'Siang',
    deliveryType: 'Delivery',
    deliveryAddress: 'Jl. Telekomunikasi No. 10',
    orderDates: ['2025-11-17T00:00:00.000Z'],
    items: [
      { _id: 'ITEM-4', menuId: 'M-001', quantity: 1 }
    ],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  },
  {
    _id: 'ORD-004',
    userId: 'USER-4',
    customerName: 'Siti Fatimah',
    customerPhone: '08123456789',
    totalPrice: 75000,
    paymentMethod: 'transfer',
    paymentStatus: 'paid',
    orderStatus: 'ready',
    deliveryTime: 'Pagi',
    deliveryType: 'Delivery',
    deliveryAddress: 'Jl. Keadilan No. 2',
    orderDates: ['2025-11-17T00:00:00.000Z'],
    items: [
      { _id: 'ITEM-5', menuId: 'M-001', quantity: 1, specialNotes: 'Extra nasi' }
    ],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  },
  {
    _id: 'ORD-005',
    userId: 'USER-5',
    customerName: 'Pak RT Komplek',
    customerPhone: '08123456789',
    totalPrice: 90000,
    paymentMethod: 'transfer',
    paymentStatus: 'paid',
    orderStatus: 'completed',
    deliveryTime: 'Pagi',
    deliveryType: 'Pickup',
    orderDates: ['2025-11-17T00:00:00.000Z'],
    items: [
      { _id: 'ITEM-6', menuId: 'M-003', quantity: 1 }
    ],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  },
  {
    _id: 'ORD-006',
    userId: 'USER-6',
    customerName: 'Rina',
    customerPhone: '08120000001',
    totalPrice: 125000,
    paymentMethod: 'transfer',
    paymentStatus: 'paid',
    orderStatus: 'cancelled',
    deliveryTime: 'Siang',
    deliveryType: 'Delivery',
    deliveryAddress: 'Jl. Melati No. 9',
    orderDates: ['2025-11-17T00:00:00.000Z'],
    items: [
      { _id: 'ITEM-7', menuId: 'M-001', quantity: 2, specialNotes: 'Tanpa pedas' }
    ],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  },
  {
    _id: 'ORD-007',
    userId: 'USER-7',
    customerName: 'Andi',
    customerPhone: '08120000002',
    totalPrice: 68000,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    orderStatus: 'cancelled',
    deliveryTime: 'Pagi',
    deliveryType: 'Pickup',
    orderDates: ['2025-11-17T00:00:00.000Z'],
    items: [
      { _id: 'ITEM-8', menuId: 'M-002', quantity: 4 }
    ],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  },
];

// Fungsi simulasi (tidak berubah, tapi sekarang me-return Tipe baru)
export const getDummyOrders = async (): Promise<Order[]> => {
  await new Promise(res => setTimeout(res, 500));
  return DUMMY_ORDERS;
};

export const getDummyMenuByDate = async (date: string): Promise<Menu[]> => {
  await new Promise(res => setTimeout(res, 300));
  return DUMMY_MENU[date] || [];
};
