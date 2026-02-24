const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Lead = require("../models/Lead");
const CallHistory = require("../models/CallHistory");
const auth = require("../middleware/auth");

router.get("/overview", auth, async (req, res) => {
  try {
    const { dashboardId, period } = req.query;

    if (!dashboardId) {
      return res.status(400).json({ message: "dashboardId required" });
    }

    const dashId = new mongoose.Types.ObjectId(dashboardId);

    /* ================= DATE FILTER ================= */
    let startDate = null;
    const now = new Date();

    if (period === "day") {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "week") {
      startDate = new Date();
      startDate.setDate(now.getDate() - 7);
    } else if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const dateMatch = startDate ? { createdAt: { $gte: startDate } } : {};

    /* ================= TOTAL METRICS ================= */
    const totalLeads = await Lead.countDocuments({
      dashboardId: dashId,
      ...dateMatch
    });

    const totalCalls = await CallHistory.countDocuments({
      dashboardId: dashId,
      ...dateMatch
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const callsToday = await CallHistory.countDocuments({
      dashboardId: dashId,
      createdAt: { $gte: todayStart }
    });

    const wonLeads = await Lead.countDocuments({
      dashboardId: dashId,
      status: "Won",
      ...dateMatch
    });

    const conversionRate =
      totalLeads === 0 ? 0 : ((wonLeads / totalLeads) * 100).toFixed(1);

    /* ================= LEAD FUNNEL ================= */
    const funnel = {
      new: await Lead.countDocuments({ dashboardId: dashId, status: "New", ...dateMatch }),
      contacted: await Lead.countDocuments({ dashboardId: dashId, status: "Contacted", ...dateMatch }),
      qualified: await Lead.countDocuments({ dashboardId: dashId, status: "Qualified", ...dateMatch }),
      won: wonLeads,
      lost: await Lead.countDocuments({ dashboardId: dashId, status: "Lost", ...dateMatch })
    };

    /* ================= CLEAN CALL OUTCOMES ================= */
    const validOutcomes = [
      "Completed",
      "Missed",
      "Cancel",
      "Wrong No",
      "Switch Off",
      "Interested"
    ];

    const outcomesAgg = await CallHistory.aggregate([
      { $match: { dashboardId: dashId, outcome: { $in: validOutcomes }, ...dateMatch } },
      { $group: { _id: "$outcome", count: { $sum: 1 } } }
    ]);

    const outcomes = validOutcomes.map(label => {
      const found = outcomesAgg.find(o => o._id === label);
      return { label, count: found ? found.count : 0 };
    });

    /* ================= LEAD SOURCE ANALYTICS ================= */
    const sourceAgg = await Lead.aggregate([
      { $match: { dashboardId: dashId, ...dateMatch } },
      { $group: { _id: "$source", count: { $sum: 1 } } }
    ]);

    const leadSources = sourceAgg.map(s => ({
      source: s._id || "Unknown",
      count: s.count
    }));

    res.json({
      totals: {
        totalLeads,
        totalCalls,
        callsToday,
        conversionRate
      },
      funnel,
      outcomes,
      leadSources
    });

  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;