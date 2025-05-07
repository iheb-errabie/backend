// controller/productController.js
const Product = require('../model/productModel');
const fs = require('fs');
const path = require('path');

// GET all products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    return res.status(200).json(products);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch products', details: err.message });
  }
};

// GET a single product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(200).json(product);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch product', details: err.message });
  }
};

// CREATE a new product
exports.createProduct = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Only vendors can create products' });
    }

    const data = {
      ...req.body,
      owner: req.user.userId || req.user._id,  // depending on your JWT payload
    };

    console.log(data, " Product data ");

    if (req.files && req.files['images']) {
      data.images = req.files['images'].map(file => file.path);
    }

    if (req.files && req.files['video']) {
      data.video = req.files['video'][0].path;
    }

    const product = new Product(data);
    await product.save();
    return res.status(201).json(product);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create product', details: err.message });
  }
};

// UPDATE an existing product by ID
exports.updateProduct = async (req, res) => {
  try {
    const updates = { ...req.body };

    // Handle new images
    if (req.files?.images) {
      updates.images = req.files.images.map(file => file.path);
      // delete old images
      const old = await Product.findById(req.params.id);
      if (old?.images) {
        old.images.forEach(p => fs.existsSync(p) && fs.unlinkSync(p));
      }
    } 

    // Handle new video
    if (req.files?.video) {
      updates.video = req.files.video[0].path;
      // delete old video
      const old = await Product.findById(req.params.id);
      if (old?.video && fs.existsSync(old.video)) {
        fs.unlinkSync(old.video);
      }
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(200).json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update product', details: err.message });
  }
};

// DELETE a product by ID
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // delete images
    if (product.images) {
      product.images.forEach(p => fs.existsSync(p) && fs.unlinkSync(p));
    }
    // delete video
    if (product.video && fs.existsSync(product.video)) {
      fs.unlinkSync(product.video);
    }

    await Product.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete product', details: err.message });
  }
};
// GET all products for a specific vendor
exports.getProductsByVendor = async (req, res) => {
  try {
    const vendorId = req.params.vendorId;
    // Optional: only allow a vendor to fetch their own products, or admin to fetch any
    if (req.user.role === 'vendor' && req.user.userId !== vendorId) {
      return res.status(403).json({ message: 'Vendors can only fetch their own products' });
    }

    const products = await Product.find({ owner: vendorId });
    return res.status(200).json(products);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch vendor products', details: err.message });
  }
};


// GET products by category filter function
exports.getProductsByCategory = async (req, res) => {
  try {
    const category = req.params.category;
    const products = await Product.find({ category: { $eq: category } });
    console.log(category , " Products ",products);
    return res.status(200).json(products);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch products by categoryaa', details: err.message });
  }
};

// Add a review to a product
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const review = {
      user: req.user.userId,
      rating,
      comment
    };

    product.reviews.push(review);

    // Recalculate average rating
    product.averageRating =
      product.reviews.reduce((sum, review) => sum + review.rating, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Review added successfully', product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add review', details: err.message });
  }
};
