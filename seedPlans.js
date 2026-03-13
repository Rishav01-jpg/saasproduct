require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Plan = require("./models/Plan");

const seedPlans = async () => {
  await connectDB();

  

 await Plan.updateOne(
  { name: "Basic" },
  { $set: { price: 5988, dashboardsAllowed: 1 } },
  { upsert: true }
);

await Plan.updateOne(
  { name: "Pro" },
  { $set: { price: 10788, dashboardsAllowed: 2 } },
  { upsert: true }
);

await Plan.updateOne(
  { name: "Enterprise" },
  { $set: { price: 19188, dashboardsAllowed: -1 } },
  { upsert: true }
);

  console.log("✅ Plans inserted successfully");
  process.exit();
};

seedPlans();
