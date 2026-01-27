const AuditLog = require("../models/AuditLog");

const createAuditLog = async ({
  actor,
  action,
  targetType,
  targetId,
  message
}) => {
  try {
    await AuditLog.create({
      actorId: actor.id,
      actorRole: actor.role,
      action,
      targetType,
      targetId,
      message
    });
  } catch (err) {
    console.error("Audit log error:", err.message);
  }
};

module.exports = createAuditLog;
