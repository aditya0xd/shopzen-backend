# ShopZen Backend API Overview

## Base URL
All endpoints below are mounted under the backend host, for example:
`http://localhost:3000`

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/auth/register` | Register user (email/password) | None |
| `POST` | `/api/v1/auth/login` | Login with email/password | None |
| `GET` | `/api/v1/auth/google` | Start Google OAuth | None |
| `GET` | `/api/v1/auth/google/callback` | Google OAuth callback | None |
| `GET` | `/api/v1/auth/google/failure` | OAuth failure handler | None |
| `GET` | `/api/v1/auth/me` | Current authenticated user info | User |
| `GET` | `/api/v1/auth/admin-only` | Admin guard test endpoint | Admin |

### Products
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/products` | Get product catalog | None |
| `GET` | `/api/v1/products/:id` | Get single product | None |
| `POST` | `/api/v1/products` | Create product | Admin |

### Cart
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/cart` | Get user cart | User |
| `POST` | `/api/v1/cart/items` | Add item to cart | User |
| `PUT` | `/api/v1/cart/items` | Update cart item quantity | User |
| `DELETE` | `/api/v1/cart/items` | Remove cart item | User |
| `DELETE` | `/api/v1/cart` | Clear cart | User |

### Wishlist
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/wishlist` | Get wishlist | User |
| `POST` | `/api/v1/wishlist/items` | Add item to wishlist | User |
| `DELETE` | `/api/v1/wishlist/items/:productId` | Remove wishlist item | User |
| `POST` | `/api/v1/wishlist/items/move-to-cart` | Move wishlist item to cart | User |

### Orders
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/orders` | Create order from cart | User |
| `GET` | `/api/v1/orders` | List user orders | User |
| `GET` | `/api/v1/orders/:orderId` | Get order details | User |
| `POST` | `/api/v1/orders/:orderId/cancel` | Cancel order | User |
| `POST` | `/api/v1/orders/:orderId/payment` | Create order payment record | User |
| `PATCH` | `/api/v1/orders/:orderId/payment` | Update order payment status | User |
| `PATCH` | `/api/v1/orders/:orderId/status` | Update order status | Authenticated (role rules in service) |
| `GET` | `/api/v1/orders/admin/all` | Get all orders | Admin |

### Payments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/payments/webhook` | Razorpay webhook receiver | None |
| `POST` | `/api/v1/payments/initiate` | Initiate payment flow | User |
| `POST` | `/api/v1/payments/confirm` | Confirm/verify payment | User |
| `PATCH` | `/api/v1/payments/:id` | Update payment status | Admin |
| `POST` | `/api/v1/payments/mock-success` | Dev/demo mock payment success | User |
| `GET` | `/api/v1/payments/orders/:orderId` | Get payment by order | User |

### AI Chat
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/chat` | Send message to assistant | User |
| `GET` | `/api/v1/chat/history` | Get user chat history | User |
| `DELETE` | `/api/v1/chat/history` | Clear user chat history | User |

Notes:
- `POST /api/v1/chat` validates `content` (`trim`, required, max 2000 chars).
- Without `GEMINI_API_KEY`, chat responds in mock mode.

### Health
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/health` | Health check | None |

## User Flows

### 1) Authentication
- Email/password: `POST /api/v1/auth/login`
- Google OAuth: `GET /api/v1/auth/google` -> callback -> tokens

### 2) Shopping
1. Browse catalog: `GET /api/v1/products`
2. Save items: `POST /api/v1/wishlist/items`
3. Add to cart: `POST /api/v1/cart/items`
4. Checkout: `POST /api/v1/orders`

### 3) Orders
1. Track orders: `GET /api/v1/orders`
2. View one order: `GET /api/v1/orders/:orderId`
3. Cancel (if eligible): `POST /api/v1/orders/:orderId/cancel`

### 4) AI Assistance
1. Ask: `POST /api/v1/chat`
2. Assistant can call tools (`searchProducts`, `getOrderStatus`, `escalateToHuman`)
3. Reply includes grounded tool data when tools are used

## Environment Variables

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
GEMINI_MODEL="gemini-1.5-flash"

# Server
PORT=3000
```