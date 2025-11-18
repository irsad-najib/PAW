"use client";

import { formatRupiah } from "@/lib/utils";

type PaymentScope = "single" | "group";

interface PaymentScopeModalProps {
  customerName?: string;
  groupId?: string;
  orderTotal: number;
  groupTotal?: number;
  mode: "payment" | "status";
  onSelect: (scope: PaymentScope) => void;
  onClose: () => void;
}

export function PaymentScopeModal({
  customerName,
  groupId,
  orderTotal,
  groupTotal,
  mode,
  onSelect,
  onClose,
}: PaymentScopeModalProps) {
  const title =
    mode === "status"
      ? "Verifikasi Pembayaran & Selesaikan"
      : "Verifikasi Pembayaran";
  const desc =
    mode === "status"
      ? "Pesanan belum lunas. Pilih cakupan verifikasi sebelum menyelesaikan pesanan."
      : "Pesanan belum lunas. Pilih cakupan verifikasi pembayaran.";

  const hasGroup = Boolean(groupId && groupTotal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h4 className="text-lg font-bold text-gray-900 mb-2">{title}</h4>
        <p className="text-sm text-gray-600 mb-4">
          {desc} {customerName ? `Atas nama ${customerName}.` : ""}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => onSelect("single")}
            className="w-full rounded-lg border border-blue-200 px-4 py-3 text-sm font-semibold text-blue-800 hover:bg-blue-50 text-left"
          >
            <div>Verifikasi order ini saja</div>
            <div className="text-xs text-blue-600">
              Total: {formatRupiah(orderTotal)}
            </div>
          </button>

          {hasGroup && (
            <button
              onClick={() => onSelect("group")}
              className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 text-left"
            >
              <div>Verifikasi semua order (Group {groupId})</div>
              <div className="text-xs text-white/90">
                Total: {formatRupiah(groupTotal!)}
              </div>
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 hover:bg-gray-100"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
