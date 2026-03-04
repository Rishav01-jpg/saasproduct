const User = require("../models/User");
const Subscription = require("../models/Subscription");

module.exports = async (req, res, next) => {
  try {
    const adminUser = await User.findOne({
  tenantId: req.user.tenantId,
  role: "admin"
});
if (!adminUser) {
  return res.status(403).json({ msg: "Admin not found for this tenant" });
}
    

    

   const sub = await Subscription.findById(adminUser.subscriptionId);

    if (!sub || !sub.active) {
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
