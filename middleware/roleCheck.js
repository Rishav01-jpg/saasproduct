module.exports = function allowedRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        msg: "Access denied: insufficient permissions"
      });
    }

    const userRole = req.user.role.toLowerCase();
    const allowed = roles.map(r => r.toLowerCase());

    if (!allowed.includes(userRole)) {
      return res.status(403).json({
        msg: "Access denied: insufficient permissions"
      });
    }

    next();
  };
};
