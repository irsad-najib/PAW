// untuk membersihkan entri database yang tidak valid
// jalankan dengan: node cleanup-db.js
require('dotenv').config();
const mongoose = require('mongoose');

async function cleanupDatabase() {
  try {
    await mongoose.connect(process.env.MongoURI);
    console.log('Connected to MongoDB');

    const Order = mongoose.connection.db.collection('orders');

    const nullOrderIdCount = await Order.countDocuments({ orderId: null });
    console.log(`Found ${nullOrderIdCount} orders with null orderId`);

    if (nullOrderIdCount > 0) {
      const deleteResult = await Order.deleteMany({ orderId: null });
      console.log(`Deleted ${deleteResult.deletedCount} orders with null orderId`);
    }

    const noOrderIdCount = await Order.countDocuments({ orderId: { $exists: false } });
    console.log(`Found ${noOrderIdCount} orders without orderId field`);

    if (noOrderIdCount > 0) {
      const deleteResult = await Order.deleteMany({ orderId: { $exists: false } });
      console.log(`Deleted ${deleteResult.deletedCount} orders without orderId field`);
    }

    const totalOrders = await Order.countDocuments({});
    console.log(`Total orders remaining: ${totalOrders}`);

    const sampleOrders = await Order.find({}).limit(3).toArray();
    console.log('Sample orders:');
    sampleOrders.forEach(order => {
      console.log(`  - ID: ${order._id}, OrderID: ${order.orderId || 'null'}, Status: ${order.paymentStatus || 'N/A'}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

cleanupDatabase();