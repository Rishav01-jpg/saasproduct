const mongoose = require("mongoose");

const callScheduleSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lead",
    required: true,
  },

  tenantId: {
    type: String,   // ✅ SAME TYPE AS LEAD
    required: true,
  },

  dashboardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Dashboard",
    required: true,
  },

  phone: String,

  scheduledAt: {
    type: Date,
    required: true,
  },

  status: {
    type: String,
    enum: ["Scheduled", "Completed", "Missed", "Cancelled"],
    default: "Scheduled",
  },

}, { timestamps: true });

module.exports = mongoose.model("CallSchedule", callScheduleSchema);
