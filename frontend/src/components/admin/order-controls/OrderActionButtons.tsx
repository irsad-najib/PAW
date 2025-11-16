"use client";

import { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const ORDER_ACTION_FLOW: Record<
  OrderStatus,
  { label: string; next: OrderStatus; classes: string } | null
> = {
  accepted: {
    label: "Proses Pesanan",
    next: "processing",
    classes: "bg-yellow-500 hover:bg-yellow-600",
  },
  processing: {
    label: "Tandai Siap",
    next: "ready",
    classes: "bg-green-600 hover:bg-green-700",
  },
  ready: {
    label: "Tandai Selesai",
    next: "completed",
    classes: "bg-blue-600 hover:bg-blue-700",
  },
  completed: null,
  cancelled: null,
};

interface OrderActionButtonProps {
  status: OrderStatus;
  className?: string;
  idlePlaceholder?: React.ReactNode;
  onAction: (nextStatus: OrderStatus, label: string) => void;
}

export function OrderActionButton({
  status,
  className,
  idlePlaceholder = (
    <span className="text-xs text-gray-400">Tidak ada aksi</span>
  ),
  onAction,
}: OrderActionButtonProps) {
  const action = ORDER_ACTION_FLOW[status];

  if (!action) {
    return <>{idlePlaceholder}</>;
  }

  return (
    <button
      onClick={() => onAction(action.next, action.label)}
      className={cn(
        "px-4 py-1.5 text-white text-xs rounded-lg transition-colors",
        action.classes,
        className
      )}
    >
      {action.label}
    </button>
  );
}
