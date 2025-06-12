const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: { type: String, enum: ["client", "vendor", "admin"], default: "client" },
  approved: { type: Boolean, default: false },
  cart: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: { type: Number, default: 1 }
    }
  ],
  wishlist: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 8);
    next();
  });
  
module.exports = mongoose.model("User", userSchema);