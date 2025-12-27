🛒 ShopZen Backend

A production-style backend for an e-commerce application, built with Node.js, Express, PostgreSQL, and Prisma.
This project demonstrates real-world backend architecture, including authentication, authorization, database modeling, and clean separation of concerns.

🚀 Features
🔐 Authentication & Authorization

User registration and login

Password hashing using bcrypt

JWT-based authentication

Protected routes using middleware

Role-based access control (USER / ADMIN)

🧱 Backend Architecture

Modular routing using express.Router

Middleware-based request handling

Separation of concerns:

Routes

Controllers

Services (business logic)

Database layer (Prisma)

🗄️ Database

PostgreSQL as the relational database

Schema managed via Prisma ORM

Migration-based schema evolution

UUID-based primary keys

🧠 Tech Stack

Node.js

Express.js

PostgreSQL

Prisma ORM

JWT (jsonwebtoken)

bcrypt

dotenv

⚙️ Setup Instructions (Local)

Clone repository

git clone https://github.com/<your-username>/shopzen-backend.git

Install dependencies

npm install

Create .env file

DATABASE_URL="postgresql://postgres:password@localhost:5432/postgres"
JWT_SECRET="your_jwt_secret"

Run Prisma migrations

npx prisma migrate dev

Start server

node src/server.js

🎯 Why This Project Matters

This backend was built to reflect real production patterns, not tutorial shortcuts:

No hardcoded data

No fake authentication

Proper database schema design

Middleware-driven security

Clean, scalable architecture

🧩 Future Enhancements

Product management APIs

Cart and order system

Pagination and filtering

AWS deployment (EC2 + RDS)

API documentation (Swagger)

👨‍💻 Author

Aditya Yadav
Frontend → Full-Stack Developer
Focused on building scalable, real-world web applications.
