const axios = require('axios');
const { ObjectId } = require('mongodb');

// Test API Payment Create
async function testPaymentAPI() {
  try {
    console.log('Testing Payment API...');
    
    const payload = {
      userId: new ObjectId().toString(), // Generate valid ObjectId
      customer_name: "Test",
      customer_phone: "081234567890", 
      delivery_address: "Jl. Test No. 123",
      items: [
        {
          menuId: new ObjectId().toString(), 
          name: "Nasi Goreng",
          price: 25000,
          quantity: 1
        }
      ]
    };

    const response = await axios.post('http://localhost:5000/api/payment/create', payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('Error:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else if (error.request) {
      console.log('No response received:', error.message);
    } else {
      console.log('Error:', error.message);
    }
  }
}

async function testHealthCheck() {
  try {
    console.log('🏥 Testing Health Check...');
    const response = await axios.get('http://localhost:5000/health');
    console.log('Health Check OK:', response.data);
  } catch (error) {
    console.log('Health Check Failed:', error.message);
  }
}

async function runTests() {
  await testHealthCheck();
  console.log('---');
  await testPaymentAPI();
}

runTests();