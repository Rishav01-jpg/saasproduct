const mongoose = require("mongoose");

const PlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ["Basic", "Pro", "Enterprise"]
  },
  price: {
    type: Number,
    required: true
  },
  dashboardsAllowed: {
    type: Number, // 1, 2, or -1 for unlimited
    required: true
  }
});

module.exports = mongoose.model("Plan", PlanSchema);
