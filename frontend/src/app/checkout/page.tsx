/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/component/api";
import { useAuth } from "@/contexts/AuthContext";

interface CartItem {
  menu: any;
  quantity: number;
  notes: string;
  orderDate?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [deliveryType, setDeliveryType] = useState<"Delivery" | "Pickup">(
    "Delivery"
  );
  const [deliveryTime, setDeliveryTime] = useState<"Pagi" | "Siang" | "Sore">(
    "Pagi"
  );
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">(
    "cash"
  );
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    // Load cart from sessionStorage
    const cartData = sessionStorage.getItem("cart");
    const dateData = sessionStorage.getItem("selectedDate");

    if (!cartData || !dateData) {
      router.push("/");
      return;
    }

    setCart(JSON.parse(cartData));
    try {
      const parsed = JSON.parse(dateData);
      if (Array.isArray(parsed)) {
        setSelectedDates(parsed.filter(Boolean));
        return;
      }
    } catch {
      /* fallback to single string */
    }
    setSelectedDates([dateData]);
  }, [authLoading, user, router]);

  // Fallback: derive dates from cart if none parsed
  useEffect(() => {
    if (selectedDates.length === 0 && cart.length > 0) {
      const derived = Array.from(
        new Set(
          cart
            .map((it) => it.orderDate)
            .filter((d): d is string => typeof d === "string" && d.length > 0)
        )
      );
      if (derived.length > 0) {
        setSelectedDates(derived);
      }
    }
  }, [cart, selectedDates.length]);

  const groupCartByDate = () => {
    const map = new Map<string, CartItem[]>();
    cart.forEach((item) => {
      const key = item.orderDate || "Tanggal tidak diketahui";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const getTotalPrice = () => {
    return cart.reduce(
      (total, item) => total + item.menu.price * item.quantity,
      0
    );
  };

  const handleSubmitOrder = async () => {
    if (!customerName || !customerPhone) {
      setError("Nama dan nomor telepon wajib diisi!");
      return;
    }

    if (deliveryType === "Delivery" && !deliveryAddress) {
      setError("Alamat pengiriman wajib diisi untuk delivery!");
      return;
    }
    if (!selectedDates.length) {
      setError("Tanggal pengiriman tidak ditemukan.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const orderData = {
        items: cart.map((item) => ({
          menuId: item.menu._id,
          quantity: item.quantity,
          specialNotes: item.notes || undefined,
        })),
        orderDates: selectedDates,
        deliveryType,
        deliveryTime,
        deliveryAddress:
          deliveryType === "Delivery" ? deliveryAddress : undefined,
        paymentMethod,
        customerName,
        customerPhone,
      };

      await api.post("/orders", orderData);

      // Clear cart
      sessionStorage.removeItem("cart");
      sessionStorage.removeItem("selectedDate");

      // Redirect to success page or orders page
      alert("Pesanan berhasil dibuat!");
      router.push("/orders");
    } catch (err: any) {
      console.error("Order error:", err);
      setError(
        err.response?.data?.message ||
          "Gagal membuat pesanan. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => router.back()}
          className="mb-6 text-green-600 hover:text-green-700 font-semibold flex items-center gap-2">
          ← Kembali
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Checkout Pesanan
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Informasi Pemesan
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Telepon *
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="08123456789"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Info (disederhanakan, hanya tipe & waktu) */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Informasi Pengiriman
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Waktu Pengiriman *
                  </label>
                  <div className="flex gap-3">
                    {["Pagi", "Siang", "Sore"].map((time) => (
                      <button
                        key={time}
                        onClick={() => setDeliveryTime(time as any)}
                        className={`flex-1 py-2 rounded-lg font-semibold transition ${
                          deliveryTime === time
                            ? "bg-green-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}>
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipe Pengiriman *
                  </label>
                  <div className="flex gap-3">
                    {[
                      { value: "Delivery", label: "Diantar" },
                      { value: "Pickup", label: "Diambil" },
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setDeliveryType(type.value as any)}
                        className={`flex-1 py-2 rounded-lg font-semibold transition ${
                          deliveryType === type.value
                            ? "bg-green-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}>
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {deliveryType === "Delivery" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alamat Pengiriman *
                    </label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masukkan alamat lengkap"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Metode Pembayaran
              </h2>
              <div className="flex gap-3">
                {[
                  { value: "cash", label: "Tunai (Cash)" },
                  { value: "transfer", label: "Transfer" },
                ].map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value as any)}
                    className={`flex-1 py-2 rounded-lg font-semibold transition ${
                      paymentMethod === method.value
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}>
                    {method.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Ringkasan Pesanan
              </h2>

              <div className="space-y-4 mb-4">
                {groupCartByDate().map(([dateKey, items]) => {
                  const label = new Date(dateKey).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                  });
                  return (
                    <div key={dateKey} className="space-y-2">
                      <p className="font-semibold text-gray-800">{label}</p>
                      {items.map((item) => (
                        <div
                          key={`${dateKey}-${item.menu._id}`}
                          className="flex gap-3">
                          {item.menu.image ? (
                            <Image
                              src={item.menu.image}
                              alt={item.menu.name}
                              width={60}
                              height={60}
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded" />
                          )}
                          <div className="flex-grow">
                            <h3 className="font-semibold text-sm text-gray-900">
                              {item.menu.name}
                            </h3>
                            <p className="text-xs text-gray-600">
                              {item.quantity} x Rp{" "}
                              {item.menu.price?.toLocaleString("id-ID")}
                            </p>
                            {item.notes && (
                              <p className="text-xs text-gray-500 italic mt-1">
                                Catatan: {item.notes}
                              </p>
                            )}
                          </div>
                          <div className="font-semibold text-sm text-gray-900">
                            Rp{" "}
                            {(item.menu.price * item.quantity).toLocaleString(
                              "id-ID"
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-green-600">
                    Rp {getTotalPrice().toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmitOrder}
                disabled={loading}
                className="w-full mt-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? "Memproses..." : "Buat Pesanan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
