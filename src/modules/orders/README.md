# Orders API Documentation

## Overview
The Orders module provides complete order management functionality for the ShopZen e-commerce backend. It handles order creation from cart, order tracking, status updates, payment processing, and admin operations.

## Features
- ✅ Create orders from cart with automatic stock management
- ✅ Get user's order history with filtering and pagination
- ✅ Get detailed order information
- ✅ Cancel orders (with stock restoration)
- ✅ Update order status (admin)
- ✅ Payment integration (Stripe, Razorpay, PayPal)
- ✅ Admin dashboard for all orders
- ✅ Order address management
- ✅ Automatic cart clearing after order creation

## Order Lifecycle

```
PENDING → PAID → SHIPPED → DELIVERED
    ↓
CANCELLED (only from PENDING or PAID)
```

## API Endpoints

All endpoints require authentication via Bearer token.

---

### 1. Create Order from Cart
**POST** `/api/v1/orders`

Creates an order from the user's cart items and clears the cart.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "address": {
    "fullName": "John Doe",
    "phone": "1234567890",
    "line1": "123 Main Street",
    "line2": "Apt 4B",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001",
    "country": "India"
  }
}
```

**Response (201 Created):**
```json
{
  "message": "Order created successfully",
  "order": {
    "id": "order-uuid",
    "userId": "user-uuid",
    "status": "PENDING",
    "totalAmount": 499.99,
    "items": [
      {
        "id": "order-item-uuid",
        "orderId": "order-uuid",
        "productId": "product-uuid",
        "quantity": 2,
        "price": 99.99,
        "product": {
          "id": "product-uuid",
          "title": "Product Name",
          "thumbnail": "https://..."
        }
      }
    ],
    "orderAddress": {
      "id": "address-uuid",
      "fullName": "John Doe",
      "phone": "1234567890",
      "line1": "123 Main Street",
      "line2": "Apt 4B",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400001",
      "country": "India"
    },
    "createdAt": "2026-02-08T12:00:00.000Z",
    "updatedAt": "2026-02-08T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Cart is empty or insufficient stock
- `401 Unauthorized` - Missing or invalid token

**What Happens:**
1. Validates cart has items
2. Checks stock availability for all items
3. Creates order with items and address
4. Decrements product stock
5. Clears user's cart
6. Returns complete order details

---

### 2. Get User's Orders
**GET** `/api/v1/orders`

Retrieves all orders for the authenticated user with optional filtering.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `status` (optional) - Filter by order status: `PENDING`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED`
- `limit` (optional) - Number of orders to return (default: 10, max: 100)
- `offset` (optional) - Pagination offset (default: 0)

**Example:**
```
GET /api/v1/orders?status=PENDING&limit=5&offset=0
```

**Response (200 OK):**
```json
{
  "orders": [
    {
      "id": "order-uuid",
      "userId": "user-uuid",
      "status": "PENDING",
      "totalAmount": 499.99,
      "items": [...],
      "orderAddress": {...},
      "payment": null,
      "createdAt": "2026-02-08T12:00:00.000Z",
      "updatedAt": "2026-02-08T12:00:00.000Z"
    }
  ],
  "total": 15,
  "limit": 5,
  "offset": 0
}
```

---

### 3. Get Single Order
**GET** `/api/v1/orders/:orderId`

Retrieves detailed information about a specific order.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": "order-uuid",
  "userId": "user-uuid",
  "status": "PAID",
  "totalAmount": 499.99,
  "items": [
    {
      "id": "order-item-uuid",
      "productId": "product-uuid",
      "quantity": 2,
      "price": 99.99,
      "product": {
        "id": "product-uuid",
        "title": "Product Name",
        "price": 99.99,
        "thumbnail": "https://...",
        "category": "Electronics"
      }
    }
  ],
  "orderAddress": {
    "fullName": "John Doe",
    "phone": "1234567890",
    "line1": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001",
    "country": "India"
  },
  "payment": {
    "id": "payment-uuid",
    "provider": "RAZORPAY",
    "amount": 499.99,
    "currency": "INR",
    "status": "SUCCESS"
  },
  "user": {
    "id": "user-uuid",
    "email": "user@example.com"
  },
  "createdAt": "2026-02-08T12:00:00.000Z",
  "updatedAt": "2026-02-08T12:30:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Order doesn't exist
- `403 Forbidden` - User trying to access another user's order

---

### 4. Cancel Order
**POST** `/api/v1/orders/:orderId/cancel`

Cancels an order and restores product stock. Only available for PENDING or PAID orders.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "message": "Order cancelled successfully",
  "order": {
    "id": "order-uuid",
    "status": "CANCELLED",
    "totalAmount": 499.99,
    "items": [...],
    "orderAddress": {...},
    "payment": {...}
  }
}
```

**Error Responses:**
- `404 Not Found` - Order doesn't exist
- `403 Forbidden` - Unauthorized access
- `400 Bad Request` - Order cannot be cancelled (already shipped/delivered)

**What Happens:**
1. Validates order exists and belongs to user
2. Checks order status (must be PENDING or PAID)
3. Updates order status to CANCELLED
4. Restores product stock for all items

---

### 5. Update Order Status
**PATCH** `/api/v1/orders/:orderId/status`

Updates the status of an order. Users can only cancel their orders. Admins can update to any status.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "SHIPPED"
}
```

**Valid Status Values:**
- `PENDING`
- `PAID`
- `SHIPPED` (admin only)
- `DELIVERED` (admin only)
- `CANCELLED` (user can cancel own orders)

**Response (200 OK):**
```json
{
  "message": "Order status updated",
  "order": {
    "id": "order-uuid",
    "status": "SHIPPED",
    "totalAmount": 499.99,
    "items": [...],
    "orderAddress": {...},
    "payment": {...}
  }
}
```

**Error Responses:**
- `403 Forbidden` - Admin access required or unauthorized
- `404 Not Found` - Order doesn't exist
- `400 Bad Request` - Invalid status transition

---

### 6. Get All Orders (Admin)
**GET** `/api/v1/orders/admin/all`

Retrieves all orders in the system. **Admin only.**

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Query Parameters:**
- `status` (optional) - Filter by status
- `limit` (optional) - Number of orders (default: 20, max: 100)
- `offset` (optional) - Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "orders": [
    {
      "id": "order-uuid",
      "userId": "user-uuid",
      "status": "PENDING",
      "totalAmount": 499.99,
      "items": [...],
      "orderAddress": {...},
      "payment": {...},
      "user": {
        "id": "user-uuid",
        "email": "user@example.com"
      },
      "createdAt": "2026-02-08T12:00:00.000Z"
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

---

### 7. Create Payment
**POST** `/api/v1/orders/:orderId/payment`

Creates a payment record for an order.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "provider": "RAZORPAY",
  "providerOrderId": "order_xyz123",
  "currency": "INR",
  "status": "CREATED"
}
```

**Valid Providers:**
- `STRIPE`
- `RAZORPAY`
- `PAYPAL`

**Valid Payment Status:**
- `CREATED`
- `PENDING`
- `SUCCESS`
- `FAILED`
- `REFUNDED`

**Response (201 Created):**
```json
{
  "message": "Payment record created",
  "payment": {
    "id": "payment-uuid",
    "orderId": "order-uuid",
    "provider": "RAZORPAY",
    "providerOrderId": "order_xyz123",
    "amount": 499.99,
    "currency": "INR",
    "status": "CREATED",
    "createdAt": "2026-02-08T12:00:00.000Z"
  }
}
```

---

### 8. Update Payment Status
**PATCH** `/api/v1/orders/:orderId/payment`

Updates the payment status. When status is set to SUCCESS, the order status is automatically updated to PAID.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "SUCCESS",
  "providerPaymentId": "pay_abc123"
}
```

**Response (200 OK):**
```json
{
  "message": "Payment status updated",
  "payment": {
    "id": "payment-uuid",
    "orderId": "order-uuid",
    "provider": "RAZORPAY",
    "providerOrderId": "order_xyz123",
    "providerPaymentId": "pay_abc123",
    "amount": 499.99,
    "currency": "INR",
    "status": "SUCCESS",
    "updatedAt": "2026-02-08T12:05:00.000Z"
  }
}
```

**What Happens:**
1. Updates payment status
2. If status is SUCCESS, updates order status to PAID
3. Returns updated payment record

---

## Business Logic

### Order Creation Flow
1. **Validate Cart**: Ensures cart has items
2. **Stock Check**: Validates all items have sufficient stock
3. **Calculate Total**: Computes total with discounts
4. **Create Order**: Creates order, items, and address in transaction
5. **Update Stock**: Decrements product stock
6. **Clear Cart**: Removes all items from cart

### Stock Management
- Stock is decremented when order is created
- Stock is restored when order is cancelled
- Stock validation prevents overselling

### Order Cancellation Rules
- Only PENDING or PAID orders can be cancelled
- SHIPPED and DELIVERED orders cannot be cancelled
- Cancelling restores product stock

### Payment Integration
- Payment record is created separately from order
- When payment succeeds, order status updates to PAID
- Supports multiple payment providers

### Access Control
- Users can only access their own orders
- Admins can view all orders
- Only admins can mark orders as SHIPPED or DELIVERED
- Users can cancel their own PENDING/PAID orders

---

## Database Schema

### Order Model
```prisma
model Order {
  id     String @id @default(uuid())
  userId String
  user   User   @relation(fields: [userId], references: [id])

  status      OrderStatus @default(PENDING)
  totalAmount Float

  items OrderItem[]

  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  orderAddress OrderAddress?
  payment      Payment?
}
```

### OrderItem Model
```prisma
model OrderItem {
  id        String @id @default(uuid())
  orderId   String
  productId String

  quantity Int
  price    Float

  order   Order   @relation(fields: [orderId], references: [id])
  product Product @relation(fields: [productId], references: [id])

  @@unique([orderId, productId])
}
```

### OrderAddress Model
```prisma
model OrderAddress {
  id      String @id @default(uuid())
  orderId String @unique
  order   Order  @relation(fields: [orderId], references: [id])

  fullName   String
  phone      String
  line1      String
  line2      String?
  city       String
  state      String
  postalCode String
  country    String
}
```

### Payment Model
```prisma
model Payment {
  id      String @id @default(uuid())
  orderId String @unique
  order   Order  @relation(fields: [orderId], references: [id])

  provider          PaymentProvider
  providerOrderId   String?
  providerPaymentId String?

  amount   Float
  currency String        @default("INR")
  status   PaymentStatus

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## Testing Examples

### Create Order
```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "address": {
      "fullName": "John Doe",
      "phone": "1234567890",
      "line1": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400001",
      "country": "India"
    }
  }'
```

### Get Orders
```bash
curl -X GET "http://localhost:3000/api/v1/orders?status=PENDING&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Cancel Order
```bash
curl -X POST http://localhost:3000/api/v1/orders/ORDER_ID/cancel \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Payment
```bash
curl -X POST http://localhost:3000/api/v1/orders/ORDER_ID/payment \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "RAZORPAY",
    "providerOrderId": "order_xyz123",
    "currency": "INR",
    "status": "CREATED"
  }'
```

### Update Payment Status
```bash
curl -X PATCH http://localhost:3000/api/v1/orders/ORDER_ID/payment \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "SUCCESS",
    "providerPaymentId": "pay_abc123"
  }'
```

---

## Error Codes

| Error Code | Description |
|------------|-------------|
| `CART_EMPTY` | User's cart has no items |
| `INSUFFICIENT_STOCK_*` | Not enough stock for product |
| `ORDER_NOT_FOUND` | Order ID doesn't exist |
| `UNAUTHORIZED` | User accessing another user's order |
| `ADMIN_ONLY` | Admin access required |
| `CANNOT_CANCEL_ORDER` | Order in non-cancellable state |
| `PAYMENT_NOT_FOUND` | Payment record doesn't exist |

---

## Security
- All routes protected by JWT authentication
- Role-based access control for admin operations
- Users can only access their own orders
- Input validation using Zod schemas
- Transaction-based operations for data consistency

---

## Future Enhancements
- [ ] Order tracking with shipment details
- [ ] Email notifications for order updates
- [ ] Invoice generation
- [ ] Partial refunds
- [ ] Order modification before shipping
- [ ] Bulk order operations
- [ ] Order analytics and reporting
- [ ] Webhook support for payment providers
