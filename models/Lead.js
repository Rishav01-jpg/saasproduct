const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: String,
  email: String,
  source: String, // Facebook, Website, etc.

  status: {
    type: String,
    enum: ["New", "Contacted", "Qualified", "Lost", "Won","Scheduled"],
    default: "New",
  },

  followUpDate: Date,
  notes: String,

 tenantId: {
  type: String,   // ✅ matches your existing tenant system
  required: true,
},
assignedTo: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null
},

assignedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null
},
  // ⭐ ADD THIS
  dashboardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Dashboard",
    required: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Lead", leadSchema);
