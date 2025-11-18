"use client";

import MenuNotesSummary from "./MenuNotesSummary";

interface OrderSummaryProps {
  selectedDate: string;
  onChangeDate: (value: string) => void;
  summaryData: { menu: string; ordered: number; notes: string[] }[];
  loading: boolean;
  onOpenNotes: (menuName: string, notes: string[]) => void;
}

export default function OrderSummary({
  selectedDate,
  onChangeDate,
  summaryData,
  loading,
  onOpenNotes,
}: OrderSummaryProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ringkasan Pesanan</h2>
          <p className="text-sm text-gray-600">
            Rekap menu dan catatan untuk tanggal yang dipilih.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <label
            htmlFor="filter-date-full"
            className="text-sm font-medium text-gray-900"
          >
            Pilih Tanggal
          </label>
          <input
            type="date"
            id="filter-date-full"
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
            value={selectedDate}
            onChange={(e) => onChangeDate(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 mb-4">Memuat ringkasan...</p>
      ) : (
        <MenuNotesSummary
          title=""
          menus={summaryData.map((m) => ({
            name: m.menu,
            portions: m.ordered,
            notes: m.notes,
          }))}
          onOpenNotes={onOpenNotes}
        />
      )}
    </div>
  );
}
