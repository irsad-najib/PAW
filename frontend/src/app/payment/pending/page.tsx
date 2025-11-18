'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { checkPaymentStatus, PaymentStatus } from '@/lib/payment';

function PaymentPendingContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [paymentDetails, setPaymentDetails] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      if (orderId) {
        try {
          const status = await checkPaymentStatus(orderId);
          setPaymentDetails(status);
        } catch (error) {
          console.error('Failed to fetch payment status:', error);
        }
      }
      setLoading(false);
    };

    fetchPaymentStatus();

    // Poll payment status every 30 seconds
    const interval = setInterval(fetchPaymentStatus, 30000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to success if payment is completed
  if (paymentDetails?.transaction_status === 'settlement') {
    window.location.href = `/payment/success?order_id=${orderId}`;
    return null;
  }

  return (
    <div className="min-h-screen bg-light flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-dark mb-2">
          Pembayaran Pending
        </h2>
        
        <p className="text-gray-600 mb-6">
          Pembayaran Anda sedang diproses. Silakan selesaikan pembayaran sesuai instruksi.
        </p>

        {paymentDetails && (
          <div className="bg-secondary rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-dark mb-2">Detail Pembayaran:</h3>
            <div className="text-sm text-dark space-y-1">
              <div>Order ID: {paymentDetails.order_id}</div>
              <div>Status: {paymentDetails.transaction_status}</div>
              <div>Total: Rp {parseInt(paymentDetails.gross_amount).toLocaleString('id-ID')}</div>
              <div>Metode: {paymentDetails.payment_type}</div>
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Menunggu Pembayaran</p>
              <p>Silakan selesaikan pembayaran dalam waktu yang ditentukan. Halaman ini akan otomatis terupdate saat pembayaran berhasil.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            Refresh Status
          </button>
          
          <Link
            href="/"
            className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors inline-block"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <PaymentPendingContent />
    </Suspense>
  );
}