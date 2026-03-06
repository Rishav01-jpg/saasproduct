const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendDemoEmail = async (booking, type = "confirmation") => {
  try {
    let subject = "";
    let html = "";

    if (type === "confirmation") {
      subject = "🎉 Your CRM Demo is Booked for 11:00 AM";
      html = `
        <h2>Hi ${booking.name},</h2>
        <p>🎉 Your live CRM demo has been <b>successfully booked</b>.</p>
        <p><b>Date:</b> ${new Date(booking.demoDate).toDateString()}</p>
        <p><b>Time:</b> 11:00 AM</p>

        <p>The Zoom meeting link will be sent in the reminder email before your demo starts.</p>

        <br/><br/>
        <p>You will also receive a reminder email at 10:00 AM.</p>
        <p>— Ring Ring CRM Team</p>
      `;
    }

    if (type === "reminder") {
      subject = "⏰ Reminder: Your Demo Starts at 11:00 AM";
      html = `
        <h2>Hello ${booking.name},</h2>
        <p>⏰ Your demo session starts at <b>11:00 AM</b>.</p>
        <p>Join meeting with Zoom link:</p>

        <a href="${booking.zoomLink}" 
           style="padding:10px 20px;background:#4F46E5;color:white;text-decoration:none;border-radius:6px;">
           Join Zoom Meeting
        </a>

        <br/><br/>
        <p>${booking.zoomLink}</p>
        <p>See you soon 🚀</p>
        <p>— Ring Ring CRM Team</p>
      `;
    }

    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: booking.email,
      subject,
      html,
    });

    console.log(`📧 ${type} email sent to:`, booking.email);
  } catch (error) {
    console.error("❌ Email send error:", error);
  }
};

module.exports = sendDemoEmail;