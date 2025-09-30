require('dotenv').config();

console.log('🔧 Checking Midtrans Configuration...');
console.log('Server Key:', process.env.MIDTRANS_SERVER_KEY ? 'SET' : 'NOT SET');
console.log('Client Key:', process.env.MIDTRANS_CLIENT_KEY ? 'SET' : 'NOT SET');

if (process.env.MIDTRANS_SERVER_KEY) {
  console.log('Server Key Preview:', process.env.MIDTRANS_SERVER_KEY.substring(0, 20) + '...');
}

const { snap } = require('../config/midtrans');

async function testMidtransConnection() {
  try {
    console.log('\nTesting Midtrans Connection');
    
    const parameter = {
      transaction_details: {
        order_id: `test-${Date.now()}`,
        gross_amount: 10000
      },
      credit_card: {
        secure: true
      },
      customer_details: {
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
        phone: "081234567890"
      }
    };

    const transaction = await snap.createTransaction(parameter);
    console.log('Midtrans Connection Success!');
    console.log('Token received:', transaction.token ? 'YES' : 'NO');
    console.log('Redirect URL:', transaction.redirect_url ? 'YES' : 'NO');
    
  } catch (error) {
    console.log('Midtrans Connection Failed:');
    console.log('Error:', error.message);
    
    if (error.httpStatusCode) {
      console.log('HTTP Status:', error.httpStatusCode);
    }
    
    if (error.ApiResponse) {
      console.log('API Response:', JSON.stringify(error.ApiResponse, null, 2));
    }
  }
}

testMidtransConnection();