// API utility functions for payment integration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Declare global Midtrans Snap for TypeScript
declare global {
  interface Window {
    snap?: {
      pay: (token: string, options?: {
        onSuccess?: (result: PaymentResult) => void;
        onPending?: (result: PaymentResult) => void;
        onError?: (result: PaymentResult) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

export interface PaymentRequest {
  userId: string;
  customer_name: string;
  customer_phone: string;
  delivery_address?: string;
  items: {
    id?: string;
    menuId: string;
    name: string;
    price: number;
    quantity: number;
    specialNotes?: string;
  }[];
}

export interface PaymentResponse {
  ok: boolean;
  order_id: string;
  token: string;
  redirect_url: string;
  client_key: string;
}

export interface PaymentStatus {
  order_id: string;
  transaction_status: string;
  gross_amount: string;
  payment_type: string;
}

export interface PaymentResult {
  order_id: string;
  status_code: string;
  transaction_status: string;
}

export const createPaymentTransaction = async (data: PaymentRequest): Promise<PaymentResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/payment/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create payment transaction');
  }

  return response.json();
};

export async function checkPaymentStatus(orderId: string): Promise<PaymentStatus> {
  const response = await fetch(`${API_BASE_URL}/api/payment/status/${orderId}`);
  return response.json();
}

export const loadMidtransScript = (clientKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.snap) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', clientKey);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Midtrans script'));
    document.head.appendChild(script);
  });
};