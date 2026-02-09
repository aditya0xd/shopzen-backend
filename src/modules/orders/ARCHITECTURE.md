# Orders Module Architecture

## Request Flow

```
Client Request
     ↓
[order.routes.js] - Route definitions, auth & role middleware
     ↓
[order.controller.js] - Request validation & error handling
     ↓
[order.schema.js] - Zod validation
     ↓
[order.service.js] - Business logic & database operations
     ↓
Prisma Client → PostgreSQL Database
     ↓
Response to Client
```

## Module Structure

```
src/modules/orders/
│
├── order.routes.js
│   ├── POST   /api/v1/orders                    → createOrder
│   ├── GET    /api/v1/orders                    → getOrders
│   ├── GET    /api/v1/orders/:orderId           → getOrder
│   ├── POST   /api/v1/orders/:orderId/cancel    → cancelUserOrder
│   ├── PATCH  /api/v1/orders/:orderId/status    → updateStatus
│   ├── POST   /api/v1/orders/:orderId/payment   → createOrderPayment
│   ├── PATCH  /api/v1/orders/:orderId/payment   → updateOrderPaymentStatus
│   └── GET    /api/v1/orders/admin/all          → getAllOrdersAdmin (ADMIN)
│
├── order.controller.js
│   ├── createOrder()
│   ├── getOrders()
│   ├── getOrder()
│   ├── updateStatus()
│   ├── cancelUserOrder()
│   ├── getAllOrdersAdmin()
│   ├── createOrderPayment()
│   └── updateOrderPaymentStatus()
│
├── order.schema.js
│   ├── createOrderSchema
│   ├── updateOrderStatusSchema
│   ├── createPaymentSchema
│   ├── updatePaymentStatusSchema
│   └── getOrdersQuerySchema
│
├── order.service.js
│   ├── createOrderFromCart()
│   ├── getUserOrders()
│   ├── getOrderById()
│   ├── updateOrderStatus()
│   ├── cancelOrder()
│   ├── getAllOrders()
│   ├── createPayment()
│   └── updatePaymentStatus()
│
└── README.md
    └── Complete API documentation
```

## Database Relations

```
User (1) ←→ (many) Order
                     ↓
                 (1 to many)
                     ↓
                 OrderItem (many) ←→ (1) Product
                     
Order (1) ←→ (1) OrderAddress
Order (1) ←→ (1) Payment
```

## Order Creation Flow

```
1. Client sends POST /api/v1/orders
   {
     "address": {
       "fullName": "John Doe",
       "phone": "1234567890",
       "line1": "123 Main St",
       "city": "Mumbai",
       "state": "Maharashtra",
       "postalCode": "400001",
       "country": "India"
     }
   }

2. authMiddleware verifies JWT token
   → Extracts userId from token

3. order.controller validates request
   → Uses createOrderSchema (Zod)

4. order.service.createOrderFromCart()
   a. Get user's cart with all items
   b. Validate cart is not empty
   c. Validate stock for ALL items
   d. Calculate total amount with discounts
   e. Start database transaction:
      - Create order with items and address
      - Decrement stock for all products
      - Clear user's cart
   f. Return complete order details

5. Response sent to client
   {
     "message": "Order created successfully",
     "order": { ... }
   }
```

## Order Lifecycle State Machine

```
                    ┌─────────┐
                    │ PENDING │
                    └────┬────┘
                         │
                    ┌────▼────┐
            ┌───────┤  PAID   ├───────┐
            │       └────┬────┘       │
            │            │            │
            │       ┌────▼────┐       │
            │       │ SHIPPED │       │
            │       └────┬────┘       │
            │            │            │
            │     ┌──────▼──────┐     │
            │     │  DELIVERED  │     │
            │     └─────────────┘     │
            │                         │
            │    ┌───────────────┐    │
            └───►│   CANCELLED   ◄────┘
                 └───────────────┘

Rules:
- PENDING → PAID (payment success)
- PAID → SHIPPED (admin only)
- SHIPPED → DELIVERED (admin only)
- PENDING/PAID → CANCELLED (user or admin)
- SHIPPED/DELIVERED cannot be cancelled
```

## Payment Integration Flow

```
1. Create Order
   POST /api/v1/orders
   → Order created with status: PENDING

2. Create Payment Record
   POST /api/v1/orders/:orderId/payment
   {
     "provider": "RAZORPAY",
     "providerOrderId": "order_xyz123",
     "currency": "INR",
     "status": "CREATED"
   }
   → Payment record created

3. User Completes Payment
   (External payment gateway)

4. Update Payment Status
   PATCH /api/v1/orders/:orderId/payment
   {
     "status": "SUCCESS",
     "providerPaymentId": "pay_abc123"
   }
   → Payment status: SUCCESS
   → Order status: PAID (automatic)

5. Admin Ships Order
   PATCH /api/v1/orders/:orderId/status
   {
     "status": "SHIPPED"
   }
   → Order status: SHIPPED

6. Admin Marks Delivered
   PATCH /api/v1/orders/:orderId/status
   {
     "status": "DELIVERED"
   }
   → Order status: DELIVERED
```

## Stock Management

### On Order Creation
```javascript
// For each cart item:
await prisma.product.update({
  where: { id: item.productId },
  data: {
    stock: {
      decrement: item.quantity  // Reduce stock
    }
  }
});
```

### On Order Cancellation
```javascript
// For each order item:
await prisma.product.update({
  where: { id: item.productId },
  data: {
    stock: {
      increment: item.quantity  // Restore stock
    }
  }
});
```

## Transaction Safety

