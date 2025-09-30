const testData = {
  userId: '67aaa1234567890123456789',
  menuIds: [
    '67aaa1234567890123456788',
    '67aaa1234567890123456787',
    '67aaa1234567890123456786'
  ],
  
  customer: {
    name: 'John Doe Test',
    phone: '081234567890',
    address: 'Jl. Merdeka No. 123, Jakarta'
  },
  
  menuItems: [
    {
      menuId: '67aaa1234567890123456788',
      name: 'Nasi Goreng Special',
      price: 35000,
      quantity: 2
    },
    {
      menuId: '67aaa1234567890123456787',
      name: 'Es Teh Manis',
      price: 8000,
      quantity: 2
    },
    {
      menuId: '67aaa1234567890123456786',
      name: 'Ayam Bakar Bumbu Kecap',
      price: 45000,
      quantity: 1
    }
  ]
};

console.log('POSTMAN TEST DATA GENERATOR');
console.log('============================');

console.log('\n1. CREATE PAYMENT PAYLOAD:');
console.log(JSON.stringify({
  userId: testData.userId,
  customer_name: testData.customer.name,
  customer_phone: testData.customer.phone,
  delivery_address: testData.customer.address,
  items: testData.menuItems.slice(0, 2) // 2 items pertama
}, null, 2));
console.log('```');

console.log('\n2. WEBHOOK NOTIFICATION PAYLOAD:');
console.log('Replace order_id with actual order_id from step 1:');
const webhookPayload = {
  order_id: 'ORDER-REPLACE-WITH-ACTUAL-ORDER-ID',
  transaction_status: 'settlement',
  fraud_status: 'accept',
  status_code: '200',
  gross_amount: '86000.00',
  payment_type: 'credit_card',
  transaction_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
  transaction_id: `test-${Date.now()}`,
  signature_key: 'dummy-signature',
  currency: 'IDR',
  merchant_id: 'G123456789'
};
console.log(JSON.stringify(webhookPayload, null, 2));

console.log('\n3. LARGE ORDER PAYLOAD:');
console.log(JSON.stringify({
  userId: testData.userId,
  customer_name: 'Restaurant Order',
  customer_phone: '081999888777',
  delivery_address: 'Jl. Sudirman No. 456, Bandung',
  items: testData.menuItems
}, null, 2));

console.log('\n4. ERROR TEST PAYLOAD:');
console.log(JSON.stringify({
  userId: 'invalid-user-id',
  customer_name: 'Error Test',
  customer_phone: '081234567890',
  items: []
}, null, 2));

console.log('\n5. PICKUP ORDER PAYLOAD:');
console.log(JSON.stringify({
  userId: testData.userId,
  customer_name: 'Pickup Customer',
  customer_phone: '081555666777',
  items: [{
    menuId: testData.menuIds[0],
    name: 'Gado-Gado',
    price: 18000,
    quantity: 1
  }]
}, null, 2));

const total1 = testData.menuItems.slice(0, 2).reduce((sum, item) => sum + (item.price * item.quantity), 0);
const total2 = testData.menuItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

console.log('\nExpected Totals:');
console.log(`- Standard Order: Rp ${total1.toLocaleString('id-ID')}`);
console.log(`- Large Order: Rp ${total2.toLocaleString('id-ID')}`);
console.log(`- Pickup Order: Rp 18.000`);

console.log('\nPostman Environment Variables:');
console.log(`base_url: http://localhost:5000`);
console.log(`test_user_id: ${testData.userId}`);

module.exports = testData;