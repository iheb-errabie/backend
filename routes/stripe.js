const express = require("express");
const router = express.Router();
require('dotenv').config(); // Add this line at the top if not already in your app entry!

const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Use env variable

router.post("/create-checkout-session", async (req, res) => {
  const { cart } = req.body;
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: cart.map(item => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.product.name,
            images: item.product.images && item.product.images.length > 0
              ? [item.product.images[0]]
              : [],
          },
          unit_amount: Math.round(item.product.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: "http://localhost:5173/success",
      cancel_url: "http://localhost:5173/cart",
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Stripe session creation failed" });
  }
});

module.exports = router;