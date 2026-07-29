const nodemailer = require("nodemailer");

/**
 * Sends an email using Nodemailer.
 * Falls back to console simulation if SMTP credentials are not configured.
 */
const sendEmail = async ({ to, subject, html }) => {
  // Check if SMTP environment variables are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`\n=========================================`);
    console.log(`[SMTP SIMULATION] To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body (HTML):`);
    console.log(html.replace(/<[^>]*>/g, '').trim()); // Strip HTML tags for clean console view
    console.log(`=========================================\n`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Protocol Zero Security" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[SMTP SUCCESS] Real email sent successfully to ${to}`);
  } catch (error) {
    console.error("[SMTP ERROR] Failed to send real email:", error.message);
    // Silent fail in development, log error but don't break the auth flow
  }
};

module.exports = { sendEmail };
