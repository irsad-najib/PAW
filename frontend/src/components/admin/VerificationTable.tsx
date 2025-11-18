/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Order,
  OrderStatus,
  getUserDisplayName,
  getMenuName,
} from "@/lib/types";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "./order-controls/OrderBadges";
import { OrderActionButton } from "./order-controls/OrderActionButtons";
import { ConfirmActionModal } from "./order-controls/ConfirmActionModal";
import { PaymentScopeModal } from "./order-controls/PaymentScopeModal";
import NotesModal from "./NotesModal";
import { updateOrderStatus, markOrderPaid, markGroupPaid } from "@/lib/api";

interface VerificationTableProps {
  orders: Order[];
}

type ConfirmAction = {
  order: Order;
  nextStatus: OrderStatus;
  label: string;
};

type PaymentAction = {
  order: Order;
  nextStatus?: OrderStatus; // undefined when just paying, set when finishing
};

type OrderDetailModal = Order | null;

export default function VerificationTable({ orders }: VerificationTableProps) {
  const [orderState, setOrderState] = useState<Order[]>(orders);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [timeFilter, setTimeFilter] = useState("Semua Waktu");
  const [typeFilter, setTypeFilter] = useState("Semua Tipe");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null
  );
  const [paymentAction, setPaymentAction] = useState<PaymentAction | null>(
    null
  );
  const [orderDetailModal, setOrderDetailModal] =
    useState<OrderDetailModal>(null);
  const [notesModal, setNotesModal] = useState<{
    title: string;
    notes: string[];
  } | null>(null);

  useEffect(() => {
    setOrderState(orders);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orderState.filter((order) => {
      const matchSearch =
        searchQuery === "" ||
        order._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === "Semua Status" ||
        ORDER_STATUS_LABELS[order.orderStatus] === statusFilter;

      const matchTime =
        timeFilter === "Semua Waktu" || order.deliveryTime === timeFilter;

      const matchType =
        typeFilter === "Semua Tipe" ||
        (typeFilter === "Diantar" && order.deliveryType === "Delivery") ||
        (typeFilter === "Diambil" && order.deliveryType === "Pickup");

      return matchSearch && matchStatus && matchTime && matchType;
    });
  }, [orderState, searchQuery, statusFilter, timeFilter, typeFilter]);

  const setPaymentStatus = (
    orderIds: string[],
    status: "paid" | "unpaid" | "pending"
  ) => {
    setOrderState((prev) =>
      prev.map((order) =>
        orderIds.includes(order._id)
          ? { ...order, paymentStatus: status }
          : order
      )
    );
  };

  const setOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrderState((prev) =>
      prev.map((order) =>
        order._id === orderId ? { ...order, orderStatus: status } : order
      )
    );
  };

  const openPaymentModal = (order: Order, nextStatus?: OrderStatus) => {
    setPaymentAction({ order, nextStatus });
  };

  const handlePaymentSelect = async (scope: "single" | "group") => {
    if (!paymentAction) return;
    const { order, nextStatus } = paymentAction;
    const targetIds =
      scope === "group" && order.groupId
        ? orderState
            .filter((o) => o.groupId === order.groupId)
            .map((o) => o._id)
        : [order._id];

    try {
      // Call API to mark as paid
      if (scope === "group" && order.groupId) {
        await markGroupPaid(order.groupId);
      } else {
        await markOrderPaid(order._id);
      }

      // Update local state
      setPaymentStatus(targetIds, "paid");

      if (nextStatus) {
        // Action triggered from status change (e.g., Tandai Selesai)
        await updateOrderStatus(order._id, nextStatus);
        setOrderStatus(order._id, nextStatus);
      }
    } catch (err: any) {
      console.error("Gagal update pembayaran:", err.message);
      alert("Gagal update pembayaran: " + err.message);
    }

    setPaymentAction(null);
  };

  const openConfirm = (
    order: Order,
    nextStatus: OrderStatus,
    label: string
  ) => {
    // jika nextStatus completed dan masih unpaid, langsung buka modal pembayaran
    if (nextStatus === "completed" && order.paymentStatus === "unpaid") {
      openPaymentModal(order, nextStatus);
      return;
    }
    setConfirmAction({ order, nextStatus, label });
  };

  if (!orders || orders.length === 0) {
    return <p className="text-gray-500">Tidak ada data pesanan.</p>;
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4 md:p-6">
        <div className="mb-4 flex flex-col md:flex-row gap-3 px-0 pt-0">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari ID Pesanan atau Nama Pelanggan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 placeholder:text-gray-500"
            />
          </div>

          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
            <option>Semua Waktu</option>
            <option>Pagi</option>
            <option>Siang</option>
            <option>Sore</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
            <option>Semua Tipe</option>
            <option>Diantar</option>
            <option>Diambil</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-400 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
            <option>Semua Status</option>
            {Object.values(ORDER_STATUS_LABELS).map((label) => (
              <option key={label}>{label}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                  ID
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                  Pelanggan
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                  Pesanan
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                  Waktu / Tipe
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                  Pembayaran
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                  Status
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-6 text-center text-gray-500 text-sm">
                    Tidak ada pesanan yang ditemukan
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const itemsSummary =
                    order.items && order.items.length > 0
                      ? order.items
                          .map(
                            (item) =>
                              `${getMenuName(item.menuId)} x${item.quantity}`
                          )
                          .join(", ")
                      : "-";

                  return (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setOrderDetailModal(order)}
                          className="text-blue-600 hover:underline font-medium">
                          {order._id}
                        </button>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">
                        {order.customerName || getUserDisplayName(order.userId)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">
                        {itemsSummary}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">
                        {order.deliveryTime} /{" "}
                        {order.deliveryType === "Delivery" ? (
                          <span
                            title={
                              order.deliveryAddress || "Alamat belum diisi"
                            }
                            className="underline decoration-dotted decoration-primary cursor-help">
                            Diantar
                          </span>
                        ) : (
                          "Diambil"
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-sm">
                        {order.paymentStatus === "unpaid" ? (
                          <button
                            onClick={() => openPaymentModal(order)}
                            className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors">
                            Belum Lunas
                          </button>
                        ) : (
                          <PaymentStatusBadge status={order.paymentStatus} />
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm">
                        <OrderStatusBadge status={order.orderStatus} />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 min-w-[130px]">
                            <OrderActionButton
                              status={order.orderStatus}
                              onAction={(nextStatus, label) =>
                                openConfirm(order, nextStatus, label)
                              }
                              className="whitespace-nowrap w-full text-center"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmAction && (
        <ConfirmActionModal
          title={confirmAction.label}
          description={`Set status pesanan ${
            confirmAction.order.customerName ?? confirmAction.order._id
          } (ID: ${confirmAction.order._id}) menjadi ${
            ORDER_STATUS_LABELS[confirmAction.nextStatus]
          }?`}
          onClose={() => setConfirmAction(null)}
          onConfirm={async () => {
            try {
              await updateOrderStatus(
                confirmAction.order._id,
                confirmAction.nextStatus
              );
              setOrderStatus(confirmAction.order._id, confirmAction.nextStatus);
            } catch (err: any) {
              console.error("Gagal update status:", err.message);
              alert("Gagal update status: " + err.message);
            }
            setConfirmAction(null);
          }}
        />
      )}

      {paymentAction && (
        <PaymentScopeModal
          customerName={paymentAction.order.customerName}
          groupId={paymentAction.order.groupId}
          orderTotal={paymentAction.order.totalPrice}
          groupTotal={
            paymentAction.order.groupId
              ? orderState
                  .filter((o) => o.groupId === paymentAction.order.groupId)
                  .reduce((sum, o) => sum + o.totalPrice, 0)
              : undefined
          }
          mode={paymentAction.nextStatus ? "status" : "payment"}
          onClose={() => setPaymentAction(null)}
          onSelect={(scope) => handlePaymentSelect(scope)}
        />
      )}

      {orderDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-bold text-gray-900">
                  Detail Pesanan: {orderDetailModal._id}
                </h4>
                <p className="text-sm text-gray-600">
                  {orderDetailModal.customerName ||
                    getUserDisplayName(orderDetailModal.userId)}{" "}
                  • {orderDetailModal.deliveryTime} /{" "}
                  {orderDetailModal.deliveryType === "Delivery"
                    ? "Diantar"
                    : "Diambil"}
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

      {notesModal && (
        <NotesModal
          title={notesModal.title}
          notes={notesModal.notes}
          onClose={() => setNotesModal(null)}
        />
      )}
    </>
  );
}
