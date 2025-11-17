"use client";

import { useState } from "react";
import StatCard from "@/components/admin/StatCard";
import ProductionSummary from "@/components/admin/ProductionSummary";
import VerificationTable from "@/components/admin/VerificationTable";
import NotesModal from "@/components/admin/NotesModal";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useCurrentDate } from "@/hooks/UseCurrentDate";
import {
  DASHBOARD_STATS,
  TODAY_MEAL_DATA,
  DASHBOARD_ORDERS,
  TOMORROW_MEAL_DATA,
} from "@/lib/data";
import { formatDateLongID } from "@/lib/utils";

export default function DashboardPage() {
  const currentDate = useCurrentDate();
  const [notesModal, setNotesModal] = useState<{
    title: string;
    notes: string[];
  } | null>(null);

  return (
    <div>
      <AdminPageHeader
        title="Dashboard Utama"
        rightContent={
          <p className="text-base md:text-lg text-gray-600">
            Hari Ini:{" "}
            <span className="font-semibold text-gray-800">{currentDate}</span>
          </p>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Pesanan Hari Ini"
          value={`${DASHBOARD_STATS.totalOrdersToday} Pesanan`}
          borderColor="border-primary"
        />
        <StatCard
          title="Pendapatan Hari Ini (Lunas)"
          value={`Rp ${DASHBOARD_STATS.totalRevenue.toLocaleString("id-ID")}`}
          borderColor="border-green-500"
        />
        <StatCard
          title="Belum Lunas (Cash)"
          value={`Rp ${DASHBOARD_STATS.totalUnpaid.toLocaleString("id-ID")}`}
          borderColor="border-yellow-400"
        />
      </div>

      <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
          Ringkasan Pesanan Hari Ini ({formatDateLongID(new Date())})
        </h2>
        <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
          <ProductionSummary
            mealData={TODAY_MEAL_DATA}
            onOpenNotes={(label, notes) => setNotesModal({ title: label, notes })}
          />
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
          Ringkasan Pesanan Besok ({formatDateLongID(new Date(Date.now() + 24 * 60 * 60 * 1000))})
        </h2>
        <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
          <table className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="border-b border-gray-200 text-sm text-gray-600">
                <th className="py-3 px-4">Menu</th>
                <th className="py-3 px-4 text-center">Porsi</th>
                <th className="py-3 px-4 text-right">Catatan</th>
                <th className="py-3 px-4 text-center">Stok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
              {TOMORROW_MEAL_DATA[0]?.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{item.name}</td>
                  <td className="py-3 px-4 text-center font-semibold text-green-700">
                    {item.portions} Porsi
                  </td>
                  <td className="py-3 px-4 text-right">
                    {item.notes && item.notes.length > 0 ? (
                      <button
                        onClick={() =>
                          setNotesModal({
                            title: `Besok - ${item.name}`,
                            notes: Array.isArray(item.notes)
                              ? item.notes
                              : [item.notes],
                          })
                        }
                        className="inline-flex items-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 text-xs font-semibold"
                      >
                        Lihat {Array.isArray(item.notes) ? item.notes.length : 1} Catatan
                      </button>
                    ) : (
                      <span className="text-gray-400">Tanpa Catatan</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold">
                    {item.stock ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
          Aksi Cepat: Verifikasi Pesanan (Hari Ini)
        </h2>
        <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
          <VerificationTable orders={DASHBOARD_ORDERS} />
        </div>
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
