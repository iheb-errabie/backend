const mongoose = require('mongoose');
const productSchema = require('../schema/productSchema');

// Ensure vendor is referenced and timestamps are set
productSchema.add({
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});
productSchema.set('timestamps', true);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;