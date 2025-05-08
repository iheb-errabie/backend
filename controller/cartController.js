const User = require("../model/userModel");
const Product = require("../model/productModel");

// Get user cart
exports.getCart = async (req, res) => {
  const user = await User.findById(req.user.id).populate("cart.product");
  res.json(user.cart);
};

// Add product to cart
exports.addToCart = async (req, res) => {
  const user = await User.findById(req.user.id);
  const { productId, quantity = 1 } = req.body;
  const cartItem = user.cart.find(item => item.product.equals(productId));
  if (cartItem) {
    cartItem.quantity += quantity;
  } else {
    user.cart.push({ product: productId, quantity });
  }
  await user.save();
  res.json(user.cart);
};

// Update quantity
exports.updateCartItem = async (req, res) => {
  const user = await User.findById(req.user.id);
  const { productId, quantity } = req.body;
  const cartItem = user.cart.find(item => item.product.equals(productId));
  if (cartItem) {
    cartItem.quantity = quantity;
    await user.save();
    return res.json(user.cart);
  }
  res.status(404).json({ message: "Product not in cart" });
};

// Remove item
exports.removeFromCart = async (req, res) => {
  const user = await User.findById(req.user.id);
  const { productId } = req.body;
  user.cart = user.cart.filter(item => !item.product.equals(productId));
  await user.save();
  res.json(user.cart);
};

// Confirm order (clear cart)
exports.confirmCart = async (req, res) => {
  const user = await User.findById(req.user.id);
  // Here, you would create an order document, send an email, etc.
  user.cart = [];
  await user.save();
  res.json({ message: "Order confirmed and cart cleared" });
};