"use client";

import { useState, useEffect } from "react";
// gunakan data dari backend, fallback kosong jika gagal
import { fetchAdminOrders } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useCurrentDate } from "@/hooks/UseCurrentDate";
import { ConfirmActionModal } from "@/components/admin/order-controls/ConfirmActionModal";

type HolidayRefund = {
  id: string;
  customer: string;
  total: number;
  paymentMethod: string;
  status: "Belum Refund" | "Refunded";
};

export default function HolidaysPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [refundOrders, setRefundOrders] = useState<HolidayRefund[]>([]);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmRefund, setConfirmRefund] = useState<HolidayRefund | null>(null);
  const currentDate = useCurrentDate();

  useEffect(() => {
    let mounted = true;
    fetchAdminOrders({ status: "cancelled", paymentStatus: "paid", limit: 200 })
      .then((res) => {
        if (!mounted) return;
        const initialRefunds: HolidayRefund[] = (res.items || []).map((o: any) => ({
          id: o._id,
          customer: o.customerName ?? "Pelanggan",
          total: o.totalPrice,
          paymentMethod: o.paymentMethod,
          status: "Belum Refund",
        }));
        setRefundOrders(initialRefunds);
      })
      .catch((err) => console.warn("Gagal memuat daftar refund:", err.message));

    return () => {
      mounted = false;
    };
  }, []);

  const handleCancelOrders = () => {
    const missingField = !startDate || !endDate || !reason;
    if (missingField) {
      alert("Harap isi semua field: Tanggal Awal, Tanggal Akhir, dan Alasan Pembatalan.");
      return;
    }

    const existingMap = new Map(refundOrders.map((o) => [o.id, o]));

    // Tambah data baru hasil filter (simulasi: gunakan data yang sudah ada di state)
    const affected = Array.from(existingMap.values());
    setRefundOrders((prev) => {
      const existing = new Set(prev.map((o) => o.id));
      const toAdd = affected.filter((o) => !existing.has(o.id));
      return [...prev, ...toAdd];
    });

    setConfirmCancel(false);
  };

  const handleProcessRefund = (id: string) => {
    console.log(
      `Simulasi: Memanggil API POST /api/orders/admin/${id}/refund dan menandai sebagai refunded`
    );

    setRefundOrders((prev) => prev.filter((o) => o.id !== id));
  };

  return (
    <div>
      <AdminPageHeader
        title="Pembatalan Pesanan"
        rightContent={
          <p className="text-base md:text-lg text-gray-600">
            Hari Ini:{" "}
            <span className="font-semibold text-gray-800">{currentDate}</span>
          </p>
        }
      />

      <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-red-500 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Batalkan Pesanan</h2>
        <p className="text-sm text-gray-600 mb-6">
          Gunakan formulir ini jika Anda harus membatalkan pesanan untuk rentang tanggal tertentu
          (misalnya libur mendadak). Sistem akan menemukan pesanan yang sudah dibayar dan dibatalkan
          yang perlu diproses refund secara manual.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="holiday-start-date" className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Awal
            </label>
            <input
              type="date"
              id="holiday-start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label htmlFor="holiday-end-date" className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Akhir
            </label>
            <input
              type="date"
              id="holiday-end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="holiday-reason" className="block text-sm font-medium text-gray-700 mb-1">
            Alasan Pembatalan (Wajib)
          </label>
          <textarea
            id="holiday-reason"
            rows={3}
            placeholder="Contoh: Ada urusan keluarga mendadak, bahan baku habis, dll."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 placeholder:text-gray-400"
          />
        </div>

        <button
          onClick={() => setConfirmCancel(true)}
          className="w-full bg-red-600 text-white p-3 rounded-lg text-lg font-bold hover:bg-red-700 shadow-lg"
        >
          Batalkan Pesanan
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-red-700 mb-4">
          Pesanan Terdampak (Perlu Refund)
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Pesanan berikut sudah dibayar dan statusnya dibatalkan. Silakan proses refund secara manual
          (misalnya via transfer balik atau dashboard Midtrans/bank).
        </p>

        {refundOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Pesanan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pelanggan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Refund
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {refundOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:underline">
                      <a href={`#${order.id}`}>{order.id}</a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      {formatRupiah(order.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setConfirmRefund(order)}
                        className="text-white bg-green-600 px-3 py-1 rounded-md text-xs font-bold hover:bg-green-700"
                      >
                        Proses Refund
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            Tidak ada pesanan yang menunggu refund.
          </p>
        )}
      </div>

      {confirmCancel && (
        <ConfirmActionModal
          title="Konfirmasi Pembatalan"
          description={`Aktifkan pembatalan pesanan untuk rentang ${startDate || "?"} s/d ${endDate || "?"} dengan alasan: "${reason || "Belum diisi"}"?`}
          onClose={() => setConfirmCancel(false)}
          onConfirm={handleCancelOrders}
        />
      )}

      {confirmRefund && (
        <ConfirmActionModal
          title="Konfirmasi Refund"
          description={`Proses refund pesanan ${confirmRefund.id} a.n ${confirmRefund.customer} sebesar ${formatRupiah(confirmRefund.total)}?`}
          onClose={() => setConfirmRefund(null)}
          onConfirm={() => {
            handleProcessRefund(confirmRefund.id);
            setConfirmRefund(null);
          }}
        />
      )}
    </div>
  );
}
