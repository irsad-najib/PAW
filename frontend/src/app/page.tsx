/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useRef, useEffect } from "react";
import Navbar from "../component/utils/navbar";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel } from "swiper/modules";
import "swiper/css";
import api from "../component/api";
import { useRouter } from "next/navigation";

interface CartItem {
  menu: any;
  quantity: number;
  notes: string;
  orderDate: string; // YYYY-MM-DD
}

export default function HomePage() {
  // 30 hari ke depan
  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const router = useRouter();
  const [selected, setSelected] = useState<Date | null>(dates[0]);
  const [menus, setMenus] = useState<any[]>([]);
  const [scrollIndex, setScrollIndex] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const swiperRef = useRef<any>(null);

  const selectedDateKey = selected
    ? selected.toISOString().split("T")[0]
    : "";

  const onSelect = (date: Date) => {
    setSelected(date);
  };

  const addToCart = (menu: any) => {
    if (!selectedDateKey) return;
    const existing = cart.find(
      (item) => item.menu._id === menu._id && item.orderDate === selectedDateKey
    );
    if (existing) {
      setCart(
        cart.map((item) =>
          item.menu._id === menu._id && item.orderDate === selectedDateKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { menu, quantity: 1, notes: "", orderDate: selectedDateKey }]);
    }
  };

  const updateQuantity = (menuId: string, orderDate: string, delta: number) => {
    setCart(
      cart
        .map((item) =>
          item.menu._id === menuId && item.orderDate === orderDate
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const updateNotes = (menuId: string, orderDate: string, notes: string) => {
    setCart(
      cart.map((item) =>
        item.menu._id === menuId && item.orderDate === orderDate ? { ...item, notes } : item
      )
    );
  };

  const removeFromCart = (menuId: string, orderDate: string) => {
    setCart(cart.filter((item) => !(item.menu._id === menuId && item.orderDate === orderDate)));
  };

  const getTotalPrice = () => {
    return cart.reduce(
      (total, item) => total + item.menu.price * item.quantity,
      0
    );
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  useEffect(() => {
    // Fetch menus and filter by selected date using backend `date` query param
    const fetchMenus = async () => {
      try {
        const params: any = { page: 1, limit: 50 };
        if (selected) {
          // backend accepts a date string; send ISO string to be safe
          params.date = selected.toISOString();
        }
        const res = await api.get("/menu", { params });
        // backend responds { page, limit, total, items }
        console.log("Fetched menus:", res.data);
        setMenus(res.data?.items || []);
      } catch (error) {
        console.error("Failed to load menus:", error);
        setMenus([]);
      }
    };
    fetchMenus();
  }, [selected]);

  const uniqueDates = Array.from(new Set(cart.map((c) => c.orderDate).filter(Boolean)));

  return (
    <>
      <Navbar />
      <div className="bg-[#F7F7F7] text-black min-h-screen w-full">
        <Image
          src="/home-bg.png"
          alt="Home Illustration"
          width={10000}
          height={400}
          className="w-full h-48 object-cover md:h-72"
        />
        <div className="bg-[#f7f7f7] p-2 md:p-4 flex flex-col items-center ">
          <Swiper
            slidesPerView="auto"
            spaceBetween={8}
            className="py-2 w-full"
            modules={[Mousewheel]}
            mousewheel={{
              forceToAxis: true,
              sensitivity: 10,
            }}
            onSlideChange={(swiper: any) => setScrollIndex(swiper.activeIndex)}
            onSwiper={(swiper: any) => (swiperRef.current = swiper)}>
            {dates.map((date, i) => {
              const label = date.toLocaleDateString("id-ID", {
                weekday: "short",
                day: "numeric",
                month: "numeric",
              });

              const active = selected?.toDateString() === date.toDateString();

              return (
                <SwiperSlide key={i} style={{ width: "auto" }}>
                  <button
                    onClick={() => onSelect(date)}
                    className={
                      "px-4 py-2 rounded-full border" +
                      (active
                        ? " bg-green-600 text-white border-green-600"
                        : " bg-white border-gray-300 text-gray-700") +
                      " transition-all duration-200"
                    }>
                    {label}
                  </button>
                </SwiperSlide>
              );
            })}
          </Swiper>

          {/* Scroll Indicator */}
          <div className="relative w-full max-w-2xl h-2 mt-4 bg-gray-300 rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-green-600 rounded-full transition-all duration-300"
              style={{
                width: `${((scrollIndex + 1) / dates.length) * 100}%`,
              }}
            />
          </div>

          {/* Menu list for selected date */}
          <div className="w-full max-w-4xl mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 px-2 pb-24">
            {menus.length === 0 ? (
              <div className="col-span-full text-center text-gray-500">
                Tidak ada menu untuk tanggal ini.
              </div>
            ) : (
              menus.map((m: any) => {
                const cartItem = cart.find(
                  (item) => item.menu._id === m._id && item.orderDate === selectedDateKey
                );
                const quantity = cartItem?.quantity || 0;

                return (
                  <div
                    key={m._id}
                    className="bg-white rounded-lg shadow p-4 flex flex-col">
                    {m.image ? (
                      <Image
                        src={m.image}
                        alt={m.name}
                        width={400}
                        height={200}
                        className="w-full h-40 object-cover rounded mb-3"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-100 rounded mb-3 flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                    <div className="font-bold text-lg mb-1">{m.name}</div>
                    <div className="text-sm text-gray-600 mb-2 flex-grow">
                      {m.description || "Keterangan Produk"}
                    </div>
                    <div className="text-lg font-bold text-green-600 mb-3">
                      Rp {m.price?.toLocaleString("id-ID") || 0}
                    </div>

                    {quantity > 0 ? (
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => updateQuantity(m._id, selectedDateKey, -1)}
                          className="w-8 h-8 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 flex items-center justify-center">
                          -
                        </button>
                        <span className="font-bold text-lg w-8 text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(m._id, selectedDateKey, 1)}
                          className="w-8 h-8 rounded-full bg-green-600 text-white font-bold hover:bg-green-700 flex items-center justify-center">
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(m)}
                        className="w-full py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition">
                        Pesan
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Floating Cart Button */}
        {cart.length > 0 && (
          <div className="fixed bottom-4 left-0 right-0 px-4 z-50 flex justify-center">
            <button
              onClick={() => setShowCheckout(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-green-700 transition flex items-center gap-3 max-w-md w-full justify-between">
              <span className="flex items-center gap-2">
                <span className="bg-white text-green-600 rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">
                  {getTotalItems()}
                </span>
                <span className="font-semibold">Items</span>
              </span>
              <span className="font-bold">
                Total: Rp {getTotalPrice().toLocaleString("id-ID")}
              </span>
              <span className="font-semibold">Lihat Checkout →</span>
            </button>
          </div>
        )}

        {/* Checkout Modal */}
        {showCheckout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/70 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Checkout Pesanan
                </h2>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl">
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                {uniqueDates.map((dateKey) => {
                  const itemsForDate = cart.filter((item) => item.orderDate === dateKey);
                  const label = new Date(dateKey).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                  });
                  return (
                    <div key={dateKey} className="space-y-3">
                      <p className="font-semibold text-gray-800">{label}</p>
                      {itemsForDate.map((item) => (
                        <div
                          key={`${dateKey}-${item.menu._id}`}
                          className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start gap-3 mb-3">
                            {item.menu.image ? (
                              <Image
                                src={item.menu.image}
                                alt={item.menu.name}
                                width={80}
                                height={80}
                                className="w-20 h-20 object-cover rounded"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                                <span className="text-gray-400 text-xs">
                                  No Image
                                </span>
                              </div>
                            )}
                            <div className="flex-grow">
                              <h3 className="font-bold text-gray-900">
                                {item.menu.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Rp {item.menu.price?.toLocaleString("id-ID")}
                              </p>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.menu._id, item.orderDate)}
                              className="text-red-500 hover:text-red-700 font-bold">
                              ✕
                            </button>
                          </div>

                          <div className="flex items-center gap-3 mb-3">
                            <button
                              onClick={() => updateQuantity(item.menu._id, item.orderDate, -1)}
                              className="w-8 h-8 rounded-full bg-red-500 text-white font-bold hover:bg-red-600">
                              -
                            </button>
                            <span className="font-bold text-lg w-8 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.menu._id, item.orderDate, 1)}
                              className="w-8 h-8 rounded-full bg-green-600 text-white font-bold hover:bg-green-700">
                              +
                            </button>
                            <span className="ml-auto font-bold text-green-600">
                              Rp{" "}
                              {(item.menu.price * item.quantity).toLocaleString(
                                "id-ID"
                              )}
                            </span>
                          </div>

                          <input
                            type="text"
                            placeholder="Catatan khusus (opsional)"
                            value={item.notes}
                            onChange={(e) =>
                              updateNotes(item.menu._id, item.orderDate, e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      ))}
                    </div>
                  );
                })}

                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Total Items:</span>
                    <span className="font-bold">{getTotalItems()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xl">
                    <span className="font-bold text-gray-900">
                      Total Harga:
                    </span>
                    <span className="font-bold text-green-600">
                      Rp {getTotalPrice().toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    // Simpan cart ke sessionStorage dan redirect ke halaman checkout
                    sessionStorage.setItem("cart", JSON.stringify(cart));
                    const uniqueDates = Array.from(
                      new Set(cart.map((c) => c.orderDate).filter(Boolean))
                    );
                    sessionStorage.setItem("selectedDate", JSON.stringify(uniqueDates));
                    router.push("/checkout");
                  }}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition">
                  Lanjut Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
