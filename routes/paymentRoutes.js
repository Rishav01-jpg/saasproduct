const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const Plan = require("../models/Plan");
const Subscription = require("../models/Subscription");

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * STEP 1 — Create Razorpay order
 */
router.post("/create-order", async (req, res) => {
  try {
    const { email, planName } = req.body;

    const plan = await Plan.findOne({ name: planName });
    if (!plan) {
      return res.status(400).json({ msg: "Invalid plan selected" });
    }

    const options = {
      amount: plan.price * 1000, // INR → paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: plan.price,
      key: process.env.RAZORPAY_KEY_ID,
      email,
      planName,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * STEP 2 — Verify payment & create subscription
 */
router.post("/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      email,
      planName,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ msg: "Payment verification failed" });
    }

    // Payment verified → create subscription
    const plan = await Plan.findOne({ name: planName });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    const subscription = new Subscription({
      email,
      planId: plan._id,
      startDate,
      endDate,
      active: true,
    });

    await subscription.save();

    res.json({
      msg: "Payment successful & subscription created",
      redirect: `/signup?email=${email}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
