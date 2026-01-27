const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {

  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
  const decoded = jwt.verify(
  token.replace("Bearer ", ""),
  process.env.JWT_SECRET
);

// 🔥 Fetch fresh user from DB
const user = await User.findById(decoded.id);

if (!user) {
  return res.status(401).json({ msg: "User not found" });
}

// Attach FULL user info to req
req.user = {
  id: user._id,
  email: user.email,
  role: user.role,
  tenantId: user.tenantId, 
  dashboardId: user.dashboardId
};

next();

  } catch (error) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};
