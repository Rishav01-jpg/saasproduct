const express = require("express");
const User = require("../models/User");
const Subscription = require("../models/Subscription");
const auth = require("../middleware/auth");
const allowedRoles = require("../middleware/roleCheck");
const createAuditLog = require("../utils/createAuditLog");
const AuditLog = require("../models/AuditLog");

const router = express.Router();
// SUPER ADMIN → view all users
router.get(
  "/users",
  auth,
  allowedRoles("superadmin"),
  async (req, res) => {
    try {
      const users = await User.find().select("-password");
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);
// SUPER ADMIN → view all subscriptions
router.get(
  "/subscriptions",
  auth,
  allowedRoles("superadmin"),
  async (req, res) => {
    try {
      const subscriptions = await Subscription.find();
      res.json(subscriptions);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);
// SUPER ADMIN → activate / deactivate subscription
router.put(
  "/subscription/:id/toggle",
  auth,
  allowedRoles("superadmin"),
  async (req, res) => {
    try {
      const sub = await Subscription.findById(req.params.id);

      if (!sub) {
        return res.status(404).json({ msg: "Subscription not found" });
      }

      // toggle active status
      sub.active = !sub.active;
      await sub.save();
await createAuditLog({
  actor: req.user,
  action: sub.active ? "ACTIVATE_SUBSCRIPTION" : "DEACTIVATE_SUBSCRIPTION",
  targetType: "subscription",
  targetId: sub._id,
  message: `Super admin ${sub.active ? "activated" : "deactivated"} subscription for ${sub.email}`
});

      res.json({
        msg: `Subscription ${sub.active ? "activated" : "deactivated"}`,
        active: sub.active
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);
// SUPER ADMIN → extend subscription expiry
router.put(
  "/subscription/:id/extend",
  auth,
  allowedRoles("superadmin"),
  async (req, res) => {
    try {
      const { extraDays } = req.body;

      if (!extraDays || extraDays <= 0) {
        return res.status(400).json({
          msg: "extraDays must be greater than 0"
        });
      }

      const sub = await Subscription.findById(req.params.id);

      if (!sub) {
        return res.status(404).json({
          msg: "Subscription not found"
        });
      }

      // extend expiry date
      const currentEnd = new Date(sub.endDate);
      currentEnd.setDate(currentEnd.getDate() + extraDays);

      sub.endDate = currentEnd;
      await sub.save();
await createAuditLog({
  actor: req.user,
  action: "EXTEND_SUBSCRIPTION",
  targetType: "subscription",
  targetId: sub._id,
  message: `Super admin extended subscription for ${sub.email} by ${extraDays} days`
});



      res.json({
        msg: "Subscription expiry extended",
        newEndDate: sub.endDate
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);
// SUPER ADMIN → block / unblock admin
router.put(
  "/user/:id/block",
  auth,
  allowedRoles("superadmin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      // only admin accounts should be blocked here
      if (user.role !== "admin") {
        return res.status(400).json({
          msg: "Only admin accounts can be blocked"
        });
      }

      user.isBlocked = !user.isBlocked;
      await user.save();
await createAuditLog({
  actor: req.user,
  action: user.isBlocked ? "BLOCK_ADMIN" : "UNBLOCK_ADMIN",
  targetType: "user",
  targetId: user._id,
  message: `Super admin ${user.isBlocked ? "blocked" : "unblocked"} admin ${user.email}`
});

      res.json({
        msg: `Admin account ${user.isBlocked ? "blocked" : "unblocked"}`,
        isBlocked: user.isBlocked
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);
// SUPER ADMIN → view all audit logs
router.get(
  "/audit-logs",
  auth,
  allowedRoles("superadmin"),
  async (req, res) => {
    try {
      const logs = await AuditLog.find()
        .sort({ createdAt: -1 }) // latest first
        .limit(100); // safety limit

      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
