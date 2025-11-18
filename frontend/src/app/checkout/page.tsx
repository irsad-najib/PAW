"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/component/utils/navbar";
import api from "@/component/api";
import { Menu, OrderDeliveryTime } from "@/lib/types";

type CartItem = {
  menu: Menu;
  quantity: number;
  date?: string;
  deliveryTime?: OrderDeliveryTime;
  specialNotes?: string;
  notes?: string;
  orderDate?: string;
};

type GroupedOrder = {
  date: string;
  deliveryTime: OrderDeliveryTime;
  items: CartItem[];
  subtotal: number;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [deliveryType, setDeliveryType] = useState<"Delivery" | "Pickup">("Delivery");
  const [deliveryTime, setDeliveryTime] = useState<"Pagi" | "Siang" | "Sore">("Pagi");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">("cash");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/checkout");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const loadCart = () => {
      const cartData = localStorage.getItem("cart");
      if (cartData) {
        try {
          const parsed = JSON.parse(cartData);
          setCart(parsed);
        } catch (error) {
          console.error("Failed to parse cart:", error);
        }
      }
    };

    loadCart();

    if (user) {
      setCustomerName(user.name || user.username || "");
    }
  }, [user]);

  useEffect(() => {
    if (selectedDates.length === 0 && cart.length > 0) {
      const derived = Array.from(
        new Set(
          cart
            .map((it) => it.orderDate || it.date)
            .filter((d): d is string => typeof d === "string" && d.length > 0)
        )
      );
      if (derived.length > 0) {
        setSelectedDates(derived);
      }
    }
  }, [cart, selectedDates.length]);

  // Group cart items by date and delivery time
  const groupedOrders: GroupedOrder[] = [];
  const grouped = new Map<string, CartItem[]>();

  cart.forEach((item) => {
    const key = `${item.date || item.orderDate || "today"}_${item.deliveryTime || "Pagi"}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)?.push(item);
  });

  grouped.forEach((items, key) => {
    const [date, deliveryTimeStr] = key.split("_");
    const subtotal = items.reduce(
      (sum, item) => sum + (item.menu.price || 0) * item.quantity,
      0
    );
    groupedOrders.push({
      date,
      deliveryTime: deliveryTimeStr as OrderDeliveryTime,
      items,
      subtotal,
    });
  });

  groupedOrders.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const grandTotal = groupedOrders.reduce(
    (sum, group) => sum + group.subtotal,
    0
  );

  const groupCartByDate = () => {
    const map = new Map<string, CartItem[]>();
    cart.forEach((item) => {
      const key = item.orderDate || item.date || "Tanggal tidak diketahui";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const getTotalPrice = () => {
    return cart.reduce(
      (total, item) => total + (item.menu.price || 0) * item.quantity,
      0
    );
  };

  const handleCheckout = async () => {
    if (!customerName || !customerPhone) {
      alert("Mohon isi nama dan nomor telepon");
      return;
    }

    if (deliveryType === "Delivery" && !deliveryAddress) {
      alert("Mohon isi alamat pengiriman");
      return;
    }

    if (groupedOrders.length === 0) {
      alert("Keranjang kosong");
      return;
    }

    setIsProcessing(true);

    try {
      const uniqueDates = [...new Set(cart.map((item) => item.date || item.orderDate))];

      if (uniqueDates.length === 1) {
        // Single order
        const orderData = {
          items: cart.map((item) => ({
            menuId: item.menu._id,
            quantity: item.quantity,
            specialNotes: item.specialNotes || item.notes || "",
          })),
          orderDate: uniqueDates[0],
          deliveryType,
          deliveryAddress: deliveryType === "Delivery" ? deliveryAddress : undefined,
          deliveryTime,
          paymentMethod,
          customerName,
          customerPhone,
        };

        const response = await api.post("/orders", orderData);
        localStorage.removeItem("cart");
        alert("Pesanan berhasil dibuat!");
        router.push(`/orders?orderId=${response.data._id}`);
      } else {
        // Multi-day orders
        const ordersByDate = uniqueDates.map((date) => {
          const itemsForDate = cart.filter((item) => (item.date || item.orderDate) === date);
          return {
            orderDate: date,
            items: itemsForDate.map((item) => ({
              menuId: item.menu._id,
              quantity: item.quantity,
              specialNotes: item.specialNotes || item.notes || "",
            })),
            deliveryTime,
          };
        });

        const multiDayData = {
          orders: ordersByDate,
          deliveryType,
          deliveryAddress: deliveryType === "Delivery" ? deliveryAddress : undefined,
          paymentMethod,
          customerName,
          customerPhone,
        };

        await api.post("/orders/multi-day", multiDayData);
        localStorage.removeItem("cart");
        alert(`Berhasil membuat ${uniqueDates.length} pesanan untuk ${uniqueDates.length} hari!`);
        router.push("/orders");
      }
    } catch (error: unknown) {
      console.error("Checkout error:", error);
      const errorMessage = error instanceof Error ? error.message : "Gagal membuat pesanan. Silakan coba lagi.";
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const removeItem = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
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

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {groupedOrders.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <p className="text-gray-500 mb-4">Keranjang kosong</p>
                <button
                  onClick={() => router.push("/")}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Pilih Menu
                </button>
              </div>
            ) : (
              <>
                {groupedOrders.map((group, groupIdx) => (
                  <div key={groupIdx} className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">
                          {formatDate(group.date)}
                        </h2>
                        <p className="text-sm text-gray-600">
                          Waktu: <span className="font-medium">{group.deliveryTime}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Subtotal</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatRupiah(group.subtotal)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {group.items.map((item, itemIdx) => {
                        const cartIdx = cart.findIndex(
                          (c) =>
                            c.menu._id === item.menu._id &&
                            (c.date || c.orderDate) === group.date &&
                            (c.deliveryTime || "Pagi") === group.deliveryTime
                        );

                        return (
                          <div key={itemIdx} className="flex items-center justify-between border-b pb-3 last:border-0">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-800">{item.menu.name}</h3>
                              <p className="text-sm text-gray-600">
                                {formatRupiah(item.menu.price || 0)} × {item.quantity}
                              </p>
                              {(item.specialNotes || item.notes) && (
                                <p className="text-xs text-blue-600 mt-1">
                                  Catatan: {item.specialNotes || item.notes}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <p className="font-bold text-gray-800">
                                {formatRupiah((item.menu.price || 0) * item.quantity)}
                              </p>
                              <button
                                onClick={() => removeItem(cartIdx)}
                                className="text-red-600 hover:text-red-700">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {groupedOrders.length > 1 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Multi-Hari:</strong> Pesanan Anda mencakup {groupedOrders.length} hari berbeda. 
                      Setiap hari akan dibuat sebagai pesanan terpisah dengan informasi pengiriman yang sama.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: Customer Info & Payment */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Informasi Pelanggan</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nama Anda"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon *</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Informasi Pengiriman</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Waktu Pengiriman *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Pengiriman *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDeliveryType("Delivery")}
                      className={`px-4 py-2 rounded-lg border ${
                        deliveryType === "Delivery"
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-white text-gray-700 border-gray-300"
                      }`}>
                      Diantar
                    </button>
                    <button
                      onClick={() => setDeliveryType("Pickup")}
                      className={`px-4 py-2 rounded-lg border ${
                        deliveryType === "Pickup"
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-white text-gray-700 border-gray-300"
                      }`}>
                      Diambil
                    </button>
                  </div>
                </div>

                {deliveryType === "Delivery" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Pengiriman *</label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Alamat lengkap pengiriman"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Metode Pembayaran</h2>
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

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Ringkasan Pesanan</h2>

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
                        <div key={`${dateKey}-${item.menu._id}`} className="flex gap-3">
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
                          <div className="grow">
                            <h3 className="font-semibold text-sm text-gray-900">{item.menu.name}</h3>
                            <p className="text-xs text-gray-600">
                              {item.quantity} x Rp {(item.menu.price || 0).toLocaleString("id-ID")}
                            </p>
                            {item.notes && (
                              <p className="text-xs text-gray-500 italic mt-1">Catatan: {item.notes}</p>
                            )}
                          </div>
                          <div className="font-semibold text-sm text-gray-900">
                            Rp {((item.menu.price || 0) * item.quantity).toLocaleString("id-ID")}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between text-xl font-bold text-gray-800">
                  <span>Total</span>
                  <span className="text-green-600">Rp {getTotalPrice().toLocaleString("id-ID")}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isProcessing || groupedOrders.length === 0}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                {isProcessing ? "Memproses..." : "Buat Pesanan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}