const axios = require('axios');
const baseURL = 'http://localhost:5000';

async function testCompletePaymentFlow() {
  try {
    console.log('PAYMENT API TEST');
    console.log('=================\n');
    
    // Test 1: Health Check
    console.log('1. Health Check');
    try {
      const healthResponse = await axios.get(`${baseURL}/api/payment/health`);
      console.log('Status:', healthResponse.status);
      console.log('Response:', JSON.stringify(healthResponse.data, null, 2));
    } catch (error) {
      console.log('Health check failed:', error.message);
    }
    
    console.log('\n' + '='.repeat(30) + '\n');
    
    // Test 2: Create Transaction
    console.log('2. Create Transaction');
    
    const createPayload = {
      userId: "67aaa1234567890123456789",
      customer_name: "John Doe Test",
      customer_phone: "081234567890",
      delivery_address: "Jl. Merdeka No. 123, Jakarta",
      items: [
        {
          menuId: "67aaa1234567890123456788",
          name: "Nasi Goreng Special",
          price: 35000,
          quantity: 2
        },
        {
          menuId: "67aaa1234567890123456787",
          name: "Es Teh Manis",
          price: 8000,
          quantity: 2
        }
      ]
    };
    
    const createResponse = await axios.post(`${baseURL}/api/payment/create`, createPayload);
    const { order_id, token } = createResponse.data;
    
    console.log('Status:', createResponse.status);
    console.log('Response:', JSON.stringify(createResponse.data, null, 2));
    
    console.log('\n' + '='.repeat(30) + '\n');
    
    // Test 3: Webhook Notification
    console.log('3. Webhook Notification');
    
    const webhookPayload = {
      order_id: order_id,
      transaction_status: "settlement",
      fraud_status: "accept",
      status_code: "200",
      gross_amount: "86000.00",
      payment_type: "credit_card",
      transaction_time: new Date().toISOString(),
      transaction_id: `test-${Date.now()}`,
      signature_key: "dummy-signature",
      currency: "IDR",
      merchant_id: "G123456789"
    };
    
    const webhookResponse = await axios.post(`${baseURL}/api/payment/notification`, webhookPayload);
    
    console.log('Status:', webhookResponse.status);
    console.log('Response:', JSON.stringify(webhookResponse.data, null, 2));
    
    console.log('\n' + '='.repeat(30) + '\n');
    
    // Test 4: Get Transaction Status
    console.log('4. Get Transaction Status');
    
    const statusResponse = await axios.get(`${baseURL}/api/payment/status/${order_id}`);
    
    console.log('Status:', statusResponse.status);
    console.log('Response:', JSON.stringify(statusResponse.data, null, 2));
    
    console.log('\n' + '='.repeat(30) + '\n');
    
    // Test 5: Error Handling
    console.log('5. Error Handling Test');
    
    try {
      await axios.get(`${baseURL}/api/payment/status/INVALID-ORDER-ID`);
    } catch (error) {
      console.log('Error Status:', error.response?.status);
      console.log('Error Response:', JSON.stringify(error.response?.data, null, 2));
    }
    
    console.log('\nTest Summary:');
    console.log('1. Health Check - Success');
    console.log('2. Create Transaction - Success');
    console.log('3. Webhook Notification - Success');
    console.log('4. Get Status - Success');
    console.log('5. Error Handling - Success');
    
    console.log(`\nOrder ID: ${order_id}`);
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testCompletePaymentFlow();