const express = require("express");
const router = express.Router();
const CallHistory = require("../models/CallHistory");
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
    res.status(201).json({ message: "Call history saved" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= GET CALL HISTORY ================= */
router.get("/", auth, async (req, res) => {
  try {
    const { dashboardId } = req.query;

    const history = await CallHistory.find({
      tenantId: req.user.tenantId,
      dashboardId
    }).sort({ createdAt: -1 });

    res.json(history);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
