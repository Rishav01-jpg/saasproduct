require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const paymentRoutes = require("./routes/paymentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const startExpiryReminderJob = require("./jobs/expiryReminder");
const userRoutes = require("./routes/userRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
const helmet = require("helmet");
const authRoutes = require("./routes/authRoutes");   // <-- ADD THIS

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cors());
app.use("/api/payment", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/super", superAdminRoutes);

connectDB();
startExpiryReminderJob();


app.get("/", (req, res) => {
  res.send("Multi-Tenant Backend Running...");
});
app.get("/test-email", async (req, res) => {
  const sendEmail = require("./utils/sendEmail");

  await sendEmail(
    "keshavmishra3473@gmail.com",
    "Test from Ring Ring CRM",
    "If you received this, Resend is working 🎉"
  );

  res.send("Test email sent!");
});

// ADD THIS LINE 👇
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
