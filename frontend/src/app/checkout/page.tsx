'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Minus, MapPin, Clock, CreditCard, Banknote, ShoppingBag, AlertCircle, Check, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/utils/navbar';
import { createPaymentTransaction, loadMidtransScript, PaymentRequest } from '@/lib/payment';
import { Menu, OrderDeliveryTime, OrderDeliveryType, OrderPaymentMethod } from '@/lib/types';
import api from '@/components/api';

// Tipe data yang menggabungkan kedua versi
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

interface OrderSummary {
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // State management menggabungkan kedua versi
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [deliveryType, setDeliveryType] = useState<OrderDeliveryType>("Delivery");
  const [deliveryTime, setDeliveryTime] = useState<OrderDeliveryTime>("Pagi");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<OrderPaymentMethod>("cash");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  
  // Loading states dari versi saya
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  // Authentication check dari versi Anda
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/checkout");
    }
  }, [user, loading, router]);

  // Load cart dari localStorage (versi Anda)
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
      setCustomerEmail(user.email || "");
    }
  }, [user]);

  // Auto-populate dates dari versi Anda
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

  // Group orders logic dari versi Anda
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

  // Cart utility functions
  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const newCart = cart.map((item, i) => 
      i === index ? { ...item, quantity: newQuantity } : item
    );
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const updateSpecialNotes = (index: number, notes: string) => {
    const newCart = cart.map((item, i) => 
      i === index ? { ...item, specialNotes: notes, notes: notes } : item
    );
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const removeItem = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  // Calculate order summary dengan delivery fee dari versi saya
  const calculateOrderSummary = (): OrderSummary => {
    const subtotal = cart.reduce((sum, item) => sum + (item.menu.price || 0) * item.quantity, 0);
    const deliveryFee = deliveryType === 'Delivery' ? 5000 : 0;
    return {
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee
    };
  };

  // Handle checkout dengan kombinasi kedua versi
  const handleSubmitOrder = async () => {
    setIsLoading(true);
    setPaymentError(null);

    // Validation
    if (!customerName || !customerPhone) {
      setPaymentError("Mohon isi nama dan nomor telepon");
      setIsLoading(false);
      return;
    }

    if (deliveryType === "Delivery" && !deliveryAddress) {
      setPaymentError("Mohon isi alamat pengiriman");
      setIsLoading(false);
      return;
    }

    if (cart.length === 0) {
      setPaymentError("Keranjang kosong");
      setIsLoading(false);
      return;
    }

    try {
      if (paymentMethod === 'transfer') {
        // Midtrans integration dari versi saya
        const paymentData: PaymentRequest = {
          userId: user?.userID || 'demo-user-id',
          customer_name: customerName,
          customer_phone: customerPhone,
          delivery_address: deliveryType === 'Delivery' ? deliveryAddress : undefined,
          items: cart.map(item => ({
            menuId: item.menu._id,
            name: item.menu.name,
            price: item.menu.price || 0,
            quantity: item.quantity,
            specialNotes: item.specialNotes || item.notes
          }))
        };

        const paymentResponse = await createPaymentTransaction(paymentData);
        setCurrentOrderId(paymentResponse.order_id);

        // Load Midtrans script and open payment modal
        await loadMidtransScript(paymentResponse.client_key);
        
        window.snap?.pay(paymentResponse.token, {
          onSuccess: function(result) {
            console.log('Payment success:', result);
            setShowSuccess(true);
            localStorage.removeItem("cart");
          },
          onPending: function(result) {
            console.log('Payment pending:', result);
            window.location.href = `/payment/pending?order_id=${result.order_id}`;
          },
          onError: function(result) {
            console.log('Payment error:', result);
            setPaymentError('Pembayaran gagal. Silakan coba lagi.');
          },
          onClose: function() {
            console.log('Payment popup closed');
          }
        });
      } else {
        // Cash payment dengan API call ke backend dari versi Anda
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
          setShowSuccess(true);
          setCurrentOrderId(response.data._id);
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
          setShowSuccess(true);
        }
      }
    } catch (error: unknown) {
      console.error('Order submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses pesanan';
      setPaymentError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    return customerName && 
           customerPhone && 
           (deliveryType === 'Pickup' || deliveryAddress) &&
           cart.length > 0;
  };

  const summary = calculateOrderSummary();

  // Utility functions
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

  // Success screen dari versi saya dengan desain yang lebih baik
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Pesanan Berhasil!
            </h2>
            <p className="text-gray-600 mb-6">
              Terima kasih {customerName}! Pesanan Anda telah diterima dan akan segera diproses.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                Anda akan menerima konfirmasi melalui WhatsApp dalam 5-10 menit.
              </p>
            </div>
            <button 
              onClick={() => router.push('/')}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-3"
          >
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Checkout</h1>
            <p className="text-gray-600">Katering Bu Lala</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Cart Items dengan desain versi Anda yang lebih clean */}
            {groupedOrders.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Keranjang kosong</p>
                <button
                  onClick={() => router.push("/")}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Pilih Menu
                </button>
              </div>
            ) : (
              <>
                {groupedOrders.map((group, groupIdx) => (
                  <div key={groupIdx} className="bg-white rounded-xl shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-green-600" />
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {formatDate(group.date)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Waktu: {group.deliveryTime}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">
                          {formatRupiah(group.subtotal)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {group.items.map((item, itemIdx) => {
                        const actualIndex = cart.findIndex(cartItem => 
                          cartItem.menu._id === item.menu._id && 
                          (cartItem.date || cartItem.orderDate) === group.date
                        );
                        
                        return (
                          <div key={itemIdx} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                            {item.menu.image && (
                              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                <span className="text-xs text-gray-500">IMG</span>
                              </div>
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800">{item.menu.name}</h4>
                              <p className="text-sm text-gray-600">{formatRupiah(item.menu.price || 0)}</p>
                              {(item.specialNotes || item.notes) && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Catatan: {item.specialNotes || item.notes}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateQuantity(actualIndex, item.quantity - 1)}
                                className="p-1 hover:bg-gray-200 rounded"
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(actualIndex, item.quantity + 1)}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeItem(actualIndex)}
                                className="p-1 hover:bg-red-100 text-red-600 rounded ml-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Special notes input */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Catatan Khusus (Opsional)
                      </label>
                      <textarea
                        value={group.items[0]?.specialNotes || group.items[0]?.notes || ''}
                        onChange={(e) => {
                          const actualIndex = cart.findIndex(cartItem => 
                            cartItem.menu._id === group.items[0].menu._id && 
                            (cartItem.date || cartItem.orderDate) === group.date
                          );
                          updateSpecialNotes(actualIndex, e.target.value);
                        }}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        rows={2}
                        placeholder="Contoh: Pedas sedang, tanpa sambal, dll."
                      />
                    </div>
                  </div>
                ))}

                {groupedOrders.length > 1 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <AlertCircle className="w-5 h-5 text-blue-600 inline mr-2" />
                    <span className="text-sm text-blue-800">
                      Pesanan Anda mencakup {groupedOrders.length} hari berbeda. 
                      Setiap hari akan dibuat sebagai pesanan terpisah dengan informasi pengiriman yang sama.
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Customer Information */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Informasi Pelanggan</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Telepon *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (Opsional)
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="email@contoh.com"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                <MapPin className="w-5 h-5 text-green-600 inline mr-2" />
                Informasi Pengiriman
              </h2>
              
              {/* Delivery Time */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Waktu Pengiriman *</label>
                <div className="flex gap-3">
                  {(['Pagi', 'Siang', 'Sore'] as OrderDeliveryTime[]).map((time) => (
                    <button
                      key={time}
                      onClick={() => setDeliveryTime(time)}
                      className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                        deliveryTime === time
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Pengiriman *</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setDeliveryType('Delivery')}
                    className={`p-4 rounded-lg border text-center transition-colors ${
                      deliveryType === 'Delivery'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <MapPin className="w-5 h-5 mx-auto mb-1" />
                    <div className="font-semibold">Delivery</div>
                    <div className="text-xs text-gray-600">Diantar ke alamat</div>
                  </button>
                  <button
                    onClick={() => setDeliveryType('Pickup')}
                    className={`p-4 rounded-lg border text-center transition-colors ${
                      deliveryType === 'Pickup'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5 mx-auto mb-1" />
                    <div className="font-semibold">Pickup</div>
                    <div className="text-xs text-gray-600">Ambil sendiri</div>
                  </button>
                </div>
              </div>

              {/* Address (if delivery) */}
              {deliveryType === 'Delivery' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat Pengiriman *
                  </label>
                  <textarea
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="Masukkan alamat lengkap untuk pengiriman"
                  />
                </div>
              )}

              {/* Delivery Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan Pengiriman (Opsional)
                </label>
                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={2}
                  placeholder="Catatan khusus untuk pengiriman (contoh: rumah cat hijau, sebelah warung makan)"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                <CreditCard className="w-5 h-5 text-green-600 inline mr-2" />
                Metode Pembayaran
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-4 rounded-lg border text-center transition-colors ${
                    paymentMethod === 'cash'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Banknote className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-semibold">Tunai</div>
                  <div className="text-xs text-gray-600">Bayar saat pengiriman</div>
                </button>
                <button
                  onClick={() => setPaymentMethod('transfer')}
                  className={`p-4 rounded-lg border text-center transition-colors ${
                    paymentMethod === 'transfer'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <CreditCard className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-semibold">Transfer/E-Wallet</div>
                  <div className="text-xs text-gray-600">Via Midtrans</div>
                </button>
              </div>
              
              {paymentMethod === 'transfer' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Pembayaran Online</p>
                      <p>Anda akan diarahkan ke halaman pembayaran Midtrans untuk menyelesaikan transaksi dengan berbagai metode pembayaran (Transfer Bank, E-Wallet, Kartu Kredit, dll).</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar - sticky dari versi saya */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Ringkasan Pesanan
              </h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatRupiah(summary.subtotal)}</span>
                </div>
                {deliveryType === 'Delivery' && (
                  <div className="flex justify-between text-gray-600">
                    <span>Ongkos Kirim</span>
                    <span>{formatRupiah(summary.deliveryFee)}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between text-xl font-bold text-gray-800">
                    <span>Total</span>
                    <span>{formatRupiah(summary.total)}</span>
                  </div>
                </div>
              </div>

              {/* Order info */}
              <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 space-y-1">
                  <div><span className="font-medium">Jenis:</span> {deliveryType}</div>
                  <div><span className="font-medium">Waktu:</span> {deliveryTime}</div>
                  <div><span className="font-medium">Pembayaran:</span> {paymentMethod === 'cash' ? 'Tunai' : 'Transfer'}</div>
                  {groupedOrders.length > 1 && (
                    <div><span className="font-medium">Pesanan:</span> {groupedOrders.length} hari</div>
                  )}
                </div>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={!isFormValid() || isLoading}
                className={`w-full py-4 rounded-xl font-semibold transition-all ${
                  isFormValid() && !isLoading
                    ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5'
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Memproses...
                  </div>
                ) : (
                  `${paymentMethod === 'transfer' ? 'Bayar' : 'Buat Pesanan'} - ${formatRupiah(summary.total)}`
                )}
              </button>
              
              {!isFormValid() && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600">
                    Mohon lengkapi semua field yang diperlukan
                  </p>
                </div>
              )}

              {paymentError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    <p className="text-sm text-red-600">{paymentError}</p>
                  </div>
                </div>
              )}

              <div className="mt-4 text-xs text-gray-500 text-center">
                Dengan memesan, Anda menyetujui syarat dan ketentuan Bu Lala Katering
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}