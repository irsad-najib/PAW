"use client";

interface ConfirmActionModalProps {
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  overlayClassName?: string;
}

export function ConfirmActionModal({
  title,
  description,
  confirmLabel = "Konfirmasi",
  onConfirm,
  onClose,
  overlayClassName = "bg-white/60 backdrop-blur-sm",
}: ConfirmActionModalProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 ${overlayClassName}`}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-200">
        <h4 className="text-lg font-bold text-gray-900 mb-2">{title}</h4>
        {description && (
          <p className="text-sm text-gray-600 mb-6">{description}</p>
        )}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
