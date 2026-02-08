# Cart API Documentation

## Overview
The Cart module provides a complete shopping cart functionality for the ShopZen e-commerce backend. It allows authenticated users to manage their shopping cart with operations like adding, updating, and removing items.

## Features
- ✅ Get user's cart with calculated totals
- ✅ Add items to cart (creates cart automatically if doesn't exist)
- ✅ Update item quantities
- ✅ Remove items from cart
- ✅ Clear entire cart
- ✅ Stock validation
- ✅ Automatic price calculation with discounts
- ✅ Protected routes (authentication required)

## API Endpoints

All endpoints require authentication via Bearer token in the Authorization header.

### 1. Get User's Cart
**GET** `/api/v1/cart`

Returns the user's cart with all items, product details, and calculated totals.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": "cart-uuid",
  "userId": "user-uuid",
  "items": [
    {
      "id": "cart-item-uuid",
      "cartId": "cart-uuid",
      "productId": "product-uuid",
      "quantity": 2,
      "product": {
        "id": "product-uuid",
        "title": "Product Name",
        "price": 99.99,
        "discountPercentage": 10,
        "thumbnail": "https://...",
        "stock": 50,
        "availabilityStatus": "In Stock"
      }
    }
  ],
  "totalItems": 2,
  "totalPrice": 179.98,
  "createdAt": "2026-02-08T12:00:00.000Z",
  "updatedAt": "2026-02-08T12:30:00.000Z"
}
```

**Empty Cart Response:**
```json
{
  "id": null,
  "userId": "user-uuid",
  "items": [],
  "totalItems": 0,
  "totalPrice": 0
}
```

---

### 2. Add Item to Cart
**POST** `/api/v1/cart/items`

Adds a product to the cart. If the item already exists, it increments the quantity.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": "product-uuid",
  "quantity": 2
}
```

**Response (201 Created):**
```json
{
  "message": "Item added to cart",
  "cartItem": {
    "id": "cart-item-uuid",
    "cartId": "cart-uuid",
    "productId": "product-uuid",
    "quantity": 2,
    "product": {
      "id": "product-uuid",
      "title": "Product Name",
      "price": 99.99,
      "discountPercentage": 10,
      "thumbnail": "https://...",
      "stock": 50
    }
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request data or insufficient stock
- `404 Not Found` - Product not found
- `401 Unauthorized` - Missing or invalid token

---

### 3. Update Cart Item Quantity
**PUT** `/api/v1/cart/items`

Updates the quantity of an existing cart item.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": "product-uuid",
  "quantity": 5
}
```

**Response (200 OK):**
```json
{
  "message": "Cart item updated",
  "cartItem": {
    "id": "cart-item-uuid",
    "cartId": "cart-uuid",
    "productId": "product-uuid",
    "quantity": 5,
    "product": {
      "id": "product-uuid",
      "title": "Product Name",
      "price": 99.99
    }
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid data or insufficient stock
- `404 Not Found` - Cart or product not found
- `401 Unauthorized` - Missing or invalid token

---

### 4. Remove Item from Cart
**DELETE** `/api/v1/cart/items`

Removes a specific item from the cart.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": "product-uuid"
}
```

**Response (200 OK):**
```json
{
  "message": "Item removed from cart"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid product ID
- `404 Not Found` - Cart not found
- `401 Unauthorized` - Missing or invalid token

---

### 5. Clear Cart
**DELETE** `/api/v1/cart`

Removes all items from the user's cart.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "message": "Cart cleared"
}
```

**Error Responses:**
- `404 Not Found` - Cart not found
- `401 Unauthorized` - Missing or invalid token

---

## Business Logic

### Stock Validation
- When adding items, the system checks if sufficient stock is available
- When updating quantities, stock is validated before the update
- Returns `INSUFFICIENT_STOCK` error if stock is not available

### Price Calculation
The cart automatically calculates:
- **Item Price**: `price - (price * discountPercentage / 100)`
- **Total Items**: Sum of all item quantities
- **Total Price**: Sum of (item price × quantity) for all items

### Cart Creation
- Cart is automatically created when a user adds their first item
- One cart per user (enforced by unique constraint on userId)

### Duplicate Items
- If adding an item that already exists in cart, the quantities are merged
- Uses unique constraint on `(cartId, productId)` to prevent duplicates

---

## Error Codes

| Error Code | Description |
|------------|-------------|
| `PRODUCT_NOT_FOUND` | Product ID doesn't exist |
| `INSUFFICIENT_STOCK` | Not enough stock available |
| `CART_NOT_FOUND` | User doesn't have a cart |

---

## Database Schema

### Cart Model
```prisma
model Cart {
  id        String     @id @default(uuid())
  userId    String     @unique
  user      User       @relation(fields: [userId], references: [id])
  items     CartItem[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}
```

### CartItem Model
```prisma
model CartItem {
  id        String @id @default(uuid())
  cartId    String
  productId String
  quantity  Int

  cart    Cart    @relation(fields: [cartId], references: [id])
  product Product @relation(fields: [productId], references: [id])

  @@unique([cartId, productId])
}
```

---

## Testing Examples

### Using cURL

**Get Cart:**
```bash
curl -X GET http://localhost:3000/api/v1/cart \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Add to Cart:**
```bash
curl -X POST http://localhost:3000/api/v1/cart/items \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product-uuid",
    "quantity": 2
  }'
```

**Update Quantity:**
```bash
curl -X PUT http://localhost:3000/api/v1/cart/items \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product-uuid",
    "quantity": 5
  }'
```

**Remove Item:**
```bash
curl -X DELETE http://localhost:3000/api/v1/cart/items \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product-uuid"
  }'
```

**Clear Cart:**
```bash
curl -X DELETE http://localhost:3000/api/v1/cart \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Implementation Details

### File Structure
```
src/modules/cart/
├── cart.service.js      # Business logic
├── cart.controller.js   # Request handlers
├── cart.schema.js       # Zod validation schemas
└── cart.routes.js       # Express routes
```

### Dependencies
- `@prisma/client` - Database ORM
- `zod` - Schema validation
- `express` - Web framework
- `jsonwebtoken` - Authentication (via middleware)

---

## Security
- All routes protected by JWT authentication middleware
- User can only access their own cart (userId from JWT token)
- Input validation using Zod schemas
- Stock validation to prevent overselling

---

## Future Enhancements
- [ ] Add cart expiration (auto-clear after X days)
- [ ] Save for later functionality
- [ ] Cart sharing/guest carts
- [ ] Price change notifications
- [ ] Stock reservation during checkout
- [ ] Bulk operations (add multiple items at once)
