const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  items: [{
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product', 
      required: true 
    },
    quantity: { 
      type: Number, 
      required: true, 
      min: 1 
    }
  }],
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending' 
  },
  total: {
    type: Number,
    required: true,
    min: 0
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add virtual population for products
orderSchema.virtual('products', {
  ref: 'Product',
  localField: 'items.product',
  foreignField: '_id'
});

module.exports = mongoose.model('Order', orderSchema);