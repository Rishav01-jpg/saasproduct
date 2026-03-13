const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Lead = require("../models/Lead");
const CallHistory = require("../models/CallHistory");

const auth = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
router.get("/staff", auth, roleCheck("admin"), async (req, res) => {
  try {

    const { dashboardId } = req.query;

   

   const users = await User.find({
  tenantId: req.user.tenantId,
  dashboardId: dashboardId,
  role: { $in: ["staff", "manager"] }
});

    const results = [];

    for (const user of users) {

      let leadFilter = {
        tenantId: req.user.tenantId,
        assignedTo: user._id
      };

      if (dashboardId) {
        leadFilter.dashboardId = dashboardId;
      }

      const leadsAssigned = await Lead.countDocuments(leadFilter);
      const assignedLead = await Lead.findOne(leadFilter)
  .populate("assignedBy", "name");

      const leadsWon = await Lead.countDocuments({
        ...leadFilter,
        status: "Won"
      });

     const callsMade = await CallHistory.countDocuments({
  tenantId: req.user.tenantId,
  userId: user._id,
  dashboardId: dashboardId
});

      const conversionRate =
        leadsAssigned === 0
          ? 0
          : ((leadsWon / leadsAssigned) * 100).toFixed(1);

   results.push({
  userId: user._id,
  role: user.role,
  name: user.name,
  email: user.email,
  leadsAssigned,
  assignedBy: assignedLead?.assignedBy?.name || "-",
  leadsWon,
  callsMade,
  conversionRate
});
    }

    res.json(results);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;