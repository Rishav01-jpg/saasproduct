const cron = require("node-cron");
const DemoBooking = require("../models/DemoBooking");
const sendDemoReminderEmail = require("../utils/sendDemoReminderEmail");

const startDemoReminderJob = () => {
  cron.schedule("* * * * *", async () => {
    console.log("⏰ Checking reminders every minute...");

    const now = new Date();
    const bookings = await DemoBooking.find({ reminderSent: false });

    for (let booking of bookings) {
      // ⏱ Send reminder exactly 2 minutes after booking (TEST MODE)
      // 🔥 Force reminder at 13:34 PM today
const reminderTime = new Date(booking.createdAt);
reminderTime.setDate(reminderTime.getDate() + 1);
reminderTime.setHours(10, 0, 0, 0);
      console.log("Now:", now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
console.log("ReminderTime:", reminderTime.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));

      if (
        now.getFullYear() === reminderTime.getFullYear() &&
        now.getMonth() === reminderTime.getMonth() &&
        now.getDate() === reminderTime.getDate() &&
        now.getHours() === reminderTime.getHours() &&
        now.getMinutes() === reminderTime.getMinutes()
      ) {
        console.log("📧 Sending reminder to:", booking.email);

        await sendDemoReminderEmail(booking, "reminder");

        booking.reminderSent = true;
        await booking.save();
      }
    }
 }, {
  timezone: "Asia/Kolkata"
});

  console.log("🕒 Reminder cron job started");
};

module.exports = startDemoReminderJob;