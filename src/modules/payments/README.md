# Payment Module Documentation

## Overview
The Payment Module handles the integration with payment gateways, specifically fully integrated with **Razorpay**. It manages the `Payment` entity lifecycle and ensures atomic updates with the `Order` entity.

## Features
- **Initiate Payment**: Creates a Razorpay Order and records it in the database.
- **Verify Payment**: Validates the Razorpay signature to confirm successful payment securely.
- **Atomic Status Updates**: Uses database transactions to ensure that when a Payment is marked `SUCCESS`, the corresponding Order is marked `PAID`.
- **Idempotency**: Prevents double payment processing for the same order.

## Prerequisites
To use Razorpay, you must set the following environment variables in your `.env` file:
```env
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="your_key_secret"
```

## API Endpoints

### 1. Initiate Payment
**POST** `/api/v1/payments/initiate`

Starts the payment flow.

**Request Body:**
```json
{
  "orderId": "uuid-of-order",
  "provider": "RAZORPAY",
  "currency": "INR"
}
```

**Response:**
```json
{
  "payment": {
    "id": "payment-uuid",
    "status": "PENDING",
    "amount": 499,
    "providerOrderId": "order_Kz...",
    ...
  },
  "gatewayDetails": {
    "key": "rzp_test_...",
    "orderId": "order_Kz...", // Use this in checkout options
    "amount": 49900, // paise
    "currency": "INR",
    "name": "ShopZen",
    ...
  }
}
```

### 2. Verify Payment (Signature)
**POST** `/api/v1/payments/confirm`

Call this after the frontend receives success from the Razorpay checkout modal.

**Request Body:**
```json
{
  "orderId": "order_Kz...", // razorpay_order_id received from initiate
  "paymentId": "pay_Lb...", // razorpay_payment_id received from gateway
  "signature": "generated_signature...", // razorpay_signature
  "provider": "RAZORPAY"
}
```

**Response:**
```json
{
  "message": "Verification successful"
}
```

### 3. Payment Webhook
**POST** `/api/v1/payments/webhook`

Razorpay sends updates here (no auth required, signature verified).

**Request Body:** (Razorpay Event JSON)

### 4. Get Payment for Order
**GET** `/api/v1/payments/orders/:orderId`

Returns the payment record for a specific order.

## Frontend Integration Guide (React Example)

1. **Install Razorpay Script**: Add `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>` to your `index.html`.
2. **Initiate Payment**:
   ```javascript
   const { data } = await axios.post('/api/v1/payments/initiate', { orderId, provider: 'RAZORPAY' });
   
   const options = {
     key: data.gatewayDetails.key,
     amount: data.gatewayDetails.amount,
     currency: data.gatewayDetails.currency,
     name: "ShopZen",
     description: "Test Transaction",
     order_id: data.gatewayDetails.orderId,
     handler: async function (response) {
       await axios.post('/api/v1/payments/confirm', {
         provider: 'RAZORPAY',
         orderId: response.razorpay_order_id,
         paymentId: response.razorpay_payment_id,
         signature: response.razorpay_signature
       });
       alert("Payment Successful");
     },
     prefill: {
       name: "User Name",
       email: "user@example.com"
     },
     theme: {
       color: "#3399cc"
     }
   };
   
   const rzp1 = new window.Razorpay(options);
   rzp1.open();
   ```
