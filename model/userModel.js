const mongoose = require("mongoose");
const userSchema = require('../schema/userSchema.js');


module.exports = mongoose.model("User", userSchema);

