const express = require("express");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Dashboard = require("../models/Dashboard");

const auth = require("../middleware/auth");
const checkSub = require("../middleware/checkSubscription");
const createAuditLog = require("../utils/createAuditLog");

const router = express.Router();

/**
 * ADMIN → CREATE STAFF / MANAGER
 */
router.post("/create", auth, checkSub, async (req, res) => {
  try {
    const { name, email, password, role, dashboardId } = req.body;

    // 1️⃣ Only ADMIN can create staff / manager
    if (req.user.role !== "admin") {
      return res.status(403).json({
        msg: "Only admin can create staff or manager"
      });
    }

    // 2️⃣ Role validation
    if (!["staff", "manager"].includes(role)) {
      return res.status(400).json({
        msg: "Role must be staff or manager"
      });
    }

    // 3️⃣ Dashboard must belong to same tenant
    const dashboard = await Dashboard.findOne({
      _id: dashboardId,
      tenantId: req.user.tenantId
    });

    if (!dashboard) {
      return res.status(403).json({
        msg: "Dashboard not found or not in your tenant"
      });
    }

    // 4️⃣ Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        msg: "User already exists"
      });
    }

    // 5️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6️⃣ Create staff / manager (inherit tenant)
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      dashboardId,
      tenantId: req.user.tenantId
    });

    await newUser.save();

    await createAuditLog({
      actor: req.user,
      action: role === "manager" ? "CREATE_MANAGER" : "CREATE_STAFF",
      targetType: "user",
      targetId: newUser._id,
      message: `Admin ${req.user.email} created ${role} ${newUser.email}`
    });

    res.json({
      msg: `${role} created successfully`,
      user: {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
// ADMIN → View all staff & managers in their tenant
router.get("/team", auth, checkSub, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Only admin can view team" });
    }

    const users = await User.find({
      tenantId: req.user.tenantId,
      role: { $in: ["manager", "staff"] }
    }).select("-password").populate("dashboardId", "name");

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ADMIN → Delete staff or manager
router.delete("/team/:id", auth, checkSub, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Only admin can delete team members" });
    }

    const user = await User.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (!["manager", "staff"].includes(user.role)) {
      return res.status(400).json({ msg: "Can only delete staff or manager" });
    }

    // ✅ CREATE AUDIT LOG BEFORE DELETE
    await createAuditLog({
      actor: req.user,
      action: user.role === "manager" ? "DELETE_MANAGER" : "DELETE_STAFF",
      targetType: "user",
      targetId: user._id,
      message: `Admin ${req.user.email} deleted ${user.role} ${user.email}`
    });

    await user.deleteOne();

    res.json({ msg: "User deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// USER → Save last opened dashboard
router.put("/last-dashboard", auth, async (req, res) => {
  try {
    const { dashboardId } = req.body;

    // Check dashboard belongs to same tenant
    const dashboard = await Dashboard.findOne({
      _id: dashboardId,
      tenantId: req.user.tenantId
    });

    if (!dashboard) {
      return res.status(404).json({ msg: "Dashboard not found" });
    }

    req.user.lastDashboard = dashboardId;
    await req.user.save();

    res.json({ msg: "Last dashboard updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// USER → Get logged-in user profile (with last opened dashboard)
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("lastDashboard", "name");

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;
