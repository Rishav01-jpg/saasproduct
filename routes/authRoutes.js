const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Subscription = require("../models/Subscription");

const router = express.Router();

/**
 * SIGNUP (only allowed if email already has a subscription)
 */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // Check if this email has an active subscription
    const sub = await Subscription.findOne({ email, active: true });

    if (!sub) {
      return res.status(403).json({
        msg: "No active plan found. Please pay first."
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
  // 🔥 Auto-generate tenantId (one tenant = one CRM)
const tenantId = "tenant_" + Date.now();

const user = new User({
  name,
  email,
  password: hashedPassword,
  role: "admin",
  subscriptionId: sub._id,
  tenantId: tenantId
 // 👈 VERY IMPORTANT
});

    await user.save();

    res.json({ msg: "Signup successful. Please login." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * LOGIN
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }
// ❌ Blocked user cannot login
if (user.isBlocked) {
  return res.status(403).json({
    msg: "Your account is blocked. Please contact support."
  });
}

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid password" });
    }

   // 🔥 Only ADMIN needs subscription check
if (user.role === "admin") {
  const sub = await Subscription.findById(user.subscriptionId);

  if (!sub || !sub.active) {
    return res.status(403).json({
      msg: "Your plan is inactive or expired."
    });
  }

  const today = new Date();
  if (today >= sub.endDate) {
    sub.active = false;
    await sub.save();

    return res.status(403).json({
      msg: "Your plan expired. Please renew."
    });
  }
}


  const token = jwt.sign(
  {
    id: user._id,
    role: user.role,
    email: user.email,
    tenantId: user.tenantId // 🔥 ADD THIS
  },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);



  res.json({
  token,
  role: user.role,
  tenantId: user.tenantId // 👈 SEND TO FRONTEND
});

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * GOOGLE LOGIN
 */
router.post("/google-login", async (req, res) => {
  try {
    const { credential } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Step 1: Check subscription exists
    const sub = await Subscription.findOne({ email, active: true });
    if (!sub) {
      return res.status(403).json({
        msg: "No active plan found. Please purchase a plan first."
      });
    }

    // Step 2: Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      const tenantId = "tenant_" + Date.now();

      user = new User({
        name,
        email,
        password: "google_oauth_user",
        role: "admin",
        subscriptionId: sub._id,
        tenantId,
        avatar: picture
      });

      await user.save();
    }

    // Step 3: Blocked user check
    if (user.isBlocked) {
      return res.status(403).json({
        msg: "Your account is blocked. Contact support."
      });
    }

    // Step 4: Subscription expiry check
    const subscription = await Subscription.findById(user.subscriptionId);

    if (!subscription || !subscription.active) {
      return res.status(403).json({ msg: "Your plan is inactive." });
    }

    if (new Date() >= subscription.endDate) {
      subscription.active = false;
      await subscription.save();
      return res.status(403).json({ msg: "Your plan expired. Please renew." });
    }

    // Step 5: Create JWT (same as normal login)
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
        tenantId: user.tenantId
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      role: user.role,
      tenantId: user.tenantId
    });

  } catch (err) {
    console.error(err);
    res.status(401).json({ msg: "Google login failed" });
  }
});

module.exports = router;
