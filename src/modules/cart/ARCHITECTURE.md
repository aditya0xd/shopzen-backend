# Cart Module Architecture

## Request Flow

```
Client Request
     ↓
[cart.routes.js] - Route definitions & auth middleware
     ↓
[cart.controller.js] - Request validation & error handling
     ↓
[cart.schema.js] - Zod validation
     ↓
[cart.service.js] - Business logic & database operations
     ↓
Prisma Client → PostgreSQL Database
     ↓
Response to Client
```

## Module Structure

```
src/modules/cart/
│
├── cart.routes.js
│   ├── GET    /api/v1/cart              → getUserCart
│   ├── POST   /api/v1/cart/items        → addItemToCart
│   ├── PUT    /api/v1/cart/items        → updateCartItemQuantity
│   ├── DELETE /api/v1/cart/items        → removeItemFromCart
│   └── DELETE /api/v1/cart              → clearUserCart
│
├── cart.controller.js
│   ├── getUserCart()
│   ├── addItemToCart()
│   ├── updateCartItemQuantity()
│   ├── removeItemFromCart()
│   └── clearUserCart()
│
├── cart.schema.js
│   ├── addToCartSchema
│   ├── updateCartItemSchema
│   └── removeFromCartSchema
│
├── cart.service.js
│   ├── getCart()
│   ├── addToCart()
│   ├── updateCartItem()
│   ├── removeFromCart()
│   ├── clearCart()
│   └── getOrCreateCart()
│
└── README.md
    └── Complete API documentation
```

## Database Relations

```
User (1) ←→ (1) Cart
                ↓
            (1 to many)
                ↓
            CartItem (many) ←→ (1) Product
```

## Add to Cart Flow

```
1. Client sends POST /api/v1/cart/items
   {
     "productId": "uuid",
     "quantity": 2
   }

2. authMiddleware verifies JWT token
   → Extracts userId from token

3. cart.controller validates request
   → Uses addToCartSchema (Zod)

4. cart.service.addToCart()
   a. Check if product exists
   b. Validate stock availability
   c. Get or create user's cart
   d. Check if item already in cart
      - If yes: Update quantity
      - If no: Create new cart item
   e. Return cart item with product details

5. Response sent to client
   {
     "message": "Item added to cart",
     "cartItem": { ... }
   }
```

## Get Cart Flow

```
1. Client sends GET /api/v1/cart

2. authMiddleware verifies token
   → Extracts userId

3. cart.service.getCart()
   a. Find cart by userId
   b. Include all cart items with product details
   c. Calculate totals:
      - totalItems = sum of quantities
      - totalPrice = sum of (price - discount) × quantity
   d. Return cart with calculated fields

4. Response:
   {
     "id": "cart-uuid",
     "userId": "user-uuid",
     "items": [...],
     "totalItems": 5,
     "totalPrice": 499.95
   }
```

## Error Handling

```
Service Layer Errors:
├── PRODUCT_NOT_FOUND     → 404 Not Found
├── INSUFFICIENT_STOCK    → 400 Bad Request
└── CART_NOT_FOUND        → 404 Not Found

Validation Errors:
├── Invalid UUID          → 400 Bad Request
├── Negative quantity     → 400 Bad Request
└── Missing fields        → 400 Bad Request

Auth Errors:
├── Missing token         → 401 Unauthorized
└── Invalid token         → 401 Unauthorized
```

## Key Design Decisions

### 1. Auto Cart Creation
- Cart is created automatically when user adds first item
- Simplifies frontend logic (no need to create cart explicitly)

### 2. Quantity Merging
- If item exists in cart, quantities are added together
- Uses unique constraint on (cartId, productId)

### 3. Stock Validation
- Checked before adding or updating items
- Prevents overselling

### 4. Price Calculation
- Done server-side to prevent tampering
- Includes discount calculation
- Returns final totals with cart

### 5. Authentication Required
- All routes protected
- User can only access their own cart
- userId from JWT token ensures security

## Testing Checklist

- [ ] Add item to empty cart (creates cart)
- [ ] Add same item twice (merges quantities)
- [ ] Add item with insufficient stock (error)
- [ ] Add item that doesn't exist (error)
- [ ] Update item quantity
- [ ] Update with insufficient stock (error)
- [ ] Remove item from cart
- [ ] Clear entire cart
- [ ] Get cart with multiple items
- [ ] Get empty cart
- [ ] Access without token (401)
- [ ] Access with invalid token (401)

## Performance Considerations

### Current Implementation
- Single database queries for most operations
- Includes product details in responses (reduces frontend calls)
- Calculates totals on-the-fly

### Future Optimizations
- Cache cart totals in database
- Batch operations for multiple items
- Implement cart item limits
- Add pagination for large carts
