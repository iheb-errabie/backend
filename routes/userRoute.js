// routes/userRoute.js
const express       = require("express");
const router        = express.Router();
const bcrypt        = require("bcryptjs");
const jwt           = require("jsonwebtoken");
const verifyToken   = require("../middleware/verifyToken");    // <<— protect routes
const userController = require("../controller/userController");

// --- Public routes -----------------------------------------

// Register User (Signup)
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const existingUser = await userController.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await userController.createUser({ username, email, password: hashedPassword, role });
    res.status(201).json({ message: "User registered successfully!", userId: newUser._id });
  } catch (error) {
    res.status(500).json({ message: "Error! Something went wrong.", error: error.message });
  }
});

// User Login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const existingUser = await userController.findByEmail(email);
    if (!existingUser) return res.status(401).json({ message: "Invalid credentials!" });

    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Invalid credentials!" });

    const token = jwt.sign(
      { userId: existingUser._id, email: existingUser.email, role: existingUser.role },
      process.env.JWT_SECRET || "secretkeyappearshere",
      { expiresIn: "1h" }
    );

    res.status(200).json({
      success: true,
      data: {
        userId: existingUser._id,
        email: existingUser.email,
        role: existingUser.role,
        token
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error! Something went wrong.", error: error.message });
  }
});

// --- Protected routes (require valid JWT) ----------------
router.use(verifyToken);

// Get all vendors
router.get("/vendors", userController.getVendors);

// Get all clients
router.get("/clients", userController.getClients);

// Get user profile by ID
router.get("/user/:id", userController.getUserById);

// Update user by ID
router.put("/user/:id", userController.updateUser);

// Delete user by ID
router.delete("/user/:id", userController.deleteUser);

// NEW: Get buyers-per-category stats
router.get(
  "/stats/buyers-per-category",
  userController.buyersPerCategory
);

// Add routes for managing the shopping cart
router.post('/cart', verifyToken, userController.addToCart);
router.delete('/cart/:productId', verifyToken, userController.removeFromCart);
router.get('/cart', verifyToken, userController.viewCart);

// Add route for confirming orders
router.post('/orders', verifyToken, userController.confirmOrder);

module.exports = router;
