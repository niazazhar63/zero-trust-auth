// authController.js
import nodemailer from "nodemailer";
import crypto from "crypto";
import Otp from "../models/otpModel.js";
import jwt from "jsonwebtoken";

// ===================== CONFIG =====================
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const OTP_MAX_ATTEMPTS = 3;
const GENERIC_MESSAGE = "If the email exists, an OTP has been sent.";

// Reuse single transporter (avoid recreating each request)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.mailtrap.io",
  port: Number(process.env.SMTP_PORT || 2525),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Generate a random 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ===================== SEND OTP =====================
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const otp = generateOtp();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // Delete old OTPs (if any) quickly before saving new one
    await Otp.deleteMany({ email });

    // Save new OTP (non-blocking I/O)
    Otp.create({
      email,
      otp: hashedOtp,
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
    }).catch(err => console.error("[sendOtp] DB error:", err));

    // Send mail async (no await = no blocking)
    transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    }).catch(err => console.error("[sendOtp] mail error:", err));

    // Respond immediately (no delays)
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
    const record = await Otp.findOne({ email }).lean(); // lean() → faster (no Mongoose doc overhead)

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

    // OTP is valid → delete it immediately (atomic)
    await Otp.deleteMany({ email });

    // Generate JWT (1 hour validity)
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    return res.json({ success: true, token });
  } catch (err) {
    console.error("[verifyOtp] error:", err);
    return res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
};
