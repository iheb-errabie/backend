// controller/productController.js
const Product = require('../model/productModel');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

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
      vendor: req.user.userId || req.user._id,
    };

    // Debug: Log files and body
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    if (req.files && req.files['images']) {
      data.images = req.files['images'].map(file => file.path);
    }

    if (req.files && req.files['video']) {
      data.video = req.files['video'][0].path;
    }

    console.log("DATA TO SAVE:", data);

    const product = new Product(data);
    await product.save();
    return res.status(201).json(product);
  } catch (err) {
    console.error("CREATE PRODUCT ERROR:", err); // <--- Add this line!
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

    const products = await Product.find({ vendor: vendorId });
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


exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const review = {
      user: req.user.userId,
      rating: Number(rating),
      comment
    };

    // Update product and calculate average atomically
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        $push: { reviews: review },
        $inc: { totalRatings: review.rating, reviewCount: 1 }
      },
      { new: true, runValidators: true }
    );

    // Calculate average rating as number
    const averageRating = 
      updatedProduct.totalRatings / updatedProduct.reviewCount;
    const roundedAverage = Math.round(averageRating * 10) / 10;

    await Product.findByIdAndUpdate(productId, {
      $set: { averageRating: roundedAverage }
    });

    res.status(201).json({
      message: 'Review added successfully',
      product: await Product.findById(productId)
    });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to add review',
      details: err.message
    });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { id: productId, reviewId } = req.params;
    const userId = req.user.userId;

    // Find product and review
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    const review = product.reviews.id(reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.user.toString() !== userId) return res.status(403).json({ message: 'Unauthorized' });

    // Calculate rating difference
    const ratingDiff = Number(rating) - review.rating;

    // Update specific fields instead of whole document
    const updateResult = await Product.findOneAndUpdate(
      { _id: productId, 'reviews._id': reviewId },
      { 
        $set: {
          'reviews.$.rating': Number(rating),
          'reviews.$.comment': comment
        },
        $inc: { totalRatings: ratingDiff }
      },
      { new: true, runValidators: true }
    );

    // Calculate new average
    const newTotal = updateResult.totalRatings;
    const reviewCount = updateResult.reviewCount;
    const averageRating = reviewCount > 0 ? newTotal / reviewCount : 0;
    const roundedAverage = Math.round(averageRating * 10) / 10;

    // Update average rating
    await Product.findByIdAndUpdate(productId, {
      $set: { averageRating: roundedAverage }
    });

    res.status(200).json({
      message: 'Review updated successfully',
      product: await Product.findById(productId)
    });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to update review',
      details: err.message
    });
  }
};

// GET product reviews by product ID
exports.getProductReviews = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    // Find product and populate reviews with user data
    const product = await Product.findById(id)
      .select('reviews')
      .populate('reviews.user', 'name email'); // Populate user details for each review

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Return reviews
    return res.status(200).json({
      reviews: product.reviews,
      totalReviews: product.reviews.length,
      averageRating: product.averageRating
    });
  } catch (err) {
    return res.status(500).json({ 
      error: 'Failed to fetch product reviews', 
      details: err.message 
    });
  }
};