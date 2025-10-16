// authController.js
import nodemailer from "nodemailer";
import crypto from "crypto";
import Otp from "../models/otpModel.js";
import jwt from "jsonwebtoken";

// ===================== CONFIG =====================
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const OTP_MAX_ATTEMPTS = 3;
const GENERIC_MESSAGE = "If the email exists, an OTP has been sent.";

// ===================== HELPER =====================
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ===================== TRANSPORTER =====================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465, // TLS for 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Gmail App Password
  },
});

// Verify transporter connection at server start
transporter.verify((err, success) => {
  if (err) console.error("SMTP Connection error:", err);
  else console.log("SMTP is ready to send emails");
});

// ===================== SEND OTP =====================
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: "Email is required" });

    const otp = generateOtp();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // Delete old OTPs quickly
    await Otp.deleteMany({ email });

    // Save new OTP
    await Otp.create({
      email,
      otp: hashedOtp,
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
    });

    // Send email
    try {
      const info = await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
      });
      console.log("OTP sent:", info.response);
    } catch (mailErr) {
      console.error("Error sending OTP email:", mailErr);
    }

    // Immediate response to client
    return res.status(202).json({ success: true, message: GENERIC_MESSAGE });
  } catch (err) {
    console.error("[sendOtp] error:", err);
    return res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

// ===================== VERIFY OTP =====================
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ success: false, message: "Email and OTP are required" });

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    const record = await Otp.findOne({ email }).lean();

    if (!record || record.expiresAt < Date.now()) {
      await Otp.deleteMany({ email });
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      await Otp.deleteMany({ email });
      return res.status(429).json({
        success: false,
        message: "Too many attempts. Please request a new OTP.",
      });
    }

    if (record.otp !== hashedOtp) {
      await Otp.updateOne({ email }, { $inc: { attempts: 1 } });
      const left = OTP_MAX_ATTEMPTS - (record.attempts + 1);
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${left > 0 ? `${left} attempts left.` : "No attempts left."}`,
      });
    }

    // OTP is valid → delete it
    await Otp.deleteMany({ email });

    // Generate JWT (1 hour)
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    return res.json({ success: true, token });
  } catch (err) {
    console.error("[verifyOtp] error:", err);
    return res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
};