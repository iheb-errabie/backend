// model/productModel.js
const mongoose = require('mongoose');
const advertisementSchema = require('../schema/AdvertisementSchema');

const Advertisement = mongoose.model('Advertisement', advertisementSchema);
module.exports = Advertisement;
