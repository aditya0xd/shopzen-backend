# Order History Feature Guide

The "Order History" feature allows users to view their past orders. This functionality is **already implemented** in the backend.

## ✅ Existing Capabilities

- **Get All Orders**: Fetch a list of all orders placed by the logged-in user.
- **Filter by Status**: View only `PENDING`, `SHIPPED`, `DELIVERED`, etc., orders.
- **Pagination**: Efficiently load orders in chunks (e.g., 10 at a time).
- **Order Details**: Includes product information, shipping address, and payment status.

## 🚀 API Endpoint

**GET** `/api/v1/orders`

### Headers
| Key | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <your_access_token>` | Requires user authentication |

### Query Parameters (Optional)
| Param | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `status` | `string` | - | Filter by status (PENDING, PAID, SHIPPED, DELIVERED, CANCELLED) |
| `limit` | `number` | `10` | Number of orders to return |
| `offset` | `number` | `0` | Number of orders to skip (for pagination) |

## 🛠️ Usage Examples

### 1. Get Recent Orders (Default)
**Request:**
```http
GET /api/v1/orders
Authorization: Bearer <token>
```

**Response:**
```json
{
  "orders": [
    {
      "id": "order-uuid-1",
      "status": "DELIVERED",
      "totalAmount": 120.50,
      "createdAt": "2023-10-25T14:30:00.000Z",
      "items": [
        {
          "quantity": 1,
          "price": 120.50,
          "product": {
            "title": "Running Shoes",
            "thumbnail": "image_url.jpg"
          }
        }
      ]
    }
    // ... more orders
  ],
  "total": 5,
  "limit": 10,
  "offset": 0
}
```

### 2. Get Only Delivered Orders
**Request:**
```http
GET /api/v1/orders?status=DELIVERED
Authorization: Bearer <token>
```

### 3. Pagination (Page 2)
Assuming page size of 10:
**Request:**
```http
GET /api/v1/orders?limit=10&offset=10
Authorization: Bearer <token>
```

## 🔍 Implementation Details

- **Controller**: `src/modules/orders/order.controller.js` -> `getOrders`
- **Service**: `src/modules/orders/order.service.js` -> `getUserOrders`
- **Route**: `src/modules/orders/order.routes.js`

You can use these endpoints immediately to build your "Order History" page on the frontend.
