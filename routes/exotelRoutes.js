const express = require("express");
const axios = require("axios");
const auth = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

router.post("/call", auth, async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await User.findById(req.user.id);

    if (!user.exotel || !user.exotel.sid) {
      return res.status(400).json({ message: "Exotel not connected" });
    }

    const { sid, apiKey, apiToken, callerId } = user.exotel;

    const url = `https://api.exotel.com/v1/Accounts/${sid}/Calls/connect.json`;

    const response = await axios.post(
      url,
      new URLSearchParams({
        From: callerId,     // ⭐ Exotel Virtual Number
        To: phone,          // Lead number
        CallerId: callerId, // ⭐ Same number
        CallType: "trans"
      }),
      {
        auth: {
          username: apiKey,
          password: apiToken
        }
      }
    );

    res.json({ message: "Call initiated", data: response.data });

  } catch (err) {
    console.error("EXOTEL ERROR:", err.response?.data || err.message);
    res.status(500).json({ message: "Call failed" });
  }
});

module.exports = router;
