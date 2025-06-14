// routes/userRoute.js
const express       = require("express");
const router        = express.Router();
const bcrypt        = require("bcryptjs");
const jwt           = require("jsonwebtoken");
const verifyToken   = require("../middleware/verifyToken");    // <<— protect routes
const userController = require("../controller/userController");
const auth = require("../middleware/auth"); // Should check for admin role

// --- Public routes -----------------------------------------

// Register User (Signup)
// routes/userRoute.js
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const existingUser = await userController.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists!" });
    }
    // DO NOT hash here!
    const newUser = await userController.createUser({ username, email, password, role });
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
    console.log("existingUser:", existingUser); // <-- See what is returned
    if (!existingUser) return res.status(401).json({ message: "Invalid credentials!" });

    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    console.log("isPasswordValid:", isPasswordValid); // <-- See what is returned
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

// forget password
router.post('/forgot-password', userController.forgotPasswordController);
router.post('/reset-password', userController.resetPassword);


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

// ADD to wishlist
router.post('/wishlist/add', auth, userController.addToWishlist);

// REMOVE from wishlist
router.post('/wishlist/remove', auth, userController.removeFromWishlist);

// GET wishlist
router.get('/wishlist', auth, userController.getWishlist);

// routes/userRoute.js
router.get('/orders', verifyToken, userController.getOrdersForUser);
router.post('/orders/confirm', verifyToken, userController.confirmOrder);

router.get('/stats/vendor', userController.getVendorStats);

// User self-service profile
router.get("/users/me", verifyToken, userController.getMe);
router.put("/users/me", verifyToken, userController.updateMe);


// get user by id
router.get("/users/:id", verifyToken, userController.getUserById);


module.exports = router;
