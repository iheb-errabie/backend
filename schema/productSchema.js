// schema/productSchema.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: { 
    type: String,
    required: false,
  },
  price: { 
    type: Number,
    required: true,
  },
  category: { 
    type: String,
    required: false,
  },
  images: { 
    type: [String], // renamed from `image` to `images` to match multiple files
  }, 
  video: {
    type: String,
  }, // ← missing comma was here
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { timestamps: true }); 



const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: false
  }
}, { timestamps: true });

productSchema.add({
  reviews: [reviewSchema],
  averageRating: {
    type: Number,
    default: 0
  }
});

module.exports = productSchema;  // Correctly exporting the schema
