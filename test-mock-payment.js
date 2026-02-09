const axios = require('axios');

async function testMockPayment() {
    try {
        // 1. You need an order ID first. Create one manually or pick existing.
        // For this test script, we assume a valid order ID.
        const orderId = 'REPLACE_WITH_VALID_ORDER_ID';

        console.log(`Processing mock payment for Order: ${orderId}`);

        const response = await axios.post('http://localhost:3000/api/v1/payments/mock-success', {
            orderId: orderId
        });

        console.log('Success:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

// testMockPayment();
console.log("Run this script with a valid order ID to test mock payments.");
console.log("Endpoint: POST http://localhost:3000/api/v1/payments/mock-success");
console.log("Body: { \"orderId\": \"...\" }");
