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
      amount: plan.price * 100, // INR → paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // 🟢 NEW: create pending subscription BEFORE payment
    await Subscription.create({
      email,
      planId: plan._id,
      active: false, // not active yet
      razorpayOrderId: order.id, // very important
    });

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
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ msg: "Payment verification failed" });
    }

    // 🟢 Find existing pending subscription
    const subscription = await Subscription.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!subscription) {
      return res.status(404).json({ msg: "Subscription not found" });
    }

    // 🟢 Activate subscription
    subscription.active = true;
    subscription.startDate = new Date();
    subscription.endDate = new Date();
    subscription.endDate.setFullYear(
      subscription.endDate.getFullYear() + 1
    );

    await subscription.save();

    res.json({
      msg: "Payment successful & subscription activated",
      redirect: `/signup?email=${email}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 🔔 STEP 3 — Razorpay Webhook (backup verification)
router.post("/webhook", async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify webhook signature
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest === req.headers["x-razorpay-signature"]) {
      if (req.body.event === "payment.captured") {
        const payment = req.body.payload.payment.entity;
        const orderId = payment.order_id;

        // Find pending subscription
        const subscription = await Subscription.findOne({
          razorpayOrderId: orderId,
        });

        if (subscription && !subscription.active) {
          subscription.active = true;
          subscription.startDate = new Date();
          subscription.endDate = new Date();
          subscription.endDate.setFullYear(
            subscription.endDate.getFullYear() + 1
          );

          await subscription.save();
          console.log("Subscription activated via webhook");
        }
      }
    }

    res.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
router.get("/check-subscription/:email", async (req, res) => {
  try {
    const sub = await Subscription.findOne({
      email: req.params.email,
      active: true,
    });

    res.json({ hasActivePlan: !!sub });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 🔍 STEP 4 — Auto verify payment from Razorpay if redirect failed
router.get("/verify-by-email/:email", async (req, res) => {
  try {
    const sub = await Subscription.findOne({
      email: req.params.email,
    });

    if (!sub) {
      return res.json({ active: false });
    }

    // If already active → return
    if (sub.active) {
      return res.json({ active: true });
    }

    // Check Razorpay order payment status
    const order = await razorpay.orders.fetch(sub.razorpayOrderId);

    if (order.status === "paid") {
      sub.active = true;
      sub.startDate = new Date();
      sub.endDate = new Date();
      sub.endDate.setFullYear(sub.endDate.getFullYear() + 1);
      await sub.save();

      return res.json({ active: true });
    }

    return res.json({ active: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
