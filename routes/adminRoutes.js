const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");
const auth = require("../middleware/auth"); // Should check for admin role

router.get("/vendors", auth, adminController.getVendors);
router.get("/clients", auth, adminController.getClients);
router.post("/vendors/:id/approve", auth, adminController.approveVendor);
router.delete("/users/:id", auth, adminController.deleteUser);
router.get("/test", (req, res) => res.json({ status: "OK" }));
router.get("/user-stats", auth, adminController.getUserStats);
router.get("/product-stats", auth, adminController.getProductStats);
router.get("/order-stats", auth, adminController.getOrderStats);
router.get("/recent-users", auth, adminController.getRecentUsers);

module.exports = router;