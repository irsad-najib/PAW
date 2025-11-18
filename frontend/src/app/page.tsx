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

type CartItem = {
  menu: any;
  quantity: number;
<<<<<<< HEAD
  date: string;
  deliveryTime: "Pagi" | "Siang" | "Sore";
  specialNotes: string;
};
=======
  notes: string;
  orderDate: string; // YYYY-MM-DD
}
>>>>>>> 1923a151e9a348b8334218a5b01f5dc287a47faf

export default function HomePage() {
  const router = useRouter();
  // 30 hari ke depan
  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const [selected, setSelected] = useState<Date | null>(dates[0]);
  const [menus, setMenus] = useState<any[]>([]);
  const [scrollIndex, setScrollIndex] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [deliveryTime, setDeliveryTime] = useState<"Pagi" | "Siang" | "Sore">(
    "Pagi"
  );
  const [specialNotes, setSpecialNotes] = useState("");
  const swiperRef = useRef<any>(null);

<<<<<<< HEAD
  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to parse cart:", error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart]);
=======
  const selectedDateKey = selected
    ? selected.toISOString().split("T")[0]
    : "";
>>>>>>> 1923a151e9a348b8334218a5b01f5dc287a47faf

  const onSelect = (date: Date) => {
    setSelected(date);
  };

<<<<<<< HEAD
=======
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

>>>>>>> 1923a151e9a348b8334218a5b01f5dc287a47faf
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

<<<<<<< HEAD
  const handleAddToCart = (menu: any) => {
    setSelectedMenu(menu);
    setQuantity(1);
    setDeliveryTime("Pagi");
    setSpecialNotes("");
    setShowAddModal(true);
  };

  const confirmAddToCart = () => {
    if (!selected) return;

    const newItem: CartItem = {
      menu: selectedMenu,
      quantity,
      date: selected.toISOString().split("T")[0],
      deliveryTime,
      specialNotes,
    };

    setCart((prev) => [...prev, newItem]);
    setShowAddModal(false);
    alert("Menu ditambahkan ke keranjang!");
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const goToCheckout = () => {
    if (cart.length === 0) {
      alert("Keranjang masih kosong!");
      return;
    }
    router.push("/checkout");
  };
=======
  const uniqueDates = Array.from(new Set(cart.map((c) => c.orderDate).filter(Boolean)));
>>>>>>> 1923a151e9a348b8334218a5b01f5dc287a47faf

  return (
    <>
      <Navbar />

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <button
          onClick={goToCheckout}
          className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-green-700 flex items-center gap-2">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span className="font-semibold">{cartItemCount} Item</span>
        </button>
      )}

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
          <div className="w-full max-w-2xl mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 px-2">
            {menus.length === 0 ? (
              <div className="col-span-full text-center text-gray-500">
                Tidak ada menu untuk tanggal ini.
              </div>
            ) : (
<<<<<<< HEAD
              menus.map((m: any) => (
                <div
                  key={m._id}
                  className="bg-white rounded-lg shadow p-3 flex flex-col items-start">
                  {m.image ? (
                    // use Next.js Image for better performance (simple fixed size)
                    <Image
                      src={m.image}
                      alt={m.name}
                      width={400}
                      height={200}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 rounded mb-2 flex items-center justify-center text-gray-400">
                      No Image
=======
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
>>>>>>> 1923a151e9a348b8334218a5b01f5dc287a47faf
                    </div>
                  )}
                  <div className="font-semibold">{m.name}</div>
                  <div className="text-sm text-gray-600">{m.description}</div>
                  <div className="mt-2 flex items-center justify-between w-full">
                    <div className="font-medium text-green-700">
                      Rp {m.price?.toLocaleString("id-ID")}
                    </div>
<<<<<<< HEAD
                    <button
                      onClick={() => handleAddToCart(m)}
                      className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700">
                      + Keranjang
                    </button>
=======

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
>>>>>>> 1923a151e9a348b8334218a5b01f5dc287a47faf
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add to Cart Modal */}
      {showAddModal && selectedMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {selectedMenu.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedMenu.description}
                </p>
                <p className="text-lg font-bold text-green-600 mt-2">
                  Rp {selectedMenu.price?.toLocaleString("id-ID")}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Pesan
                </label>
                <div className="px-4 py-2 bg-gray-100 rounded-lg">
                  {selected?.toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>

<<<<<<< HEAD
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Waktu Pengiriman
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Pagi", "Siang", "Sore"] as const).map((time) => (
                    <button
                      key={time}
                      onClick={() => setDeliveryTime(time)}
                      className={`px-3 py-2 rounded-lg border ${
                        deliveryTime === time
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-white text-gray-700 border-gray-300"
                      }`}>
                      {time}
                    </button>
                  ))}
=======
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
>>>>>>> 1923a151e9a348b8334218a5b01f5dc287a47faf
                </div>
              </div>

<<<<<<< HEAD
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 bg-gray-200 rounded-lg hover:bg-gray-300">
                    -
                  </button>
                  <span className="text-xl font-bold w-12 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 bg-gray-200 rounded-lg hover:bg-gray-300">
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan Khusus (Opsional)
                </label>
                <textarea
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Contoh: Tidak pedas, tanpa sambal, dll."
                />
=======
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
>>>>>>> 1923a151e9a348b8334218a5b01f5dc287a47faf
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Batal
              </button>
              <button
                onClick={confirmAddToCart}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Tambahkan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
