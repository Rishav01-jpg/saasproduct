const mongoose = require("mongoose");

const DashboardSchema = new mongoose.Schema({
  name: String,           // "Gym 1", "Gym 2"
  tenantId: String,       // gym_001, school_001, etc.
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
});

module.exports = mongoose.model("Dashboard", DashboardSchema);
