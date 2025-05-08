const express = require("express");
const router = express.Router();
const cartController = require("../controller/cartController");
const auth = require("../middleware/auth");

router.get("/", auth, cartController.getCart);
router.post("/add", auth, cartController.addToCart);
router.post("/update", auth, cartController.updateCartItem);
router.post("/remove", auth, cartController.removeFromCart);
router.post("/confirm", auth, cartController.confirmCart);

module.exports = router;