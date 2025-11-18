/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Order,
  OrderDeliveryType,
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderStatus,
  getUserDisplayName,
  getMenuName,
} from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "./order-controls/OrderBadges";
import { OrderActionButton } from "./order-controls/OrderActionButtons";
import { PaymentScopeModal } from "./order-controls/PaymentScopeModal";
import { ConfirmActionModal } from "./order-controls/ConfirmActionModal";
import { updateOrderStatus, markOrderPaid, markGroupPaid } from "@/lib/api";

interface OrdersDetailTableProps {
  selectedDate: string;
  orders: Order[];
  onDataChanged?: () => void;
}

type TableOrder = {
  id: string;
  date: string;
  customer: string;
  itemsSummary: string;
  time: Order["deliveryTime"];
  type: OrderDeliveryType;
  deliveryAddress?: string;
  customerPhone?: string;
  items: Order["items"];
  total: number;
  paymentStatus: OrderPaymentStatus;
  paymentMethod: OrderPaymentMethod;
  orderStatus: OrderStatus;
  groupId?: string;
};

type PaymentModalData = {
  order: TableOrder;
  mode: "payment" | "status";
  nextStatus?: OrderStatus;
};

type ConfirmAction = {
  order: TableOrder;
  nextStatus: OrderStatus;
  label: string;
};

