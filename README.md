# 🛒 ShopZen Backend

A **production-style backend** for an e-commerce application, built with **Node.js, Express, PostgreSQL, and Prisma**.  
This project demonstrates real-world backend architecture, including authentication, authorization, database modeling, and clean separation of concerns.

---

## 🚀 Features

### 🔐 Authentication & Authorization

- User registration and login
- Password hashing using **bcrypt**
- JWT-based authentication
- Protected routes using middleware
- Role-based access control (**USER / ADMIN**)

---

## 🧱 Backend Architecture

- Modular routing using `express.Router`
- Middleware-based request handling
- Clear separation of concerns:
  - Routes
  - Controllers
  - Services (business logic)
  - Database layer (Prisma)

---

## 🗂️ Project Structure

```text
shopzen-backend/
├── src/
│   ├── routes/         # API route definitions
│   ├── controllers/    # Request/response handling
│   ├── services/       # Business logic
│   ├── middlewares/    # Auth, role checks, error handling
│   ├── prisma/         # Prisma schema & migrations
│   └── server.js       # App entry point
├── .env.example
├── package.json
└── README.md
```

---

## ⚙️ Setup (Local Development)

### 1️⃣ Clone the repository

```bash
git clone https://github.com/aditya0xd/shopzen-backend
cd shopzen-backend
```

### 2️⃣ Install dependencies

```bash
npm install
```

#### Create a .env file in the project root:

```
DATABASE_URL="your_database_url"
JWT_SECRET="your_jwt_secret"
```

Ensure PostgreSQL is install and running locally.

### 4️⃣ Run database migrations (if applicable)

```
npx prisma migrate dev
```

### 5️⃣ Start the application

```
node src/server.js
```

## 📡 API Endpoints (Overview)

### Auth

```
| Method | Endpoint       | Description         |
| -----: | -------------- | ------------------- |
|   POST | /auth/register | Register a new user |
|   POST | /auth/login    | Authenticate user   |
```

### Users

```
| Method | Endpoint  | Access | Description        |
| -----: | --------- | ------ | ------------------ |
|    GET | /users/me | USER   | Get logged-in user |
```

### Admin

```
| Method | Endpoint     | Access | Description     |
| -----: | ------------ | ------ | --------------- |
|    GET | /admin/users | ADMIN  | Fetch all users |
```

## 🔐 Environment Variables

```
| Variable     | Description                  |
| ------------ | ---------------------------- |
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET   | Secret key for JWT signing   |
```

## 🔄 Authentication Flow

1. User registers with email and password
2. Password is hashed using bcrypt
3. User logs in with credentials
4. Server issues a signed JWT
5. JWT is sent in Authorization header
6. Middleware validates token and role
7. Protected routes are accessed securely

## ⚠️ Error Handling

- Centralized error handling middleware
- Consistent HTTP status codes
- Validation errors handled at service layer
- Authentication and authorization errors handled via middleware

## 🧩 Data Model (High Level)

```text
- User
  - id (UUID)
  - email
  - password
  - role

- Product
  - id
  - title
  - description
  - category
  - brand
  - price
  - discountPercentage
  - rating
  - stock

Relationships are modeled explicitly using Prisma schema.

```

## 🔒 Security Considerations

- Passwords stored only as hashed values
- JWT secrets stored in environment variables
- Role-based access enforced at API level
- No sensitive data exposed in responses

## 🧪 Testing

- API testing using Postman

## 🧠 Design Decisions

- Used Prisma for type-safe DB access and migrations
- Chose JWT for stateless authentication
- Adopted layered architecture for scalability

## 🤝 Contributing

ShopZen Backend is open to contributions that improve
**code quality, scalability, and real-world backend practices**.

Contributions are welcome in the areas of:

- New API modules (orders, carts, payments)
- Performance and query optimizations
- Security improvements
- Testing and documentation

## 🛠️ Getting Started (Contributors)

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL (v14+)
- npm or pnpm
- Basic knowledge of Express & Prisma

## 🔄 Development Workflow

1. Fork the repository
2. Create a feature branch:
   ```
   git checkout -b feature/your-feature-name
   ```

## ➕ Adding a New Feature (Example)

To add a new resource (e.g. Orders):

1. Create a new Prisma model
2. Run a migration
3. Add routes under `routes/orders.routes.js`
4. Implement logic in `services/orders.service.js`
5. Handle requests in `controllers/orders.controller.js`
6. Protect routes using auth/role middleware
