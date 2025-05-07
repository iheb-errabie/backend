// Importing required modules
const express = require("express");
const cors = require('cors');
const mongoose = require("mongoose");
const path = require('path');
require("dotenv").config();

const app = express();

// Importing routes
const userRoutes = require("./routes/userRoute.js");
const productRoutes = require("./routes/productRoutes.js");
const advertisementRoutes = require("./routes/advertisementRoutes.js");

// MongoDB URI
const uri = process.env.MONGO_URI || "mongodb+srv://iheberrabie1:iheb123@vendor-db.ucxn3.mongodb.net/?retryWrites=true&w=majority&appName=Vendor-db";

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Defining the routes (IMPORTANT: BEFORE connecting DB is fine)
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/advertisements", advertisementRoutes);

// MongoDB connection and app start
mongoose.connect(uri)
  .then(() => {
    console.log('Connected to MongoDB successfully');
    app.listen(3000, () => console.log("Server is running on port 3000"));
  })
  .catch(err => console.error("Connection Error:", err));

// No need for app.get('/') here!
