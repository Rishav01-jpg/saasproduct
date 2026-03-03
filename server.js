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
const leadRoutes = require("./routes/leadRoutes"); 
const callHistoryRoutes = require("./routes/callHistoryRoutes");
const exotelRoutes = require("./routes/exotelRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const demoRoutes = require("./routes/demoRoutes");
const startDemoReminderJob = require("./jobs/demoReminderJob");
const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://192.168.1.11:5173",
      "https://ringringcrm.com",
      
      "https://saasproduct-ui.onrender.com",
      "https://hoppscotch.io",
"https://saasproduct-ui.vercel.app"
    ],
    credentials: true
  })
);
app.use(express.json());
app.use(
  helmet({
    crossOriginOpenerPolicy: false,
  })
);

app.use("/api/payment", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/super", superAdminRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/call-history", callHistoryRoutes);
app.use("/api/exotel", exotelRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/demo", demoRoutes);
connectDB();
startDemoReminderJob();
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
