'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { checkPaymentStatus, PaymentStatus } from '@/lib/payment';

function PaymentSuccessContent() {
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
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-dark mb-2">
          Pembayaran Berhasil!
        </h2>
        
        <p className="text-gray-600 mb-6">
          Terima kasih! Pembayaran Anda telah berhasil diproses.
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

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800">
            Konfirmasi pesanan akan dikirim via WhatsApp dalam 5-10 menit.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors inline-block"
          >
            Kembali ke Beranda
          </Link>
          
          <Link
            href="/orders"
            className="w-full border border-primary text-primary py-3 rounded-lg font-semibold hover:bg-primary hover:text-white transition-colors inline-block"
          >
            Lihat Pesanan Saya
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}