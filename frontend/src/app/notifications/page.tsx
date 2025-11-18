"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/component/utils/navbar";

type Notification = {
  id: string;
  orderId: string;
  type:
    | "order_created"
    | "order_accepted"
    | "order_processing"
    | "order_ready"
    | "order_completed"
    | "payment_success";
  message: string;
  timestamp: string;
  read: boolean;
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Simulasi data notifikasi dari localStorage atau API
    const mockNotifications: Notification[] = [
      {
        id: "notif-1",
        orderId: "ORD-001",
        type: "order_created",
        message: "Pesanan Anda berhasil dibuat. Menunggu konfirmasi admin.",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false,
      },
      {
        id: "notif-2",
        orderId: "ORD-001",
        type: "order_accepted",
        message: "Pesanan Anda telah diterima dan sedang diproses.",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        read: false,
      },
      {
        id: "notif-3",
        orderId: "ORD-001",
        type: "order_processing",
        message: "Pesanan Anda sedang dalam proses pembuatan.",
        timestamp: new Date(Date.now() - 900000).toISOString(),
        read: true,
      },
      {
        id: "notif-4",
        orderId: "ORD-001",
        type: "order_ready",
        message:
          "Pesanan Anda sudah siap! Silakan ambil atau menunggu pengiriman.",
        timestamp: new Date(Date.now() - 300000).toISOString(),
        read: false,
      },
      {
        id: "notif-5",
        orderId: "ORD-002",
        type: "payment_success",
        message:
          "Pembayaran Anda sebesar Rp 150.000 telah berhasil dikonfirmasi.",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        read: true,
      },
    ];

    setNotifications(mockNotifications);
  }, []);

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "order_created":
        return (
          <div className="bg-blue-100 p-2 rounded-full">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
        );
      case "order_accepted":
        return (
          <div className="bg-green-100 p-2 rounded-full">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        );
      case "order_processing":
        return (
          <div className="bg-yellow-100 p-2 rounded-full">
            <svg
              className="w-6 h-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
      case "order_ready":
        return (
          <div className="bg-green-100 p-2 rounded-full">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
      case "order_completed":
        return (
          <div className="bg-green-100 p-2 rounded-full">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
      case "payment_success":
        return (
          <div className="bg-blue-100 p-2 rounded-full">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold">
          <span className="text-lg">←</span>
          <span>Kembali</span>
        </button>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Notifikasi</h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {unreadCount} notifikasi belum dibaca
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as "all" | "unread")}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-800">
                <option value="all" className="text-gray-800">Semua</option>
                <option value="unread" className="text-gray-800">Belum Dibaca</option>
              </select>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                  Tandai Semua Dibaca
                </button>
              )}
            </div>
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <p className="text-gray-500">
                {filter === "unread"
                  ? "Tidak ada notifikasi yang belum dibaca"
                  : "Belum ada notifikasi"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    markAsRead(notif.id);
                    router.push(`/orders?orderId=${notif.orderId}`);
                  }}
                  className={`
                    flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all
                    ${
                      notif.read
                        ? "bg-white border-gray-200 hover:bg-gray-50"
                        : "bg-white border-blue-200 shadow-sm hover:border-blue-300"
                    }
                  `}>
                  {getNotificationIcon(notif.type)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className={`text-sm ${notif.read ? "text-gray-800" : "text-gray-900 font-semibold"}`}>
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-600">
                            {formatTimestamp(notif.timestamp)}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-blue-700 font-semibold">
                            {notif.orderId}
                          </span>
                        </div>
                      </div>

                      {!notif.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
