// controller/userController.js

const mongoose = require('mongoose');
const User    = require("../model/userModel");
const Order   = require("../model/orderModel");     // ← now this will resolve
const Product = require("../model/productModel");
const nodemailer = require('nodemailer');


// Find user by email
exports.findByEmail = async (email) => {
  try {
    const user = await User.findOne({ email }).select('+password');
    return user;
  } catch (err) {
    throw new Error("Error finding user by email");
  }
};


// get user by id 
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user", error: err.message });
  }
};

// delete user 
exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user", error: err.message });
  }
};

// update user  
exports.updateUser = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Error updating user", error: err.message });
  }
};

// get vendors (where role is vendor)
exports.getVendors = async (req, res) => {
  try {
    const vendors = await User.find({ role: 'vendor' }).select('-password');
    res.status(200).json(vendors);
  } catch (err) {
    res.status(500).json({ message: "Error fetching vendors", error: err.message });
  }
};

// get clients (where role is client)
exports.getClients = async (req, res) => {
  try {
    const clients = await User.find({ role: 'client' }).select('-password');
    res.status(200).json(clients);
  } catch (err) {
    res.status(500).json({ message: "Error fetching clients", error: err.message });
  }
};

// **NEW**: Count distinct buyers per product category.
exports.buyersPerCategory = async (req, res) => {
  try {
    // 1) Authorization: only vendors or admins
    if (!req.user || !['vendor', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // 2) Aggregation pipeline
    const stats = await Order.aggregate([
      { $unwind: "$items" },                                  // explode order items
      {
        $lookup: {
          from: "products",                                   // join with products collection
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: "$productInfo" },                            // flatten joined array
      {
        $group: {
          _id: { category: "$productInfo.category", buyer: "$user" }
        }
      },
      {
        $group: {
          _id: "$_id.category",
          buyerCount: { $sum: 1 }                             // count distinct buyers per category
        }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          buyerCount: 1
        }
      }
    ]);

    // 3) Return the stats
    res.status(200).json(stats);
  } catch (err) {
    console.error("buyersPerCategory error:", err);
    res.status(500).json({ message: "Failed to compute stats", error: err.message });
  }
};

// Add to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const cartItem = user.cart.find(item => item.product.toString() === productId);
    if (cartItem) {
      cartItem.quantity += quantity;
    } else {
      user.cart.push({ product: productId, quantity });
    }

    await user.save();
    res.status(200).json({ message: 'Item added to cart', cart: user.cart });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add to cart', details: err.message });
  }
};

// Remove from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.cart = user.cart.filter(item => item.product.toString() !== productId);
    await user.save();

    res.status(200).json({ message: 'Item removed from cart', cart: user.cart });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove from cart', details: err.message });
  }
};

// View cart
exports.viewCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('cart.product');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ cart: user.cart });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cart', details: err.message });
  }
};


exports.confirmOrder = async (req, res) => {
  try {
    // 1. Get user with populated cart WITHOUT modifying it first
    const user = await User.findById(req.user.userId)
      .populate({
        path: 'cart.product',
        model: 'Product',
        select: 'price'
      });
     
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // 2. Check for empty cart
    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({
        error: 'Failed to confirm order',
        details: 'Cart is empty'
      });
    }

    // 3. Validate cart items
    const invalidItems = user.cart.filter(item => !item.product?._id);
    if (invalidItems.length > 0) {
      return res.status(400).json({
        error: 'Failed to confirm order',
        details: 'Cart contains invalid products'
      });
    }

    // 4. Create order from current cart items
    const orderItems = user.cart.map(item => ({
      product: item.product._id,
      quantity: item.quantity || 1
    }));
    const total = user.cart.reduce((sum, item) => {
      return sum + (item.product.price * (item.quantity || 1));
    }, 0);
    

    // 5. Create and save the order first
    const order = new Order({
      user: user._id,
      items: orderItems,
      total: total,
      status: 'pending'
    });
    await order.save();

    // 6. Clear the cart AFTER successful order creation
    await User.findByIdAndUpdate(
      user._id,
      { $set: { cart: [] } }
    );

    // 7. Return populated order
    const populatedOrder = await Order.findById(order._id)
      .populate('items.product', 'name price');


    res.status(201).json({
      message: 'Order confirmed successfully',
      order: populatedOrder
    });

  } catch (err) {
    console.error('Order Error:', err);
    res.status(500).json({
      error: 'Failed to confirm order',
      details: err.message
    });
  }
};


