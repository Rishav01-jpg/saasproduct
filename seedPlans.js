require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Plan = require("./models/Plan");

const seedPlans = async () => {
  await connectDB();

  await Plan.deleteMany(); // clean old plans (safe now)

  await Plan.insertMany([
    {
      name: "Basic",
      price: 1000,
      dashboardsAllowed: 1
    },
    {
      name: "Pro",
      price: 2000,
      dashboardsAllowed: 2
    },
    {
      name: "Enterprise",
      price: 3000,
      dashboardsAllowed: -1 // unlimited
    }
  ]);

  console.log("✅ Plans inserted successfully");
  process.exit();
};

seedPlans();
