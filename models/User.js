const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      unique: true,
      required: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["superadmin", "admin", "manager", "staff"],
      default: "admin"
    },
    tenantId: {
  type: String,
  required: true,
},


    // Only ADMIN (paid user) has subscription
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null
    },
isBlocked: {
  type: Boolean,
  default: false
},

    // STAFF / MANAGER belongs to one dashboard
    dashboardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dashboard",
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
