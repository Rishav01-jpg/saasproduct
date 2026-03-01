const User = require("../models/User");
const Subscription = require("../models/Subscription");

module.exports = async (req, res, next) => {
  try {
    let ownerEmail = req.user.email;

if (req.user.role !== "admin") {
  const adminUser = await User.findById(req.user.createdBy);
  if (adminUser) {
    ownerEmail = adminUser.email;
  }
}

    

   const sub = await Subscription.findOne({ email: ownerEmail, active: true });

    if (!sub) {
      return res.status(403).json({
        msg: "No active subscription. Please buy or renew your plan."
      });
    }

    const today = new Date();

    // If plan expired
    if (today >= sub.endDate) {
      sub.active = false;
      await sub.save();

      return res.status(403).json({
        msg: "Your plan expired. Dashboards are locked. Please renew."
      });
    }

    next(); // plan is active → allow access

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
