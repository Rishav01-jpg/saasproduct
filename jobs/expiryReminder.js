const cron = require("node-cron");
const Subscription = require("../models/Subscription");
const sendEmail = require("../utils/sendEmail");

const startExpiryReminderJob = () => {
  // Runs every day at 9:00 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("Running expiry reminder job...");

    const today = new Date();

    const subs = await Subscription.find({ active: true });

    for (let sub of subs) {
      const daysLeft = Math.ceil(
        (sub.endDate - today) / (1000 * 60 * 60 * 24)
      );

      // 7-day reminder
      if (daysLeft === 7) {
        await sendEmail(
          sub.email,
          "Your plan expires in 7 days",
          `Hi,\nYour Ring Ring CRM plan will expire on ${sub.endDate.toDateString()}.\nPlease renew to continue using your dashboards.`
        );
      }

      // 1-day reminder
      if (daysLeft === 1) {
        await sendEmail(
          sub.email,
          "Your plan expires tomorrow",
          `Hi,\nYour Ring Ring CRM plan expires TOMORROW.\nPlease renew today to avoid service interruption.`
        );
      }
    }
  });
};

module.exports = startExpiryReminderJob;
