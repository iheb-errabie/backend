// model/productModel.js
const mongoose = require('mongoose');
const productSchema = require('../schema/productSchema'); // Make sure you're importing the schema here

const Product = mongoose.model('Product', productSchema); // Ensure you are passing the schema to mongoose.model()

module.exports = Product;
