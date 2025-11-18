"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/component/api";

interface OrderItem {
  menuId: {
    _id: string;
    name: string;
    price: number;
  };
  quantity: number;
  specialNotes?: string;
}

interface Order {
  _id: string;
  userId: string;
  groupId?: string;
  isGroupMaster: boolean;
  items: OrderItem[];
  orderDates: string[];
  deliveryType: "Delivery" | "Pickup";
  deliveryAddress?: string;
  deliveryTime: "Pagi" | "Siang" | "Sore";
  paymentMethod: "cash" | "transfer";
  paymentStatus: "pending" | "paid" | "unpaid";
  orderStatus: "pending" | "processing" | "completed" | "cancelled";
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

interface OrdersResponse {
  page: number;
  limit: number;
  total: number;
  items: Order[];
}

const OrdersPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get<OrdersResponse>(
        `/orders?page=${page}&limit=${limit}`
      );
      setOrders(response.data.items);
      setTotal(response.data.total);
    } catch (err) {
      setError("Gagal memuat riwayat pesanan");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${
          statusColors[status] || "bg-gray-100 text-gray-800"
        }`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getPaymentBadge = (status: string) => {
    const paymentColors: Record<string, string> = {
      paid: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      unpaid: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${
          paymentColors[status] || "bg-gray-100 text-gray-800"
        }`}>
        {status === "paid"
          ? "LUNAS"
          : status === "unpaid"
          ? "BELUM BAYAR"
          : "MENUNGGU"}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat riwayat pesanan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchOrders}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold">
          <span className="text-lg">←</span>
          <span>Kembali</span>
        </button>

        <div className="mb-8 flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Riwayat Pesanan</h1>
            <p className="mt-1 text-gray-600">Total {total} pesanan</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Anda belum memiliki pesanan</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Pesan Sekarang
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        Order ID: {order._id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(order.createdAt)}
                      </p>
                      {order.groupId && (
                        <p className="text-xs text-blue-600 mt-1">
                          Group ID: {order.groupId}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {getStatusBadge(order.orderStatus)}
                      {getPaymentBadge(order.paymentStatus)}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-800 mb-3">
                      Detail Pesanan:
                    </h3>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <div>
                            <p className="text-gray-800">
                              {item.menuId.name} x {item.quantity}
                            </p>
                            {item.specialNotes && (
                              <p className="text-gray-500 text-xs">
                                Catatan: {item.specialNotes}
                              </p>
                            )}
                          </div>
                          <p className="text-gray-600">
                            {formatCurrency(item.menuId.price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t mt-4 pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Tanggal Pengiriman:</p>
                        <p className="text-gray-800 font-medium">
                          {new Date(order.orderDates[0]).toLocaleDateString(
                            "id-ID",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Waktu Pengiriman:</p>
                        <p className="text-gray-800 font-medium">
                          {order.deliveryTime}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Tipe Pengiriman:</p>
                        <p className="text-gray-800 font-medium">
                          {order.deliveryType}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Metode Pembayaran:</p>
                        <p className="text-gray-800 font-medium">
                          {order.paymentMethod === "cash"
                            ? "Tunai"
                            : "Transfer"}
                        </p>
                      </div>
                      {order.deliveryType === "Delivery" &&
                        order.deliveryAddress && (
                          <div className="col-span-2">
                            <p className="text-gray-500">Alamat Pengiriman:</p>
                            <p className="text-gray-800 font-medium">
                              {order.deliveryAddress}
                            </p>
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="border-t mt-4 pt-4 flex justify-between items-center">
                    <p className="text-lg font-bold text-gray-900">Total:</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(order.totalPrice)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  Previous
                </button>
                <span className="px-4 py-2 bg-white border rounded">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
