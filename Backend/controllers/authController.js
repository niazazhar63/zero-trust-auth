import nodemailer from "nodemailer";
import crypto from "crypto";   // 🔥 Required import
import Otp from "../models/otpModel.js";
import jwt from "jsonwebtoken";

// ------------------- Send OTP -------------------
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("📩 Generated OTP:", otp);

    // Hash OTP and save to DB
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // Remove old OTPs for this email
    await Otp.deleteMany({ email });

    await Otp.create({
      email,
      otp: hashedOtp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes validity
    });

    // Send OTP via Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    });

    console.log("✅ OTP Email sent:", info.response);

    res.json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    console.error("❌ OTP Send Error:", err);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

// ------------------- Verify OTP -------------------
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    const record = await Otp.findOne({ email, otp: hashedOtp });

    if (!record) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    if (record.expiresAt < Date.now()) {
      await Otp.deleteMany({ email });
      return res.json({ success: false, message: "OTP expired" });
    }

    // Success: remove OTP from DB
    await Otp.deleteMany({ email });

    // Issue JWT token
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ success: true, token });
  } catch (err) {
    console.error("❌ OTP Verify Error:", err);
    res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
};
