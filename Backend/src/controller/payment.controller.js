const { snap, core } = require('../config/midtrans');
const Order = require('../models/order.model');
const crypto = require('crypto');

exports.healthCheck = async (req, res) => {
  try {
    res.json({
      ok: true,
      message: 'Payment API is running',
      timestamp: new Date().toISOString(),
      endpoints: {
        create: 'POST /api/payment/create',
        notification: 'POST /api/payment/notification', 
        status: 'GET /api/payment/status/:orderId'
      },
      midtrans: {
        environment: 'sandbox',
        client_key: process.env.MIDTRANS_CLIENT_KEY ? 'configured' : 'not configured',
        server_key: process.env.MIDTRANS_SERVER_KEY ? 'configured' : 'not configured'
      }
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Health check failed',
      error: error.message
    });
  }
};

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

    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    const grossAmount = items.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );

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

    const transaction = await snap.createTransaction(parameter);

    // Simpan order ke database
    const newOrder = new Order({
      userId: userId,
      orderId: orderId,
      items: items.map(item => ({
        menuId: item.menuId || item.id,
        quantity: item.quantity,
        specialNotes: item.specialNotes || ''
      })),
      totalPrice: grossAmount,
      paymentStatus: 'pending',
      orderStatus: 'pending',
      deliveryAddress: delivery_address,
      customerName: customer_name,
      customerPhone: customer_phone,
      midtransToken: transaction.token,
      orderDates: [new Date()],
      deliveryType: delivery_address ? 'Delivery' : 'Pickup',
      deliveryTime: 'Siang',
      paymentMethod: 'transfer'
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

    // Verifikasi signature untuk production
    if (process.env.NODE_ENV === 'production' && !verifySignature(notification)) {
      return res.status(401).json({ 
        ok: false, 
        message: 'Invalid signature' 
      });
    }

    const order = await Order.findOne({ orderId: order_id });
    if (!order) {
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

    res.json({ ok: true });

  } catch (error) {
    res.status(500).json({ ok: false });
  }
};

exports.getTransactionStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({ orderId });
    
    if (!order) {
      return res.status(404).json({
        ok: false,
        message: 'Order not found'
      });
    }

    // Return mock response untuk demo (always success if order exists)
    const mockResponse = {
      ok: true,
      order_id: orderId,
      transaction_status: order.paymentStatus === 'paid' ? 'settlement' : 'pending',
      gross_amount: order.totalPrice.toString() + '.00',
      payment_type: order.paymentMethod === 'transfer' ? 'bank_transfer' : 'credit_card',
      transaction_time: order.updatedAt.toISOString(),
      fraud_status: 'accept',
      status_code: order.paymentStatus === 'paid' ? '200' : '201',
      status_message: 'Success, transaction is found',
      merchant_id: process.env.MIDTRANS_MERCHANT_ID || 'G123456789',
      currency: 'IDR',
      customer_details: {
        first_name: order.customerName?.split(' ')[0] || 'Customer',
        last_name: order.customerName?.split(' ').slice(1).join(' ') || 'Name',
        phone: order.customerPhone || '',
        billing_address: {
          address: order.deliveryAddress || ''
        }
      },
      item_details: order.items.map((item, index) => ({
        id: item.menuId.toString(),
        name: `Item ${index + 1}`,
        price: Math.round(order.totalPrice / order.items.length),
        quantity: item.quantity
      }))
    };
    
    return res.json(mockResponse);
    
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to get transaction status',
      error: error.message
    });
  }
};
