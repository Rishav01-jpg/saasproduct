const express = require("express");
const router = express.Router();
const DemoBooking = require("../models/DemoBooking");
const sendDemoReminderEmail = require("../utils/sendDemoReminderEmail");

// ================= BOOK DEMO + AUTO DATE + CONFIRMATION EMAIL =================
router.post("/book-demo", async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // Validate required fields (date removed)
    if (!name || !email || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 📅 Auto schedule demo for NEXT DAY at 11:00 AM
    const demoDate = new Date();
    demoDate.setDate(demoDate.getDate() + 1); // tomorrow
    demoDate.setHours(0, 0, 0, 0); // store date only

    // 1️⃣ Save booking
    const booking = await DemoBooking.create({
      name,
      email,
      phone,
      demoDate,
      zoomLink: process.env.ZOOM_LINK,
    });

    // 2️⃣ Send confirmation email instantly
    await sendDemoReminderEmail(booking, "confirmation");

    res.status(201).json({
      success: true,
      message: "Demo booked for tomorrow 11:00 AM! Confirmation email sent.",
      booking,
    });
  } catch (error) {
    console.error("Book demo error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= TEST REMINDER EMAIL =================
router.get("/test-reminder/:id", async (req, res) => {
  try {
    const booking = await DemoBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    await sendDemoReminderEmail(booking, "reminder");

    res.json({ message: "Reminder email sent successfully!" });
  } catch (error) {
    console.error("Reminder error:", error);
    res.status(500).json({ message: "Error sending reminder" });
  }
});

module.exports = router;