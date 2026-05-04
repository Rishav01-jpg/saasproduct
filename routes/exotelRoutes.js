const express = require("express");
const axios = require("axios");
const auth = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

/* ======================================================
   📞 MAKE CALL (EXOTEL)
====================================================== */
router.post("/call", auth, async (req, res) => {
  try {
    const { phone } = req.body;

    // ✅ Validate phone
    if (!phone || phone.length < 10) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    // ✅ Get user
    const user = await User.findById(req.user.id);

    if (!user || !user.exotel) {
      return res.status(400).json({ message: "Exotel not connected" });
    }

    const { sid, apiKey, apiToken, callerId } = user.exotel;

    // ✅ Validate credentials
    if (!sid || !apiKey || !apiToken || !callerId) {
      return res.status(400).json({ message: "Incomplete Exotel config" });
    }

    // ✅ Format phone number
    let formattedPhone = phone;
    if (!phone.startsWith("+")) {
      formattedPhone = `+91${phone}`;
    }

    // ✅ Exotel API URL
    const url = `https://api.exotel.com/v1/Accounts/${sid}/Calls/connect.json`;

    // 🔥 IMPORTANT: Use Railway public URL
    const voiceUrl = "https://saasproduct-production.up.railway.app/api/exotel/voice";

    console.log("📞 Calling:", formattedPhone);
    console.log("🔗 Voice URL:", voiceUrl);

    const response = await axios.post(
      url,
      new URLSearchParams({
        From: callerId,
        To: formattedPhone,
        CallerId: callerId,
        CallType: "trans",
        Url: voiceUrl // 🔥 REQUIRED
      }),
      {
        auth: {
          username: apiKey,
          password: apiToken
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    res.json({
      message: "Call initiated successfully",
      data: response.data
    });

  } catch (err) {
    console.error("❌ EXOTEL ERROR:", err.response?.data || err.message);

    res.status(500).json({
      message: "Call failed",
      error: err.response?.data || err.message
    });
  }
});


/* ======================================================
   🔊 VOICE CALLBACK (EXOTEL)
====================================================== */
router.post("/voice", (req, res) => {
  res.set("Content-Type", "text/xml");

  res.send(`
    <Response>
      <Say voice="woman">Connecting your call. Please wait.</Say>
    </Response>
  `);
});


/* ======================================================
   🧪 TEST ROUTE (OPTIONAL - FOR DEBUGGING)
====================================================== */
router.get("/voice", (req, res) => {
  res.set("Content-Type", "text/xml");

  res.send(`
    <Response>
      <Say>Voice route is working</Say>
    </Response>
  `);
});


module.exports = router;