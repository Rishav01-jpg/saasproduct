const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    actorRole: String, // superadmin, admin
    action: String,    // BLOCK_USER, ACTIVATE_SUBSCRIPTION, etc
    targetType: String, // user, subscription, dashboard
    targetId: mongoose.Schema.Types.ObjectId,
    message: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", AuditLogSchema);
