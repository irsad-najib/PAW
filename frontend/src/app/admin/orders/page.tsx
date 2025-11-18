"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import OrderSummary from "@/components/admin/OrderSummary";
import OrdersDetailTable from "@/components/admin/OrdersDetailTable";
import NotesModal from "@/components/admin/NotesModal";
import { useCurrentDate } from "@/hooks/UseCurrentDate";
import { useAuth } from "@/contexts/AuthContext";
import { Order } from "@/lib/types";
import { fetchAdminOrders, fetchOrderSummary } from "@/lib/api";

const formatISO = (date: Date) => date.toISOString().split("T")[0];

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(formatISO(new Date()));
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [errorOrders, setErrorOrders] = useState<string | null>(null);
  const [notesModal, setNotesModal] = useState<{ title: string; notes: string[] } | null>(null);
  const currentDate = useCurrentDate();

  // Ringkasan produksi harian
  useEffect(() => {
    if (authLoading || !user) return;
    setSummaryLoading(true);
    fetchOrderSummary(selectedDate)
      .then((res) => {
        if (res?.byMealTime?.length) {
          const mapped = res.byMealTime.flatMap((m) =>
            (m.items || []).map((item) => ({
              menu: item.name,
              ordered: item.portions,
              notes: item.notes || [],
            }))
          );
          setSummaryData(mapped);
        } else {
          setSummaryData([]);
        }
      })
      .catch((err) => {
        console.warn("Gagal memuat ringkasan pesanan:", err.message);
        setSummaryData([]);
      })
      .finally(() => setSummaryLoading(false));
  }, [selectedDate, authLoading, user]);

  // Data detail pesanan
  useEffect(() => {
    let mounted = true;
    if (authLoading || !user) return;
    setLoadingOrders(true);
    setErrorOrders(null);
    fetchAdminOrders({ date: selectedDate, limit: 200 })
      .then((res) => {
        if (!mounted) return;
        setAllOrders(res.items || []);
      })
      .catch((err) => {
        if (!mounted) return;
        console.warn("Gagal memuat daftar pesanan:", err.message);
        setErrorOrders("Gagal memuat data dari server.");
        setAllOrders([]);
      })
      .finally(() => mounted && setLoadingOrders(false));
    return () => {
      mounted = false;
    };
  }, [selectedDate, authLoading, user]);

  const handleOpenNotes = (menuName: string, notes: string[]) => {
    setNotesModal({ title: menuName, notes });
  };

  return (
    <div>
      {(!user && !authLoading) && (
        <p className="text-red-600">Anda harus login untuk melihat halaman ini.</p>
      )}
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

      <div className="mt-6">
        {errorOrders && (
          <p className="mb-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
            {errorOrders}
          </p>
        )}
        {loadingOrders ? (
          <p className="text-gray-500">Memuat data pesanan...</p>
        ) : (
          <OrdersDetailTable selectedDate={selectedDate} orders={allOrders} />
        )}
      </div>

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
