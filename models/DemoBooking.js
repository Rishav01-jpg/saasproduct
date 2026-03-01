const mongoose = require("mongoose");

const demoBookingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    demoDate: {
      type: Date,
      required: true,
    },
    demoTime: {
      type: String,
      default: "11:00 AM",
    },
    zoomLink: {
      type: String,
      required: true,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DemoBooking", demoBookingSchema);