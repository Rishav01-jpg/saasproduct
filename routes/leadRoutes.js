const express = require("express");
const router = express.Router();
const Lead = require("../models/Lead");
const auth = require("../middleware/auth"); // ✅ your auth file
const roleCheck = require("../middleware/roleCheck"); // ✅ your role file
const multer = require("multer");
const fs = require("fs");
const csv = require("csv-parser");
const CallSchedule = require("../models/CallSchedule");

const upload = multer({
  dest: "uploads/" // temp folder for CSV files
});

/* ======================================================
   🟢 CREATE LEAD
====================================================== */
router.post("/", auth, async (req, res) => {
  try {
    const lead = new Lead({
  ...req.body,
  tenantId: req.user.tenantId,
  dashboardId: req.body.dashboardId   // ⭐ NEW
});


    await lead.save();
    res.status(201).json(lead);

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


/* ======================================================
   🔵 GET ALL LEADS (WITH SEARCH & FILTER)
====================================================== */
/* ======================================================
   🔵 GET ALL LEADS (WITH SEARCH + FILTER + PAGINATION)
====================================================== */
router.get("/", auth, async (req, res) => {
  try {
    const { search, status, source, date, page = 1, limit = 20 } = req.query;

  const { dashboardId } = req.query;

let filter = { tenantId: req.user.tenantId };

if (dashboardId) {
  filter.dashboardId = dashboardId;
}



    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    if (status) filter.status = status;
    if (source) filter.source = { $regex: source, $options: "i" };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    const skip = (page - 1) * limit;

    const leads = await Lead.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Lead.countDocuments(filter);

    res.json({
      leads,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page)
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.post(
  "/import",
  auth,
  roleCheck("Admin"),   // ⛔ Block Manager & Staff
  upload.single("file"),
  async (req, res) => {
    try {
      const leads = [];

      fs.createReadStream(req.file.path)
        .pipe(csv())
       .on("data", (row) => {
  // 🚫 Skip rows with no name
  if (!row.name || row.name.trim() === "") return;

 leads.push({
  name: row.name.trim(),
  email: row.email?.trim() || "",
  phone: row.phone?.trim() || "",
  source: row.source?.trim() || "",
  followUpDate: row.followUpDate ? new Date(row.followUpDate) : null,
  tenantId: req.user.tenantId,
  dashboardId: req.body.dashboardId   // ⭐ ADD THIS
});

})

     .on("end", async () => {
  if (leads.length > 0) {
    await Lead.insertMany(leads);
  }
  fs.unlinkSync(req.file.path); // delete temp file
  res.json({ message: "Leads imported successfully", count: leads.length });
});


    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);
router.get(
  "/export",
  auth,
  roleCheck("Admin"),   // ⛔ Only Admin allowed
  async (req, res) => {
    try {
     const { dashboardId } = req.query;

let filter = { tenantId: req.user.tenantId };

if (dashboardId) {
  filter.dashboardId = dashboardId;
}

const leads = await Lead.find(filter);


      let csvData = "name,email,phone,source,status,followUpDate\n";

      leads.forEach(l => {
        csvData += `${l.name || ""},${l.email || ""},${l.phone || ""},${l.source || ""},${l.status || ""},${l.followUpDate || ""}\n`;
      });

      res.header("Content-Type", "text/csv");
      res.attachment("leads.csv");
      res.send(csvData);

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);



router.post("/:id/schedule-call", auth, async (req, res) => {
  try {
    const { scheduledAt } = req.body;

    if (!scheduledAt) {
      return res.status(400).json({ message: "Date & time required" });
    }

    const scheduleDate = new Date(scheduledAt);

    if (scheduleDate < new Date()) {
      return res.status(400).json({ message: "Cannot schedule call in the past" });
    }

    const lead = await Lead.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId,
    });

    if (!lead) return res.status(404).json({ message: "Lead not found" });

    const schedule = new CallSchedule({
      leadId: lead._id,
      tenantId: lead.tenantId,
      dashboardId: lead.dashboardId,
      phone: lead.phone,
      scheduledAt: scheduleDate,
    });

    await schedule.save();

    res.status(201).json({ message: "Call scheduled", schedule });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ======================================================
   📅 GET SCHEDULED CALLS
====================================================== */
/* ======================================================
  /* ======================================================
   📅 GET ALL CALLS FOR DASHBOARD (SCHEDULED + HISTORY)
====================================================== */
router.get("/scheduled-calls", auth, async (req, res) => {
  try {
    const { dashboardId } = req.query;

    if (!dashboardId) {
      return res.status(400).json({ message: "Dashboard ID is required" });
    }

    const calls = await CallSchedule.find({
      tenantId: req.user.tenantId,
      dashboardId: dashboardId
    })
      .populate("leadId", "name phone source status")
      .sort({ scheduledAt: -1 });

    res.json(calls);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/* ======================================================
   ✏️ UPDATE SCHEDULE TIME
====================================================== */
router.put("/scheduled-calls/:id", auth, async (req, res) => {
  try {
    const { scheduledAt } = req.body;

    const call = await CallSchedule.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { scheduledAt },
      { new: true }
    );

    if (!call) return res.status(404).json({ message: "Schedule not found" });

    res.json(call);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
/* ======================================================
   ❌ CANCEL SCHEDULED CALL
====================================================== */
router.delete("/scheduled-calls/:id", auth, async (req, res) => {
  try {
    const call = await CallSchedule.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { status: "Cancelled" },
      { new: true }
    );

    if (!call) return res.status(404).json({ message: "Schedule not found" });

    res.json({ message: "Call cancelled" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
/* ======================================================
   ✅ UPDATE CALL STATUS (Completed / Missed)
====================================================== */
router.put("/scheduled-calls/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Completed", "Missed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const call = await CallSchedule.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { status },
      { new: true }
    );

    if (!call) return res.status(404).json({ message: "Call not found" });

    res.json({ message: `Call marked as ${status}`, call });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ======================================================
   🔍 GET SINGLE LEAD
====================================================== */
router.get("/:id", auth, async (req, res) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId,
    });

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.json(lead);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/* ======================================================
   ✏️ UPDATE LEAD
   Admin + Manager only
====================================================== */
router.put("/:id", auth, roleCheck("Admin", "Manager"), async (req, res) => {
  try {
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      req.body,
      { new: true }
    );

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.json(lead);

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


/* ======================================================
   ❌ DELETE LEAD
   Admin only
====================================================== */
router.delete("/:id", auth, roleCheck("Admin"), async (req, res) => {
  try {
    const lead = await Lead.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.user.tenantId,
    });

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.json({ message: "Lead deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/* ======================================================
   📊 DASHBOARD STATS
====================================================== */
router.get("/stats/summary", auth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { dashboardId } = req.query;

    let filter = { tenantId };
    if (dashboardId) filter.dashboardId = dashboardId;

    const totalLeads = await Lead.countDocuments(filter);
    const newLeads = await Lead.countDocuments({ ...filter, status: "New" });
    const qualifiedLeads = await Lead.countDocuments({ ...filter, status: "Qualified" });
    const lostLeads = await Lead.countDocuments({ ...filter, status: "Lost" });
    const wonLeads = await Lead.countDocuments({ ...filter, status: "Won" });
    const contactedLeads = await Lead.countDocuments({ ...filter, status: "Contacted" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLeads = await Lead.countDocuments({
      ...filter,
      createdAt: { $gte: today },
    });

    res.json({
      totalLeads,
      contactedLeads,
      newLeads,
      qualifiedLeads,
      lostLeads,
      wonLeads,
      todayLeads,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/* ======================================================
   📅 TODAY FOLLOW-UPS
====================================================== */
router.get("/stats/followups-today", auth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { dashboardId } = req.query;   // ⭐ GET DASHBOARD ID

    const today = new Date().toISOString().split("T")[0];

    let filter = {
      tenantId,
      followUpDate: {
        $gte: new Date(today),
        $lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
      }
    };

    // ⭐ FILTER BY DASHBOARD
    if (dashboardId) {
      filter.dashboardId = dashboardId;
    }

    const followUps = await Lead.find(filter).sort({ followUpDate: 1 });

    res.json(followUps);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
/* ======================================================
   📞 SCHEDULE CALL
====================================================== */





module.exports = router;
