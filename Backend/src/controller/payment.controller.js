const snap = require('../config/midtrans');

// Simpan orders in-memory sementara
let orders = {};

exports.createTransaction = async (req, res) => {
  try {
    const { customer_name, customer_phone, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ ok: false, message: 'Items tidak valid' });
    }

    const orderId = `order-${Date.now()}`;
    const grossAmount = items.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount
      },
      item_details: items.map(it => ({
        id: it.id,
        price: Number(it.price),
        quantity: Number(it.quantity),
        name: it.name
      })),
      customer_details: {
        first_name: customer_name || 'Pelanggan',
        phone: customer_phone || ''
      }
    };

    const transaction = await snap.createTransaction(parameter);

    orders[orderId] = {
      id: orderId,
      items,
      grossAmount,
      status: 'pending',
      createdAt: new Date(),
      customer_name,
      customer_phone
    };

    res.json({
      ok: true,
      order_id: orderId,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      client_key: process.env.MIDTRANS_CLIENT_KEY
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

exports.handleNotification = async (req, res) => {
  try {
    const notification = req.body;
    const { order_id, transaction_status } = notification;

    if (orders[order_id]) {
      if (transaction_status === 'settlement' || transaction_status === 'capture') {
        orders[order_id].status = 'paid';
      } else if (transaction_status === 'pending') {
        orders[order_id].status = 'pending';
      } else if (
        transaction_status === 'deny' ||
        transaction_status === 'cancel' ||
        transaction_status === 'expire'
      ) {
        orders[order_id].status = 'failed';
      } else {
        orders[order_id].status = transaction_status;
      }
    }

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
};
