"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import OrderSummary from "@/components/admin/OrderSummary";
import OrdersDetailTable from "@/components/admin/OrdersDetailTable";
import NotesModal from "@/components/admin/NotesModal";
import { useCurrentDate } from "@/hooks/UseCurrentDate";
import { Order } from "@/lib/types";

const formatISO = (date: Date) => date.toISOString().split("T")[0];
const todayISO = formatISO(new Date());
const tomorrowISO = formatISO(
  new Date(new Date().setDate(new Date().getDate() + 1))
);

const productionDataToday = {
  Pagi: [
    {
      menu: "Nasi Ayam Bakar Spesial",
      ordered: 45,
      notes: ["Tanpa sambal 5 porsi", "Bumbu dipisah 2 porsi"],
    },
    { menu: "Es Teh Manis", ordered: 80, notes: [] },
  ],
  Siang: [
    {
      menu: "Nasi Ayam Bakar Spesial",
      ordered: 15,
      notes: ["Extra sambal 1 porsi"],
    },
  ],
  Sore: [
    {
      menu: "Gulai Ikan Patin",
      ordered: 30,
      notes: ["Tidak pedas sama sekali 1 porsi"],
    },
  ],
};

const productionDataTomorrow = [
  {
    menu: "Soto Ayam Komplit",
    ordered: 40,
    notes: ["Tanpa koya 3 porsi"],
    stock: 50,
  },
  {
    menu: "Gulai Ikan Patin",
    ordered: 35,
    notes: ["Kuah kental 2 porsi"],
    stock: 15,
  },
];

const INITIAL_ADMIN_ORDERS: Order[] = [
  {
    _id: "ORD-001",
    userId: "USER-1",
    customerName: "Ibu Ani",
    customerPhone: "08123456789",
    items: [
      { _id: "ITEM-1", menuId: "Nasi Ayam Bakar", quantity: 5 },
      { _id: "ITEM-2", menuId: "Es Teh", quantity: 5 },
    ],
    orderDates: [todayISO],
    deliveryType: "Delivery",
    deliveryAddress: "Jl. Merdeka No. 1",
    deliveryTime: "Pagi",
    paymentMethod: "cash",
    totalPrice: 200000,
    paymentStatus: "unpaid",
    orderStatus: "accepted",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "ORD-002",
    userId: "USER-2",
    customerName: "Budi",
    items: [{ _id: "ITEM-3", menuId: "Nasi Ayam Bakar", quantity: 3 }],
    orderDates: [todayISO],
    deliveryType: "Pickup",
    deliveryTime: "Pagi",
    paymentMethod: "transfer",
    totalPrice: 150000,
    paymentStatus: "paid",
    orderStatus: "processing",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "ORD-003",
    userId: "USER-3",
    customerName: "Mahasiswa Kos",
    items: [{ _id: "ITEM-4", menuId: "Gulai Ikan Patin", quantity: 2 }],
    orderDates: [todayISO],
    deliveryType: "Delivery",
    deliveryAddress: "Jl. Kampus No. 5",
    deliveryTime: "Siang",
    paymentMethod: "cash",
    totalPrice: 55000,
    paymentStatus: "unpaid",
    orderStatus: "accepted",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "ORD-004",
    userId: "USER-4",
    customerName: "Siti",
    items: [{ _id: "ITEM-5", menuId: "Soto Ayam Komplit", quantity: 2 }],
    orderDates: [tomorrowISO],
    deliveryType: "Delivery",
    deliveryAddress: "Jl. Merdeka No. 10",
    deliveryTime: "Pagi",
    paymentMethod: "transfer",
    totalPrice: 75000,
    paymentStatus: "paid",
    orderStatus: "processing",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "ORD-005",
    userId: "USER-5",
    customerName: "Pak RT",
    items: [{ _id: "ITEM-6", menuId: "Nasi Ayam Bakar", quantity: 4 }],
    orderDates: [tomorrowISO],
    deliveryType: "Pickup",
    deliveryTime: "Pagi",
    paymentMethod: "transfer",
    totalPrice: 90000,
    paymentStatus: "paid",
    orderStatus: "ready",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "ORD-006",
    userId: "USER-6",
    customerName: "Keluarga Budi",
    items: [{ _id: "ITEM-7", menuId: "Paket Sore", quantity: 5 }],
    orderDates: [tomorrowISO],
    deliveryType: "Delivery",
    deliveryAddress: "Jl. Melati No. 9",
    deliveryTime: "Sore",
    paymentMethod: "transfer",
    totalPrice: 350000,
    paymentStatus: "paid",
    orderStatus: "accepted",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "ORD-007",
    userId: "USER-7",
    customerName: "Joko",
    items: [{ _id: "ITEM-8", menuId: "Gulai Ikan Patin", quantity: 1 }],
    orderDates: [todayISO],
    deliveryType: "Delivery",
    deliveryAddress: "Jl. Kenanga No. 3",
    deliveryTime: "Sore",
    paymentMethod: "transfer",
    totalPrice: 50000,
    paymentStatus: "paid",
    orderStatus: "cancelled",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function OrdersPage() {
  const [selectedDate, setSelectedDate] = useState<string>(formatISO(new Date()));
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [allOrders] = useState<Order[]>(INITIAL_ADMIN_ORDERS);
  const [notesModal, setNotesModal] = useState<{ title: string; notes: string[] } | null>(null);
  const currentDate = useCurrentDate();

  useEffect(() => {
    setSummaryLoading(true);

    setTimeout(() => {
      let data: any[] = [];
      if (selectedDate === todayISO) {
        const allToday = [
          ...(productionDataToday["Pagi"] || []),
          ...(productionDataToday["Siang"] || []),
          ...(productionDataToday["Sore"] || []),
        ];
        const combined: Record<string, { menu: string; ordered: number; notes: string[] }> = {};
        allToday.forEach((item) => {
          if (!combined[item.menu]) {
            combined[item.menu] = {
              menu: item.menu,
              ordered: 0,
              notes: [],
            };
          }
          combined[item.menu].ordered += item.ordered;
          combined[item.menu].notes.push(...item.notes);
        });
        data = Object.values(combined);
      } else if (selectedDate === tomorrowISO) {
        data = productionDataTomorrow.map((item) => ({ ...item }));
      } else {
        data = [];
      }

      setSummaryData(data);
      setSummaryLoading(false);
    }, 300);
  }, [selectedDate]);

  const handleOpenNotes = (menuName: string, notes: string[]) => {
    setNotesModal({ title: menuName, notes });
  };

  return (
    <div>
      <AdminPageHeader
        title="Daftar Pesanan"
        rightContent={
          <p className="text-base md:text-lg text-gray-600">
            Hari Ini:{" "}
            <span className="font-semibold text-gray-800">{currentDate}</span>
          </p>
        }
      />

      <OrderSummary
        selectedDate={selectedDate}
        onChangeDate={setSelectedDate}
        summaryData={summaryData}
        loading={summaryLoading}
        onOpenNotes={handleOpenNotes}
      />

      <OrdersDetailTable selectedDate={selectedDate} orders={allOrders} />

      {notesModal && (
        <NotesModal
          title={notesModal.title}
          notes={notesModal.notes}
          onClose={() => setNotesModal(null)}
        />
      )}
    </div>
  );
}
