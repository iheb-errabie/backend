// middleware/verifyToken.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access Denied, No Token Provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkeyappearshere");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(400).json({ message: "Invalid Token", error: error.message });
  }
};

module.exports = verifyToken;
