'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

function PaymentErrorContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const errorMessage = searchParams.get('message');

  return (
    <div className="min-h-screen bg-light flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-danger rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-dark mb-2">
          Pembayaran Gagal
        </h2>
        
        <p className="text-gray-600 mb-6">
          Maaf, terjadi kesalahan saat memproses pembayaran Anda.
        </p>

        {orderId && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-dark mb-2">Detail:</h3>
            <div className="text-sm text-dark space-y-1">
              <div>Order ID: {orderId}</div>
              {errorMessage && <div>Error: {errorMessage}</div>}
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Apa yang harus dilakukan?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Periksa saldo atau limit kartu Anda</li>
                <li>Coba dengan metode pembayaran lain</li>
                <li>Hubungi customer service jika masalah berlanjut</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/checkout"
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors inline-block"
          >
            Coba Lagi
          </Link>
          
          <Link
            href="/"
            className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors inline-block"
          >
            Kembali ke Beranda
          </Link>
        </div>

        <div className="mt-6 text-xs text-gray-500 text-center">
          Butuh bantuan? Hubungi WhatsApp: 081234567890
        </div>
      </div>
    </div>
  );
}

export default function PaymentErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <PaymentErrorContent />
    </Suspense>
  );
}