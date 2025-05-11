const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const stripe = Stripe("sk_test_51RNhNMFVlBpBipIFIMGiOILOy1BPd2yM4l5l2GUZh5PaMh1tPZoltehde8fgpG3McJRrYxfLU2Rglpf1IRicGR4l00SM4Z0h0z"); // Replace with your secret key

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
              : [], // Use the product's main image if available
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