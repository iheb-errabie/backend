// model/advertisementModel.js
const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,           // Which product is being advertised
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,           // Which vendor owns this ad
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,           // A short tagline for the ad
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,           // Optional longer copy
  },
  startDate: {
    type: Date,
    required: true,           // When the ad goes live
  },
  endDate: {
    type: Date,
    required: true,           // When the ad should stop
  },
  budget: {
    type: Number,
    required: true,           // Total amount budgeted (e.g. in your currency)
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'paused', 'completed', 'cancelled'],
    default: 'pending',
  },
  stats: {
    impressions: { type: Number, default: 0 },
    clicks:      { type: Number, default: 0 },
  }
}, {
  timestamps: true           // Adds createdAt & updatedAt
});

// Pre-save hook to automatically use the product's image for the advertisement
advertisementSchema.pre('save', async function (next) {
  try {
    if (this.isNew || this.isModified('product')) {
      const product = await mongoose.model('Product').findById(this.product);
      if (product) {
        this.image = product.image;  // Use the product's image
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = advertisementSchema;
