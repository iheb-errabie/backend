// controller/userController.js



const User    = require("../model/userModel");
const Order   = require("../model/orderModel");     // ← now this will resolve
const Product = require("../model/productModel");


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

// Confirm an order
exports.confirmOrder = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('cart.product');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.cart.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const orderItems = user.cart.map(item => ({
      product: item.product._id,
      quantity: item.quantity
    }));

    const order = new Order({
      user: req.user.userId,
      items: orderItems
    });

    await order.save();

    // Clear the cart after order confirmation
    user.cart = [];
    await user.save();

    res.status(201).json({ message: 'Order confirmed successfully', order });
  } catch (err) {
    res.status(500).json({ error: 'Failed to confirm order', details: err.message });
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
    console.log("addToWishlist called");
    const userId = req.user.id;
    const { productId } = req.body;
    console.log("userId:", userId, "productId:", productId);

    const product = await Product.findById(productId);
    console.log("Product found:", product);

    if (!product) {
      console.log("Product not found");
      return res.status(404).json({ message: "Product not found" });
    }

    const user = await User.findById(userId);
    console.log("User found:", user);

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    if (user.wishlist.includes(productId)) {
      console.log("Product already in wishlist");
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    user.wishlist.push(productId);
    await user.save();
    console.log("Product added to wishlist. Updated wishlist:", user.wishlist);

    res.status(200).json({ message: "Added to wishlist", wishlist: user.wishlist });
  } catch (err) {
    console.error("Error in addToWishlist:", err);
    res.status(500).json({ message: "Failed to add to wishlist", error: err.message });
  }
};

// Remove from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    console.log("removeFromWishlist called");
    const userId = req.user.id;
    const { productId } = req.body;
    console.log("userId:", userId, "productId:", productId);

    const user = await User.findById(userId);
    console.log("User found:", user);

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    user.wishlist = user.wishlist.filter(
      (id) => id.toString() !== productId.toString()
    );
    await user.save();
    console.log("Product removed from wishlist. Updated wishlist:", user.wishlist);

    res.status(200).json({ message: "Removed from wishlist", wishlist: user.wishlist });
  } catch (err) {
    console.error("Error in removeFromWishlist:", err);
    res.status(500).json({ message: "Failed to remove from wishlist", error: err.message });
  }
};

// Get wishlist
exports.getWishlist = async (req, res) => {
  try {
    console.log("getWishlist called");
    const userId = req.user.id;
    console.log("userId:", userId);

    const user = await User.findById(userId).populate("wishlist");
    console.log("User found:", user);

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Returning wishlist:", user.wishlist);
    res.status(200).json(user.wishlist);
  } catch (err) {
    console.error("Error in getWishlist:", err);
    res.status(500).json({ message: "Failed to get wishlist", error: err.message });
  }
};