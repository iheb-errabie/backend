// In middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../model/userModel");

module.exports = async function (req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkeyappearshere");
    // Use decoded.userId or decoded.id, depending on your token payload
    req.user = {
        id: decoded.userId,          // <-- THIS LINE
        email: decoded.email,
        role: decoded.role
      };
      next();

  } catch (err) {
    res.status(401).json({ message: "Token is not valid", error: err.message });
  }
};