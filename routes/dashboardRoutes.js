const express = require("express");
const Dashboard = require("../models/Dashboard");
const Subscription = require("../models/Subscription");
const Plan = require("../models/Plan");

const auth = require("../middleware/auth");
const checkSub = require("../middleware/checkSubscription");
const allowedRoles = require("../middleware/roleCheck");
const createAuditLog = require("../utils/createAuditLog");

const router = express.Router();

/**
 * ================================
 * ADMIN → CREATE DASHBOARD
 * ================================
 * - Only admin
 * - Subscription must be active
 * - Plan dashboard limit enforced
 */
router.post(
  "/create",
  auth,
  checkSub,
  allowedRoles("admin"),
  async (req, res) => {
    try {
      const { name } = req.body;
const tenantId = req.user.tenantId; // 🔥 ONLY SOURCE

      const userId = req.user.id;

      // 1️⃣ Get active subscription
      const sub = await Subscription.findOne({
        email: req.user.email,
        active: true
      });

      if (!sub) {
        return res.status(403).json({
          msg: "No active plan. Please renew."
        });
      }

      // 2️⃣ Get plan
      const plan = await Plan.findById(sub.planId);

      // 3️⃣ Count existing dashboards
      const existingDashboards = await Dashboard.countDocuments({ tenantId });

      // 4️⃣ Enforce plan limit
      if (
        plan.dashboardsAllowed !== -1 &&
        existingDashboards >= plan.dashboardsAllowed
      ) {
        return res.status(403).json({
          msg: `Your ${plan.name} plan allows only ${plan.dashboardsAllowed} dashboard(s). Upgrade to create more.`
        });
      }

      // 5️⃣ Create dashboard
     const dashboard = new Dashboard({
  name,
  tenantId // 🔥 NO ownerId needed
});


      await dashboard.save();
await createAuditLog({
  actor: req.user,
  action: "CREATE_DASHBOARD",
  targetType: "dashboard",
  targetId: dashboard._id,
  message: `Admin ${req.user.email} created dashboard ${dashboard.name}`
});

      res.json({
        msg: "Dashboard created successfully",
        dashboard
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * ================================
 * ADMIN / MANAGER / STAFF → VIEW DASHBOARD(S)
 * ================================
 * - Admin → sees all dashboards
 * - Manager/Staff → sees only assigned dashboard
 */
router.get(
  "/my",
  auth,
  checkSub,
  allowedRoles("admin", "manager", "staff"),
  async (req, res) => {
    try {
      let dashboards;

      // Admin → all dashboards
      if (req.user.role === "admin") {
        dashboards = await Dashboard.find({ tenantId: req.user.tenantId });
      } 
      // Manager / Staff → only assigned dashboard
      else {
        if (!req.user.dashboardId) {
          return res.status(403).json({
            msg: "No dashboard assigned to this user"
          });
        }

        dashboards = await Dashboard.find({
          _id: req.user.dashboardId
        });
      }

      res.json(dashboards);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