// Service-style function for the registration route
exports.createUser = async ({ username, email, password, role }) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const err = new Error("User already exists!");
    err.statusCode = 400;
    throw err;
  }
  // Create and save the new user
  const user = new User({ username, email, password, role });
  await user.save();
  return user;
};
// Add to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    user.wishlist.push(productId);
    await user.save();

    res.status(200).json({ message: "Added to wishlist", wishlist: user.wishlist });
  } catch (err) {
    console.error("Error in addToWishlist:", err);
    res.status(500).json({ message: "Failed to add to wishlist", error: err.message });
  }
};

// Remove from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.wishlist = user.wishlist.filter(
      (id) => id.toString() !== productId.toString()
    );
    await user.save();

    res.status(200).json({ message: "Removed from wishlist", wishlist: user.wishlist });
  } catch (err) {
    console.error("Error in removeFromWishlist:", err);
    res.status(500).json({ message: "Failed to remove from wishlist", error: err.message });
  }
};

// Get wishlist
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate("wishlist");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user.wishlist);
  } catch (err) {
    console.error("Error in getWishlist:", err);
    res.status(500).json({ message: "Failed to get wishlist", error: err.message });
  }
};


// stats for vendor dashboard
exports.getVendorStats = async (req, res) => {
  try {
    // Only vendors or admins
    if (!req.user || !["vendor", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const vendorId = req.user.userId;

    // Get products owned by vendor
    const products = await Product.find({ vendor: vendorId });
    const productIds = products.map(p => p._id);

    // Count total products
    const totalProducts = products.length;

    // All orders containing vendor's products
    const orders = await Order.find({ "items.product": { $in: productIds } });

    // Total sales = sum of (all sold quantities * price)
    let totalSales = 0;
    let allRatings = [];
    orders.forEach(order => {
      order.items.forEach(item => {
        if (productIds.some(id => id.equals(item.product))) {
          totalSales += (item.quantity * (item.product.price || 0));
        }
      });
    });

    // Average rating (if you have a reviews array on Product)
    let totalRating = 0, totalReviews = 0;
    for (const prod of products) {
      if (prod.reviews && prod.reviews.length > 0) {
        totalRating += prod.reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
        totalReviews += prod.reviews.length;
      }
    }
    const avgRating = totalReviews ? (totalRating / totalReviews) : null;

    // Buyers per category
    const buyersPerCategory = await Order.aggregate([
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: "$productInfo" },
      { $match: { "productInfo.vendor": vendorId } },
      {
        $group: {
          _id: { category: "$productInfo.category", buyer: "$user" }
        }
      },
      {
        $group: {
          _id: "$_id.category",
          buyers: { $addToSet: "$_id.buyer" },
        }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          buyers: 1,
          buyerCount: { $size: "$buyers" }
        }
      }
    ]);

    // Products per category
    const productsPerCategory = await Product.aggregate([
      { $match: { vendor: vendorId } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          count: 1
        }
      }
    ]);

    res.json({
      totalProducts,
      totalSales,
      avgRating,
      buyersPerCategory,
      productsPerCategory
    });
  } catch (err) {
    console.error("getVendorStats error:", err);
    res.status(500).json({ message: "Failed to load vendor stats", error: err.message });
  }
};

exports.getOrdersForUser = async (req, res) => {
  const orders = await Order.find({ user: req.user.userId })
    .populate('items.product', 'name price') // Add this line
    .sort({ createdAt: -1 });
  res.json(orders);
}
// Get current user's profile
// Correct getMe function
// CORRECTED getMe controller
exports.getMe = async (req, res) => {
  try {
    // Get user ID from verified token
    const user = await User.findById(req.user.userId).select('email');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Return ONLY the email explicitly
    res.status(200).json({ email: user.email });
    
  } catch (err) {
    console.error("getMe error:", err); // Add logging
    res.status(500).json({ 
      message: "Failed to fetch profile", 
      error: err.message 
    });
  }
};
// Correct updateMe function
exports.updateMe = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findById(req.user.userId); // Use req.user.userId
    if (!user) return res.status(404).json({ message: "User not found" });

    if (email) user.email = email;
    if (password) user.password = password;

    await user.save();
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user", error: err.message });
  }
}

exports.forgotPasswordController = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  // Lookup user
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Simulated reset link (generate real token logic as needed)
    const resetLink = `http://localhost:5173/reset_password?email=${encodeURIComponent(email)}`;


    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: 'errabieiheb@gafsa.r-iset.tn',
        pass: 'f6JFxBQK*m',
      },
    });
    await transporter.sendMail({
      from: 'Support <errabieiheb@gafsa.r-iset.tn>',
      to: email,
      subject: 'Password Reset',
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
    });



    res.status(200).json({ message: 'Reset link sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and new password are required" });
    }

    // Find user by email (no token check)
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update password
    user.password = newPassword;

    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error('resetPassword error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
