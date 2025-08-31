import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const sendPasswordSetEmail = async ({ to, name, resetLink }) => {
  try {
    // 1️⃣ Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,       // smtp.gmail.com
      port: parseInt(process.env.SMTP_PORT), // 587
      secure: false,                     // true for 465
      auth: {
        user: process.env.SMTP_USER,     // তোমার Gmail
        pass: process.env.SMTP_PASS,     // Gmail App Password
      },
    });

    // 2️⃣ Email content
    const mailOptions = {
      from: process.env.FROM_EMAIL,       // "Admin <niazazhar63@gmail.com>"
      to,
      subject: "Set your account password",
      html: `
        <p>Hi ${name},</p>
        <p>Your account has been approved! Click the link below to set your password:</p>
        <p><a href="${resetLink}">Set Password</a></p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    // 3️⃣ Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("Password set email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("Error sending email:", err);
    throw err;
  }
};
