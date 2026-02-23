const mongoose = require("mongoose");

const callHistorySchema = new mongoose.Schema({
  leadId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Lead",
  required: true
},

  leadName: String,
  phone: String,

  callType: {
    type: String,
    enum: ["SIM", "CLOUD"],
    required: true
  },

  status: {
    type: String,
    enum: ["New", "Contacted", "Qualified", "Lost", "Won","Scheduled"],
  },

  outcome: String,
  notes: String,

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  tenantId: String,
  dashboardId: mongoose.Schema.Types.ObjectId

}, { timestamps: true });

module.exports = mongoose.model("CallHistory", callHistorySchema);
