"use client";

interface NotesModalProps {
  title?: string;
  customerName?: string;
  notes: string[];
  onClose: () => void;
}

export default function NotesModal({
  title = "Catatan",
  customerName,
  notes,
  onClose,
}: NotesModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-200">
        <h4 className="text-lg font-bold text-gray-900 mb-3">
          {title} {customerName ? `- ${customerName}` : ""}
        </h4>

        {notes.length === 0 ? (
          <p className="text-sm text-gray-600 mb-6">Tidak ada catatan.</p>
        ) : (
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-800 mb-6">
            {notes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        )}

        <button
          onClick={onClose}
          className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
