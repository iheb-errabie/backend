# 🛒 E-Commerce Platform

Welcome to the E-Commerce Platform! This project is a fully-featured, modern web application built with the **MERN stack** (MongoDB, Express, React, Node.js).  
It supports multiple user roles (Admin, Vendor, Buyer), dynamic product management, shopping cart, wishlist, order processing, and a beautiful dashboard for each user type.

---

## 📂 Project Structure

```
root/
  frontend/    # React app (user interface)
  backend/     # Express API server
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/iheb-errabie/backend.git
git clone https://github.com/iheb-errabie/frontend.git
cd backend
cd frontend
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create a .env file with your MongoDB URI and secret:
cp .env.example .env
# Edit .env with your own values

# Start the backend server (default: http://localhost:3000)
npm run dev
```

#### **Key Backend Features:**
- User Authentication (JWT)
- Multi-role (Admin, Vendor, Buyer)
- Product Management (CRUD)
- Cart, Wishlist, and Order APIs
- Admin analytics endpoints
- Advertisement management

---

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create a .env file with the backend API URL:
cp .env.example .env
# Edit .env to match your backend

# Start the frontend dev server (default: http://localhost:5173)
npm run dev
```

#### **Key Frontend Features:**
- Beautiful, responsive UI (Bootstrap 5)
- Role-based dashboards and navigation
- Product browsing, search, filter
- Cart and Wishlist management
- Order confirmation and history
- Admin management panels

---

## 👤 User Roles and Features

- **Buyer:**  
  Browse products, add to cart/wishlist, checkout, view orders, dashboard stats

- **Vendor:**  
  Add/manage products, manage advertisements, vendor dashboard

- **Admin:**  
  Manage users (clients & vendors), view key stats, admin dashboard

---

## 📊 Dashboards

Each user type has a unique dashboard with tailored statistics and actions:
- **Admin:** Total users, vendors, products, orders, recent users
- **Vendor:** Product stats, ad management, sales data *(extend as needed)*
- **Buyer:** Order stats, wishlist/cart counts, recent orders

---

## 🛡️ Security

- Passwords hashed with bcrypt
- JWT authentication for API routes
- Role-based route protection

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

```
MONGO_URI=mongodb+srv://youruser:yourpass@cluster.mongodb.net/yourdb
JWT_SECRET=your_jwt_secret
```

### Frontend (`frontend/.env`)

```
VITE_API_URL=http://localhost:3000/api
```

---

## 🧑‍💻 Tech Stack

- **Frontend:** React, React Router, Bootstrap 5
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB Atlas (or local)
- **Auth:** JWT
- **Icons:** Bootstrap Icons

---

## 🏗️ Extending the App

- Add product reviews and ratings
- Email notifications for orders
- Sales analytics and vendor stats
- Payment gateway integration

---

## 🤝 Contribution

1. Fork this repo
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes
4. Push to the branch (`git push origin feature/YourFeature`)
5. Create a Pull Request

---

## ℹ️ License

This project is open-source and licensed under the [MIT License](LICENSE).

---

## 🙏 Credits

- [Bootstrap](https://getbootstrap.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [React](https://react.dev/)
- [Express](https://expressjs.com/)

---

**Enjoy your shopping platform! 🛍️**
