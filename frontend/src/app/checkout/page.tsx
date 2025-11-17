'use client';

import { useState } from 'react';
import { ArrowLeft, Plus, Minus, MapPin, Clock, CreditCard, Banknote, ShoppingBag, AlertCircle, Check } from 'lucide-react';
import { createPaymentTransaction, loadMidtransScript, PaymentRequest } from '@/lib/payment';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  date: string;
  isAvailable: boolean;
  stock?: number;
}

interface CartItem extends MenuItem {
  quantity: number;
  specialNotes?: string;
}

interface OrderSummary {
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: '1',
      name: 'Nasi Gudeg Yogya',
      price: 25000,
      description: 'Gudeg dengan ayam kampung, telur, dan sambal krecek',
      quantity: 2,
      date: '2025-11-15',
      isAvailable: true,
      stock: 15,
      specialNotes: 'Pedas sedang'
    },
    {
      id: '2', 
      name: 'Ayam Bakar Bumbu Rujak',
      price: 30000,
      description: 'Ayam bakar dengan bumbu rujak khas bu Lala',
      quantity: 1,
      date: '2025-11-16',
      isAvailable: true,
      stock: 8
    }
  ]);

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });

  const [deliveryInfo, setDeliveryInfo] = useState({
    type: 'delivery' as 'delivery' | 'pickup',
    address: '',
    time: 'siang' as 'pagi' | 'siang' | 'sore',
    notes: ''
  });

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCartItems((prev: CartItem[]) => 
      prev.map((item: CartItem) => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const updateSpecialNotes = (id: string, notes: string) => {
    setCartItems((prev: CartItem[]) => 
      prev.map((item: CartItem) => 
        item.id === id ? { ...item, specialNotes: notes } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCartItems((prev: CartItem[]) => prev.filter((item: CartItem) => item.id !== id));
  };

  const calculateOrderSummary = (): OrderSummary => {
    const subtotal = cartItems.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);
    const deliveryFee = deliveryInfo.type === 'delivery' ? 5000 : 0;
    return {
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee
    };
  };

  const handleSubmitOrder = async () => {
    setIsLoading(true);
    setPaymentError(null);

    try {
      if (paymentMethod === 'transfer') {
        // Midtrans integration for transfer payment
        const paymentData: PaymentRequest = {
          userId: 'demo-user-id', // In real app, get from auth context
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          delivery_address: deliveryInfo.type === 'delivery' ? deliveryInfo.address : undefined,
          items: cartItems.map(item => ({
            menuId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            specialNotes: item.specialNotes
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
          },
          onPending: function(result) {
            console.log('Payment pending:', result);
            // You can show pending status
            alert('Pembayaran pending. Silakan selesaikan pembayaran Anda.');
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
        // Cash payment - just create order without payment processing
        // In real implementation, you'd call your orders API
        setTimeout(() => {
          setShowSuccess(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Order submission error:', error);
      setPaymentError(error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses pesanan');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    return customerInfo.name && 
           customerInfo.phone && 
           (deliveryInfo.type === 'pickup' || deliveryInfo.address) &&
           cartItems.length > 0;
  };

  const summary = calculateOrderSummary();

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-dark mb-2">
            Pesanan Berhasil!
          </h2>
          <p className="text-gray-600 mb-6">
            Terima kasih {customerInfo.name}! Pesanan Anda telah diterima dan akan segera diproses.
          </p>
          <div className="bg-secondary rounded-lg p-4 mb-6">
            <p className="text-sm text-dark">
              Anda akan menerima konfirmasi melalui WhatsApp dalam 5-10 menit.
            </p>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-3">
              <ArrowLeft className="w-6 h-6 text-dark" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-dark">Checkout</h1>
              <p className="text-gray-600">Katering Bu Lala</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Cart Items */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-dark mb-4 flex items-center">
                <ShoppingBag className="w-5 h-5 mr-2 text-primary" />
                Pesanan Anda
              </h2>
              
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-dark">{item.name}</h3>
                        <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          Tanggal: {new Date(item.date).toLocaleDateString('id-ID')}
                        </div>
                        <div className="text-lg font-bold text-primary mt-2">
                          Rp {item.price.toLocaleString('id-ID')}
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-danger hover:bg-red-50 p-1 rounded transition-colors"
                      >
                        ×
                      </button>
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-semibold text-dark min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-dark">
                          Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                        </div>
                        {item.stock && item.stock < 10 && (
                          <div className="text-xs text-accent flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Stok: {item.stock}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Special Notes */}
                    <div className="mt-3">
                      <textarea
                        placeholder="Catatan khusus untuk item ini (opsional)"
                        value={item.specialNotes || ''}
                        onChange={(e) => updateSpecialNotes(item.id, e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-dark mb-4">
                Informasi Pelanggan
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({...prev, name: e.target.value}))}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    Nomor WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({...prev, phone: e.target.value}))}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-dark mb-2">
                    Email (opsional)
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({...prev, email: e.target.value}))}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="email@contoh.com"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-dark mb-4">
                Informasi Pengantaran
              </h2>
              
              {/* Delivery Type */}
              <div className="mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setDeliveryInfo(prev => ({...prev, type: 'delivery'}))}
                    className={`p-4 rounded-xl border-2 text-left transition-colors ${
                      deliveryInfo.type === 'delivery' 
                        ? 'border-primary bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <MapPin className="w-5 h-5 mb-2 text-primary" />
                    <div className="font-semibold text-dark">Diantar</div>
                    <div className="text-sm text-gray-600">Biaya antar Rp 5.000</div>
                  </button>
                  
                  <button
                    onClick={() => setDeliveryInfo(prev => ({...prev, type: 'pickup'}))}
                    className={`p-4 rounded-xl border-2 text-left transition-colors ${
                      deliveryInfo.type === 'pickup' 
                        ? 'border-primary bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5 mb-2 text-primary" />
                    <div className="font-semibold text-dark">Ambil Sendiri</div>
                    <div className="text-sm text-gray-600">Gratis</div>
                  </button>
                </div>
              </div>

              {/* Address (if delivery) */}
              {deliveryInfo.type === 'delivery' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-dark mb-2">
                    Alamat Pengantaran *
                  </label>
                  <textarea
                    required
                    value={deliveryInfo.address}
                    onChange={(e) => setDeliveryInfo(prev => ({...prev, address: e.target.value}))}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                    placeholder="Masukkan alamat lengkap untuk pengantaran"
                  />
                </div>
              )}

              {/* Delivery Time */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-dark mb-2">
                  Waktu {deliveryInfo.type === 'delivery' ? 'Pengantaran' : 'Pengambilan'}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'pagi', label: 'Pagi', time: '09:00 - 11:00' },
                    { value: 'siang', label: 'Siang', time: '12:00 - 14:00' },
                    { value: 'sore', label: 'Sore', time: '17:00 - 19:00' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDeliveryInfo(prev => ({...prev, time: option.value as 'pagi' | 'siang' | 'sore'}))}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        deliveryInfo.time === option.value
                          ? 'border-primary bg-green-50 text-primary'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold">{option.label}</div>
                      <div className="text-xs text-gray-600">{option.time}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Catatan Tambahan
                </label>
                <textarea
                  value={deliveryInfo.notes}
                  onChange={(e) => setDeliveryInfo(prev => ({...prev, notes: e.target.value}))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={2}
                  placeholder="Catatan khusus untuk pesanan (opsional)"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-dark mb-4">
                Metode Pembayaran
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-4 rounded-xl border-2 text-left transition-colors ${
                    paymentMethod === 'cash' 
                      ? 'border-primary bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Banknote className="w-6 h-6 mb-2 text-primary" />
                  <div className="font-semibold text-dark">Bayar Tunai</div>
                  <div className="text-sm text-gray-600">
                    Bayar saat {deliveryInfo.type === 'delivery' ? 'diantar' : 'pengambilan'}
                  </div>
                </button>
                
                <button
                  onClick={() => setPaymentMethod('transfer')}
                  className={`p-4 rounded-xl border-2 text-left transition-colors ${
                    paymentMethod === 'transfer' 
                      ? 'border-primary bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="w-6 h-6 mb-2 text-primary" />
                  <div className="font-semibold text-dark">Transfer Bank</div>
                  <div className="text-sm text-gray-600">
                    Transfer sebelum pesanan diproses
                  </div>
                </button>
              </div>
              
              {paymentMethod === 'transfer' && (
                <div className="mt-4 p-4 bg-secondary rounded-lg">
                  <h4 className="font-semibold text-dark mb-2">Pembayaran Online:</h4>
                  <div className="text-sm text-dark space-y-1">
                    <div>✓ Credit Card / Debit Card</div>
                    <div>✓ Bank Transfer (BCA, BNI, BRI, Mandiri)</div>
                    <div>✓ E-Wallet (GoPay, OVO, DANA)</div>
                    <div>✓ Virtual Account</div>
                    <div className="text-xs text-gray-600 mt-2">
                      *Powered by Midtrans - Pembayaran aman dan terpercaya
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-dark mb-4">
                Ringkasan Pesanan
              </h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} item)</span>
                  <span className="font-semibold">Rp {summary.subtotal.toLocaleString('id-ID')}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Biaya {deliveryInfo.type === 'delivery' ? 'Antar' : 'Pengambilan'}</span>
                  <span className="font-semibold">
                    {summary.deliveryFee === 0 ? 'Gratis' : `Rp ${summary.deliveryFee.toLocaleString('id-ID')}`}
                  </span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-dark">Total</span>
                    <span className="text-primary">Rp {summary.total.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              {/* Order dates summary */}
              <div className="mb-6 p-3 bg-secondary rounded-lg">
                <div className="text-sm font-medium text-dark mb-2">
                  Tanggal Pesanan:
                </div>
                <div className="text-sm text-dark space-y-1">
                  {Array.from(new Set(cartItems.map(item => item.date))).sort().map(date => (
                    <div key={date}>
                      {new Date(date).toLocaleDateString('id-ID', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={!isFormValid() || isLoading}
                className={`w-full py-4 rounded-xl font-semibold text-black transition-all ${
                  isFormValid() && !isLoading
                    ? 'bg-primary hover:bg-primary-dark hover:shadow-lg transform hover:-translate-y-0.5'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Memproses Pesanan...
                  </div>
                ) : (
                  `Pesan Sekarang - Rp ${summary.total.toLocaleString('id-ID')}`
                )}
              </button>
              
              {!isFormValid() && (
                <div className="mt-3 text-sm text-danger flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Mohon lengkapi semua field yang wajib diisi
                </div>
              )}

              {paymentError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm text-danger flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {paymentError}
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