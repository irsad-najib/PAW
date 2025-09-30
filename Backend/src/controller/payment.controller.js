const { snap, core } = require('../config/midtrans');
const Order = require('../models/order.model');
const crypto = require('crypto');

exports.createTransaction = async (req, res) => {
  try {
    const { userId, items, customer_name, customer_phone, delivery_address } = req.body;

    // Validasi input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Items tidak valid' 
      });
    }

    if (!userId) {
      return res.status(400).json({ 
        ok: false, 
        message: 'User ID required' 
      });
    }

    // Generate unique order ID
    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Hitung total harga
    const grossAmount = items.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );

    // Parameter untuk Midtrans
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount
      },
      item_details: items.map(item => ({
        id: item.id || item.menuId,
        price: Number(item.price),
        quantity: Number(item.quantity),
        name: item.name
      })),
      customer_details: {
        first_name: customer_name || 'Pelanggan',
        phone: customer_phone || '',
        billing_address: delivery_address ? {
          address: delivery_address
        } : undefined
      },
      callbacks: {
        finish: `${process.env.FRONTEND_URL}/payment/success`,
        error: `${process.env.FRONTEND_URL}/payment/error`,
        pending: `${process.env.FRONTEND_URL}/payment/pending`
      },
      expiry: {
        start_time: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }) + ' +0700',
        unit: "minutes",
        duration: 30
      }
    };

    // Buat transaksi dengan Midtrans
    const transaction = await snap.createTransaction(parameter);

    // Simpan order ke database
    const newOrder = new Order({
      userId: userId,
      orderId: orderId,
      items: items.map(item => ({
        menuId: item.menuId || item.id,
        quantity: item.quantity,
        price: item.price,
        specialNotes: item.specialNotes || ''
      })),
      totalPrice: grossAmount,
      paymentStatus: 'pending',
      orderStatus: 'pending',
      deliveryAddress: delivery_address,
      customerName: customer_name,
      customerPhone: customer_phone,
      midtransToken: transaction.token,
      // Untuk sementara set orderDates dan deliveryTime dengan default
      orderDates: [new Date()],
      deliveryType: delivery_address ? 'Delivery' : 'Pickup',
      deliveryTime: 'Siang'
    });

    await newOrder.save();

    res.json({
      ok: true,
      order_id: orderId,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      client_key: process.env.MIDTRANS_CLIENT_KEY
    });

  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ 
      ok: false, 
      error: error.message 
    });
  }
};

// Fungsi untuk verifikasi signature Midtrans
const verifySignature = (notification) => {
  const { order_id, status_code, gross_amount, signature_key } = notification;
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  
  const hash = crypto
    .createHash('sha512')
    .update(order_id + status_code + gross_amount + serverKey)
    .digest('hex');
    
  return hash === signature_key;
};

exports.handleNotification = async (req, res) => {
  try {
    const notification = req.body;
    const { 
      order_id, 
      transaction_status, 
      fraud_status,
      status_code,
      gross_amount,
      signature_key
    } = notification;

    console.log('Received notification:', notification);

    // Verifikasi signature untuk keamanan (untuk production)
    if (process.env.NODE_ENV === 'production' && !verifySignature(notification)) {
      console.error('Invalid signature for order:', order_id);
      return res.status(401).json({ 
        ok: false, 
        message: 'Invalid signature' 
      });
    }

    // Cari order di database
    const order = await Order.findOne({ orderId: order_id });
    if (!order) {
      console.error('Order not found:', order_id);
      return res.status(404).json({ 
        ok: false, 
        message: 'Order not found' 
      });
    }

    // Update status berdasarkan transaction_status
    let newPaymentStatus = order.paymentStatus;
    let newOrderStatus = order.orderStatus;

    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      if (fraud_status === 'accept' || !fraud_status) {
        newPaymentStatus = 'paid';
        newOrderStatus = 'processing';
      }
    } else if (transaction_status === 'pending') {
      newPaymentStatus = 'pending';
    } else if (
      transaction_status === 'deny' ||
      transaction_status === 'cancel' ||
      transaction_status === 'expire' ||
      transaction_status === 'failure'
    ) {
      newPaymentStatus = 'unpaid';
      newOrderStatus = 'cancelled';
    }

    // Update order di database
    order.paymentStatus = newPaymentStatus;
    order.orderStatus = newOrderStatus;
    order.midtransResponse = notification;
    await order.save();

    console.log(`Order ${order_id} updated: payment=${newPaymentStatus}, order=${newOrderStatus}`);

    res.json({ ok: true });

  } catch (error) {
    console.error('Handle notification error:', error);
    res.status(500).json({ ok: false });
  }
};

exports.getTransactionStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Cek status dari Midtrans
    const statusResponse = await core.transaction.status(orderId);
    
    // Update order di database berdasarkan response
    const order = await Order.findOne({ orderId: orderId });
    if (order) {
      const { transaction_status, fraud_status } = statusResponse;
      
      let newPaymentStatus = order.paymentStatus;
      if (transaction_status === 'settlement' || transaction_status === 'capture') {
        if (fraud_status === 'accept' || !fraud_status) {
          newPaymentStatus = 'paid';
        }
      } else if (transaction_status === 'pending') {
        newPaymentStatus = 'pending';
      } else if (
        transaction_status === 'deny' ||
        transaction_status === 'cancel' ||
        transaction_status === 'expire'
      ) {
        newPaymentStatus = 'unpaid';
      }
      
      order.paymentStatus = newPaymentStatus;
      await order.save();
    }
    
    res.json({
      ok: true,
      status: statusResponse
    });
    
  } catch (error) {
    console.error('Get transaction status error:', error);
    res.status(500).json({ 
      ok: false, 
      error: error.message 
    });
  }
};
