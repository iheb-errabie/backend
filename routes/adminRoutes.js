const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");
const auth = require("../middleware/auth"); // Should check for admin role

router.get("/vendors", auth, adminController.getVendors);
router.get("/clients", auth, adminController.getClients);
router.post("/vendors/:id/approve", auth, adminController.approveVendor);
router.delete("/users/:id", auth, adminController.deleteUser);
router.get("/test", auth, (req, res) => {
  res.status(200).json({ message: "Admin route is working" });
});

module.exports = router;