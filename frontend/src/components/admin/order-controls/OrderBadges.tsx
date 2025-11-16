"use client";

import { OrderPaymentStatus, OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  accepted: "Order Masuk",
  processing: "Diproses",
  ready: "Ready",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  accepted: "bg-blue-100 text-blue-700",
  processing: "bg-yellow-100 text-yellow-700",
  ready: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full",
        ORDER_STATUS_STYLE[status],
        className
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

export const PAYMENT_STATUS_LABELS: Record<OrderPaymentStatus, string> = {
  pending: "Menunggu",
  paid: "Lunas",
  unpaid: "Belum Lunas",
};

const PAYMENT_STATUS_STYLE: Record<OrderPaymentStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700 border border-yellow-300",
  paid: "bg-green-100 text-green-700 border border-green-300",
  unpaid: "bg-red-100 text-red-700 border border-red-300",
};

export function PaymentStatusBadge({
  status,
  className,
}: {
  status: OrderPaymentStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full",
        PAYMENT_STATUS_STYLE[status],
        className
      )}
    >
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  );
}
