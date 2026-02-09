# ShopZen Backend API Overview

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/auth/register` | Register new user | None |
| `POST` | `/api/v1/auth/login` | Login with email/password | None |
| `GET` | `/api/v1/auth/google` | Initiate Google OAuth login | None |
| `GET` | `/api/v1/auth/google/callback` | Google OAuth callback | None |

### Products
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/products` | Get all products | None |
| `GET` | `/api/v1/products/:id` | Get single product | None |
| `POST` | `/api/v1/products` | Create product | Admin |
| `PUT` | `/api/v1/products/:id` | Update product | Admin |
| `DELETE` | `/api/v1/products/:id` | Delete product | Admin |

### Cart
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/cart` | Get user's cart | User |
| `POST` | `/api/v1/cart/items` | Add item to cart | User |
| `PUT` | `/api/v1/cart/items` | Update item quantity | User |
| `DELETE` | `/api/v1/cart/items` | Remove item from cart | User |
| `DELETE` | `/api/v1/cart` | Clear entire cart | User |

### Wishlist
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/wishlist` | Get user's wishlist | User |
| `POST` | `/api/v1/wishlist/items` | Add item to wishlist | User |
| `DELETE` | `/api/v1/wishlist/items/:productId` | Remove item | User |
| `POST` | `/api/v1/wishlist/items/move-to-cart` | Move item to cart | User |

### Orders
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/orders` | Get user's order history | User |
| `GET` | `/api/v1/orders/:orderId` | Get single order details | User |
| `POST` | `/api/v1/orders` | Create order from cart | User |
| `POST` | `/api/v1/orders/:orderId/cancel` | Cancel order | User |
| `GET` | `/api/v1/orders/admin/all` | Get all orders | Admin |
| `PATCH` | `/api/v1/orders/:orderId/status` | Update order status | Admin |
| `POST` | `/api/v1/orders/:orderId/payment` | Create payment | User |
| `PATCH` | `/api/v1/orders/:orderId/payment` | Update payment status | User |

### AI Chat
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/chat` | Send message to AI assistant | User |
| `GET` | `/api/v1/chat/history` | Get conversation history | User |
| `DELETE` | `/api/v1/chat/history` | Clear conversation history | User |

### Health
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/health` | Health check | None |

## User Flows

### 1. Authentication
Users can sign in via:
- **Email/Password**: `POST /auth/login`
- **Google OAuth**: `GET /auth/google` -> Redirects to Google -> Callback returns tokens

### 2. Shopping Experience
1. **Browse**: `GET /products`
2. **Save for Later**: `POST /wishlist/items`
3. **Add to Cart**: `POST /cart/items` or `POST /wishlist/items/move-to-cart`
4. **Checkout**: `POST /orders` (Uses items from cart)

### 3. Order Management
1. **Track Orders**: `GET /orders` (List) -> `GET /orders/:id` (Details)
2. **Payment**: `POST /orders/:id/payment` -> `PATCH /orders/:id/payment` (Success)
3. **Cancel**: `POST /orders/:id/cancel` (Only if PENDING/PAID)

### 4. AI Assistance
1. **Ask Question**: `POST /chat` ("Where is my order?", "Recommend running shoes")
2. **AI Tools**: System automatically calls `getOrderStatus` or `searchProducts` tools
3. **Response**: AI replies with real data

## 📂 Project Structure

```
shopzen-backend/
├── src/
│   ├── modules/
│   │   ├── auth/         # Login, Register, Google OAuth
│   │   ├── products/     # Product Catalog
│   │   ├── cart/         # Shopping Cart Logic
│   │   ├── wishlist/     # Wishlist Management
│   │   ├── orders/       # Order Processing & History
│   │   ├── payments/     # Payment Handling
│   │   └── chat/         # AI Chatbot (Gemini)
│   ├── middleware/       # Auth, Validation, Rate Limiting
│   ├── utils/            # Prisma Client, Helpers
│   └── config/           # Passport.js Config
```

## 🗄️ Database Schema Relationships

```
User ──┬── Cart ──── CartItem ──── Product
       │
       ├── Wishlist ── WishlistItem ─ Product
       │
       ├── Order ──┬── OrderItem ──── Product
       │           │
       │           ├── OrderAddress
       │           │
       │           └── Payment
       │
       ├── Address
       │
       └── AIConversation ── AIMessage
```

## 🚀 Environment Setup

Required `.env` variables:

```env
# Database
DATABASE_URL="postgresql://..."

# Security
JWT_ACCESS_SECRET="secret"
JWT_SECRET="refresh-secret"
SALT=10

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_CALLBACK_URL="..."

# AI (Gemini)
GEMINI_API_KEY="..."

# Server
PORT=3000
```
