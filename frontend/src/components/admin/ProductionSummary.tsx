"use client";

import { useEffect, useState } from "react";
import { ConfirmActionModal } from "./order-controls/ConfirmActionModal";

interface MenuItemData {
  name: string;
  portions: number;
  notes?: string;
}

interface MealTimeData {
  mealTime: string;
  totalPortions: number;
  items: MenuItemData[];
}

type MealStatus = "pending" | "processing" | "ready";

interface ProductionSummaryProps {
  date?: string;
  mealData: MealTimeData[];
  onOpenNotes?: (menuLabel: string, notes: string[]) => void;
}

type ConfirmAction = {
  mealIndex: number;
  nextStatus: MealStatus;
  title: string;
  description: string;
};

export default function ProductionSummary({
  mealData,
  onOpenNotes,
}: ProductionSummaryProps) {
  const [mealStatuses, setMealStatuses] = useState<MealStatus[]>([]);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null
  );

  useEffect(() => {
    setMealStatuses(mealData.map(() => "pending"));
  }, [mealData]);

  const requestStatusChange = (
    mealIndex: number,
    nextStatus: MealStatus,
    mealLabel: string,
    actionLabel: string
  ) => {
    setConfirmAction({
      mealIndex,
      nextStatus,
      title: actionLabel,
      description: `Ubah semua pesanan slot ${mealLabel} menjadi ${actionLabel}?`,
    });
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    const { mealIndex, nextStatus } = confirmAction;
    setMealStatuses((prev) =>
      prev.map((status, idx) => (idx === mealIndex ? nextStatus : status))
    );
    setConfirmAction(null);
  };

  return (
    <>
      {confirmAction && (
        <ConfirmActionModal
          title={confirmAction.title}
          description={confirmAction.description}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirm}
          overlayClassName="bg-white/70 backdrop-blur-sm"
        />
      )}

      <div className="space-y-6">
        {mealData.map((meal, index) => {
          const status = mealStatuses[index] ?? "pending";

          return (
            <div key={index} className="border-b pb-6 last:border-b-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  {meal.mealTime}
                </h3>

                <div className="flex items-center gap-2">
                  {status === "pending" && (
                    <button
                      onClick={() =>
                        requestStatusChange(
                          index,
                          "processing",
                          meal.mealTime,
                          "Proses Pesanan"
                        )
                      }
                      className="px-4 py-2 bg-yellow-500 text-white text-sm font-semibold rounded-lg hover:bg-yellow-600 transition-colors whitespace-nowrap"
                    >
                      Proses Pesanan
                    </button>
                  )}

                  {status === "processing" && (
                    <button
                      onClick={() =>
                        requestStatusChange(
                          index,
                          "ready",
                          meal.mealTime,
                          "Tandai Siap"
                        )
                      }
                      className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                    >
                      Tandai Siap
                    </button>
                  )}

                  {status === "ready" && (
                    <span className="px-3 py-1 text-sm font-semibold text-green-700 bg-green-100 rounded-lg">
                      Semua Pesanan Siap
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="text-left text-gray-600 text-sm">
                      <th className="w-40">Menu</th>
                      <th className="w-24 text-center">Porsi</th>
                      <th className="w-32 text-right">Catatan</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {meal.items.map((item, itemIndex) => {
                      const notesArray = Array.isArray(item.notes)
                        ? item.notes
                        : item.notes
                        ? [item.notes]
                        : [];

                      return (
                        <tr key={itemIndex} className="hover:bg-gray-50">
                          <td className="py-3 pr-2 text-gray-800 font-medium">
                            {item.name}
                          </td>
                          <td className="py-3 px-2 text-center whitespace-nowrap">
                            <span className="text-green-600 font-bold">
                              {item.portions} Porsi
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right whitespace-nowrap">
                            {notesArray.length > 0 ? (
                              <button
                                onClick={() =>
                                  onOpenNotes &&
                                  onOpenNotes(
                                    `${meal.mealTime} - ${item.name}`,
                                    notesArray
                                  )
                                }
                                className="inline-flex items-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 text-xs font-semibold"
                                disabled={!onOpenNotes}
                              >
                                Lihat {notesArray.length} Catatan
                              </button>
                            ) : (
                              <span className="text-gray-400">
                                Tanpa Catatan
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