export default function OrdersDetailTable({
  selectedDate,
  orders,
  onDataChanged,
}: OrdersDetailTableProps) {
  const [filters, setFilters] = useState({
    search: "",
    date: selectedDate,
    time: "",
    type: "",
    payment: "",
    status: "",
  });
  const [orderState, setOrderState] = useState<Order[]>(orders);
  const [paymentModal, setPaymentModal] = useState<PaymentModalData | null>(
    null
  );
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null
  );
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [orderDetailModal, setOrderDetailModal] = useState<TableOrder | null>(
    null
  );

  useEffect(() => {
    setFilters((prev) => ({ ...prev, date: selectedDate || "" }));
  }, [selectedDate]);

  useEffect(() => {
    setOrderState(orders);
  }, [orders]);

  const handleAdvanceStatus = (id: string, nextStatus: OrderStatus) => {
    setOrderState((prev) =>
      prev.map((order) =>
        order._id === id ? { ...order, orderStatus: nextStatus } : order
      )
    );
  };

  const setPaymentStatus = (orderIds: string[], status: OrderPaymentStatus) => {
    setOrderState((prev) =>
      prev.map((order) =>
        orderIds.includes(order._id)
          ? { ...order, paymentStatus: status }
          : order
      )
    );
  };

  const requestAdvanceStatus = (
    order: TableOrder,
    nextStatus: OrderStatus,
    label: string
  ) => {
    if (nextStatus === "completed" && order.paymentStatus === "unpaid") {
      setPaymentModal({ order, mode: "status", nextStatus });
      return;
    }
    setConfirmAction({ order, nextStatus, label });
  };

  const proceedAfterConfirm = (order: TableOrder, nextStatus: OrderStatus) => {
    handleAdvanceStatus(order.id, nextStatus);
  };

  const requestCancel = (order: TableOrder) => {
    setConfirmAction({
      order,
      nextStatus: "cancelled",
      label: "Batalkan Pesanan",
    });
  };

  const tableOrders = useMemo<TableOrder[]>(() => {
    return orderState.map((order) => {
      const orderDate = order.orderDates?.[0]
        ? order.orderDates[0].split("T")[0]
        : "";
      const itemsSummary =
        order.items && order.items.length > 0
          ? order.items
              .map((item) => `${getMenuName(item.menuId)} x${item.quantity}`)
              .join(", ")
          : "-";
      return {
        id: order._id,
        date: orderDate,
        customer: order.customerName ?? getUserDisplayName(order.userId),
        itemsSummary,
        time: order.deliveryTime,
        type: order.deliveryType,
        deliveryAddress: order.deliveryAddress,
        customerPhone: order.customerPhone,
        total: order.totalPrice,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        orderStatus: order.orderStatus,
        groupId: order.groupId,
        items: order.items,
      };
    });
  }, [orderState]);

  const filteredOrders = useMemo(() => {
    const searchLower = filters.search.toLowerCase();

    return tableOrders.filter((order) => {
      const matchSearch =
        searchLower === "" ||
        order.id.toLowerCase().includes(searchLower) ||
        order.customer.toLowerCase().includes(searchLower);

      const matchDate = filters.date ? order.date === filters.date : true;
      const matchTime = filters.time ? order.time === filters.time : true;
      const matchType = filters.type ? order.type === filters.type : true;
      const matchPayment = filters.payment
        ? order.paymentMethod === filters.payment
        : true;
      const matchStatus = filters.status
        ? order.orderStatus === filters.status
        : true;

      return (
        matchSearch &&
        matchDate &&
        matchTime &&
        matchType &&
        matchPayment &&
        matchStatus
      );
    });
  }, [filters, tableOrders]);

  const totalOrders = filteredOrders.length;
  const totalAmount = filteredOrders.reduce(
    (sum, order) => sum + order.total,
    0
  );

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const openPaymentModal = (
    order: TableOrder,
    mode: "payment" | "status",
    nextStatus?: OrderStatus
  ) => {
    setPaymentModal({ order, mode, nextStatus });
  };

  const handlePaymentSelect = async (scope: "single" | "group") => {
    if (!paymentModal) return;
    const { order, mode, nextStatus } = paymentModal;

    const targetIds =
      scope === "group" && order.groupId
        ? orderState
            .filter((o) => o.groupId === order.groupId)
            .map((o) => o._id)
        : [order.id];

    try {
      // Call API to mark as paid
      if (scope === "group" && order.groupId) {
        await markGroupPaid(order.groupId);
      } else {
        await markOrderPaid(order.id);
      }

      // Update local state
      setPaymentStatus(targetIds, "paid");

      // Status selalu hanya order ini saja yang berubah
      if (mode === "status" && nextStatus) {
        await updateOrderStatus(order.id, nextStatus);
        handleAdvanceStatus(order.id, nextStatus);
      }
      onDataChanged?.();
    } catch (err: any) {
      console.error("Gagal update pembayaran:", err.message);
      alert("Gagal update pembayaran: " + err.message);
    }

    setPaymentModal(null);
  };

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Daftar Detail Pesanan
        </h2>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Cari ID Pesanan atau Nama Pelanggan..."
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 placeholder:text-gray-400 text-sm"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>

          <input
            type="date"
            name="date"
            value={filters.date}
            onChange={handleFilterChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 text-sm"
          />

          <select
            name="time"
            value={filters.time}
            onChange={handleFilterChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 text-sm">
            <option value="">Semua Waktu</option>
            <option value="Pagi">Pagi</option>
            <option value="Siang">Siang</option>
            <option value="Sore">Sore</option>
          </select>

          <select
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 text-sm">
            <option value="">Semua Tipe</option>
            <option value="Delivery">Diantar</option>
            <option value="Pickup">Diambil</option>
          </select>

          <select
            name="payment"
            value={filters.payment}
            onChange={handleFilterChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 text-sm">
            <option value="">Semua Pembayaran</option>
            <option value="cash">Cash</option>
            <option value="transfer">Transfer</option>
          </select>

          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 text-sm">
            <option value="">Semua Status</option>
            {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <p className="text-sm text-gray-700 mb-2">
          Menampilkan{" "}
          <span className="font-semibold text-gray-900">{totalOrders}</span>{" "}
          pesanan. Total tagihan:{" "}
          <span className="font-semibold text-gray-900">
            {formatRupiah(totalAmount)}
          </span>
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Pelanggan
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Pesanan
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Waktu / Tipe
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                  Status Pembayaran
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setOrderDetailModal(order)}
                        className="text-blue-600 hover:underline font-medium">
                        {order.id}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.date || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.itemsSummary}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.time} /{" "}
                      {order.type === "Delivery" ? (
                        <span
                          title={order.deliveryAddress || "Alamat belum diisi"}
                          className="underline decoration-dotted decoration-primary cursor-help">
                          Diantar
                        </span>
                      ) : (
                        "Diambil"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {formatRupiah(order.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {order.paymentStatus === "unpaid" ? (
                        <button
                          onClick={() => openPaymentModal(order, "payment")}
                          className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors">
                          Belum Lunas
                        </button>
                      ) : (
                        <PaymentStatusBadge status={order.paymentStatus} />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <OrderStatusBadge status={order.orderStatus} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 min-w-[130px]">
                          <OrderActionButton
                            status={order.orderStatus}
                            onAction={(nextStatus, label) =>
                              requestAdvanceStatus(order, nextStatus, label)
                            }
                            className="whitespace-nowrap w-full text-center"
                          />
                        </div>
                        {order.orderStatus !== "completed" &&
                          order.orderStatus !== "cancelled" && (
                            <button
                              onClick={() => requestCancel(order)}
                              disabled={cancellingId === order.id}
                              className="px-4 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed">
                              {cancellingId === order.id
                                ? "Memproses..."
                                : "Batalkan"}
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-4 text-center text-gray-500">
                    Tidak ada pesanan yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {orderDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-bold text-gray-900">
                  Detail Pesanan: {orderDetailModal.id}
                </h4>
                <p className="text-sm text-gray-600">
                  {orderDetailModal.customer} • {orderDetailModal.time} /{" "}
                  {orderDetailModal.type === "Delivery" ? "Diantar" : "Diambil"}
                </p>
              </div>
              <button
                onClick={() => setOrderDetailModal(null)}
                className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm text-gray-800">
              <div>
                <p>
                  <span className="font-semibold">Pembayaran:</span>{" "}
                  {PAYMENT_STATUS_LABELS[orderDetailModal.paymentStatus]}
                </p>
                <p>
                  <span className="font-semibold">Status Order:</span>{" "}
                  {ORDER_STATUS_LABELS[orderDetailModal.orderStatus]}
                </p>
              </div>
              <div>
                <p>
                  <span className="font-semibold">Alamat:</span>{" "}
                  {orderDetailModal.deliveryAddress || "-"}
                </p>
                <p>
                  <span className="font-semibold">Telepon:</span>{" "}
                  {orderDetailModal.customerPhone || "-"}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <h5 className="text-sm font-semibold text-gray-900 mb-2">
                Item Dipesan
              </h5>
              {orderDetailModal.items.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
                  {orderDetailModal.items.map((item, idx) => (
                    <li key={idx}>
                      {getMenuName(item.menuId)} x{item.quantity}{" "}
                      {item.specialNotes ? `(${item.specialNotes})` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Tidak ada item.</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setOrderDetailModal(null)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentModal && (
        <PaymentScopeModal
          customerName={paymentModal.order.customer}
          groupId={paymentModal.order.groupId}
          orderTotal={paymentModal.order.total}
          groupTotal={
            paymentModal.order.groupId
              ? orderState
                  .filter((o) => o.groupId === paymentModal.order.groupId)
                  .reduce((sum, o) => sum + o.totalPrice, 0)
              : undefined
          }
          mode={paymentModal.mode}
          onClose={() => setPaymentModal(null)}
          onSelect={(scope) => handlePaymentSelect(scope)}
        />
      )}

      {confirmAction && (
        <ConfirmActionModal
          title={confirmAction.label}
          description={`Set status pesanan ${
            confirmAction.order.customer
          } (ID: ${confirmAction.order.id}) menjadi ${
            ORDER_STATUS_LABELS[confirmAction.nextStatus]
          }?`}
          onClose={() => setConfirmAction(null)}
          onConfirm={async () => {
            try {
              if (confirmAction.nextStatus === "cancelled") {
                setCancellingId(confirmAction.order.id);
              }
              const updated = await updateOrderStatus(
                confirmAction.order.id,
                confirmAction.nextStatus
              );
              const updatedOrder = (updated as any)?.order;
              if (updatedOrder) {
                setOrderState((prev) =>
                  prev.map((o) =>
                    o._id === updatedOrder._id
                      ? {
                          ...o,
                          orderStatus: updatedOrder.orderStatus,
                          paymentStatus: updatedOrder.paymentStatus ?? o.paymentStatus,
                        }
                      : o
                  )
                );
              } else {
                proceedAfterConfirm(
                  confirmAction.order,
                  confirmAction.nextStatus
                );
              }
              onDataChanged?.();
            } catch (err: any) {
              console.error("Gagal update status:", err.message);
              alert("Gagal update status: " + err.message);
            }
            setCancellingId(null);
            setConfirmAction(null);
          }}
        />
      )}
    </>
  );
}
