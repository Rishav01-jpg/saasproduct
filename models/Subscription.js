const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plan"
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  active: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model("Subscription", SubscriptionSchema);
