const express = require("express");
const router = express.Router();
const CallHistory = require("../models/CallHistory");
const Lead = require("../models/Lead"); // ⭐ ADD THIS

const auth = require("../middleware/auth");

/* ================= SAVE CALL RESULT ================= */
router.post("/", auth, async (req, res) => {
  try {
    const history = new CallHistory({
      ...req.body,
      userId: req.user.id,
      tenantId: req.user.tenantId
    });

    await history.save();
    // ⭐ ALSO UPDATE LEAD STATUS
if (req.body.leadId && req.body.status) {
  await Lead.findByIdAndUpdate(req.body.leadId, {
    status: req.body.status
  });
}

    res.status(201).json({ message: "Call history saved" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= GET CALL HISTORY ================= */
router.get("/", auth, async (req, res) => {
  try {
    const { dashboardId } = req.query;

    let filter = {
      tenantId: req.user.tenantId,
      dashboardId
    };

    // ⭐ Staff → only their own call history
    if (req.user.role.toLowerCase() === "staff") {
      filter.userId = req.user._id;
    }

    const history = await CallHistory.find(filter)
      .sort({ createdAt: -1 });

    res.json(history);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
