// In middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../model/userModel");

module.exports = async function (req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret_here");
    // Use decoded.userId or decoded.id, depending on your token payload
    req.user = await User.findById(decoded.userId || decoded.id);
    if (!req.user) return res.status(401).json({ message: "User not found" });

    // Optionally, enforce admin check here
    // if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });

    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid", error: err.message });
  }
};