### Order Creation Transaction
```javascript
await prisma.$transaction(async (tx) => {
  // 1. Create order with items and address
  const order = await tx.order.create({ ... });
  
  // 2. Update product stock
  for (const item of cartItems) {
    await tx.product.update({ ... });
  }
  
  // 3. Clear cart
  await tx.cartItem.deleteMany({ ... });
  
  return order;
});
```

### Order Cancellation Transaction
```javascript
await prisma.$transaction(async (tx) => {
  // 1. Update order status
  const order = await tx.order.update({ ... });
  
  // 2. Restore product stock
  for (const item of orderItems) {
    await tx.product.update({ ... });
  }
  
  return order;
});
```

### Payment Success Transaction
```javascript
await prisma.$transaction(async (tx) => {
  // 1. Update payment status
  const payment = await tx.payment.update({ ... });
  
  // 2. Update order status to PAID
  await tx.order.update({ ... });
  
  return payment;
});
```

## Access Control Matrix

| Route | User | Admin |
|-------|------|-------|
| Create Order | ✅ Own | ✅ Any |
| Get Orders | ✅ Own | ✅ All (via /admin/all) |
| Get Single Order | ✅ Own | ✅ Any |
| Cancel Order | ✅ Own (PENDING/PAID) | ✅ Any (PENDING/PAID) |
| Update Status (SHIPPED/DELIVERED) | ❌ | ✅ |
| Update Status (CANCELLED) | ✅ Own | ✅ Any |
| Create Payment | ✅ Own orders | ✅ Any |
| Update Payment | ✅ Own orders | ✅ Any |

## Error Handling

```
Service Layer Errors:
├── CART_EMPTY              → 400 Bad Request
├── INSUFFICIENT_STOCK_*    → 400 Bad Request
├── ORDER_NOT_FOUND         → 404 Not Found
├── UNAUTHORIZED            → 403 Forbidden
├── ADMIN_ONLY              → 403 Forbidden
├── CANNOT_CANCEL_ORDER     → 400 Bad Request
└── PAYMENT_NOT_FOUND       → 404 Not Found

Validation Errors:
├── Invalid address         → 400 Bad Request
├── Invalid status          → 400 Bad Request
├── Invalid provider        → 400 Bad Request
└── Invalid query params    → 400 Bad Request

Auth Errors:
├── Missing token           → 401 Unauthorized
├── Invalid token           → 401 Unauthorized
└── Insufficient role       → 403 Forbidden
```

## Key Design Decisions

### 1. Order from Cart Only
- Orders are created from cart items
- Ensures consistent pricing and availability
- Simplifies order creation process

### 2. Snapshot Pricing
- Order items store the price at time of purchase
- Protects against price changes after order
- Historical accuracy for reporting

### 3. Address Snapshot
- Order address is separate from user addresses
- Prevents issues if user updates/deletes addresses
- Maintains accurate shipping records

### 4. Transaction-Based Operations
- All critical operations use database transactions
- Ensures data consistency
- Prevents partial updates

### 5. Stock Management
- Stock decremented on order creation
- Stock restored on cancellation
- Prevents overselling

### 6. Payment Separation
- Payment is separate entity from order
- Supports multiple payment attempts
- Flexible payment provider integration

### 7. Role-Based Access
- Users manage their own orders
- Admins have full control
- Clear separation of concerns

## Performance Considerations

### Current Implementation
- Includes related data in single queries
- Uses pagination for list endpoints
- Indexes on userId and status (via Prisma)

### Optimizations
```prisma
// Recommended indexes
@@index([userId, status])
@@index([createdAt])
@@index([status, createdAt])
```

### Caching Opportunities
- Order details (rarely change after creation)
- Order counts by status
- User's recent orders

## Webhook Integration (Future)

### Payment Provider Webhooks
```javascript
// Example: Razorpay webhook
POST /api/v1/webhooks/razorpay
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_abc123",
        "order_id": "order_xyz123",
        "status": "captured"
      }
    }
  }
}

// Handler would:
1. Verify webhook signature
2. Find payment by providerOrderId
3. Update payment status
4. Update order status to PAID
```

## Testing Checklist

### Order Creation
- [ ] Create order from cart with items
- [ ] Create order with empty cart (error)
- [ ] Create order with insufficient stock (error)
- [ ] Verify stock is decremented
- [ ] Verify cart is cleared
- [ ] Verify total amount calculation

### Order Retrieval
- [ ] Get all user orders
- [ ] Get orders with status filter
- [ ] Get orders with pagination
- [ ] Get single order by ID
- [ ] Get order that doesn't exist (error)
- [ ] Get another user's order (error)

### Order Cancellation
- [ ] Cancel PENDING order
- [ ] Cancel PAID order
- [ ] Cancel SHIPPED order (error)
- [ ] Cancel DELIVERED order (error)
- [ ] Verify stock is restored
- [ ] Cancel another user's order (error)

### Order Status Updates
- [ ] Admin updates to SHIPPED
- [ ] Admin updates to DELIVERED
- [ ] User tries to update to SHIPPED (error)
- [ ] User cancels own order
- [ ] Update non-existent order (error)

### Payment
- [ ] Create payment record
- [ ] Update payment to SUCCESS
- [ ] Verify order status updates to PAID
- [ ] Update non-existent payment (error)

### Admin Operations
- [ ] Get all orders
- [ ] Filter orders by status
- [ ] Paginate through orders
- [ ] Non-admin access (error)

## Monitoring & Logging

### Key Metrics to Track
- Order creation rate
- Order cancellation rate
- Average order value
- Payment success rate
- Time to delivery
- Orders by status

### Important Logs
- Order creation with userId and total
- Payment status changes
- Order cancellations with reason
- Stock adjustments
- Failed transactions
