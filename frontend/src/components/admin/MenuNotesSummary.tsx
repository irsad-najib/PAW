"use client";

interface MenuNotes {
  name: string;
  portions: number;
  notes: string[];
}

interface MenuNotesSummaryProps {
  title: string;
  subtitle?: string;
  menus: MenuNotes[];
  onOpenNotes?: (menuName: string, notes: string[]) => void;
}

export default function MenuNotesSummary({
  title,
  subtitle,
  menus,
  onOpenNotes,
}: MenuNotesSummaryProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
      </div>

      {menus.length === 0 ? (
        <p className="text-sm text-gray-500">Tidak ada data ringkasan.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Menu
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Total Porsi
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Catatan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {menus.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {item.portions} Porsi
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {item.notes.length > 0 ? (
                      <button
                        onClick={() => onOpenNotes && onOpenNotes(item.name, item.notes)}
                        className="inline-flex items-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 text-xs font-semibold"
                        disabled={!onOpenNotes}
                      >
                        Lihat {item.notes.length} Catatan
                      </button>
                    ) : (
                      <span className="text-gray-400">Tidak ada catatan</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
