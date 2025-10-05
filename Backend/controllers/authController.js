// authController.js (Final Fast & Optimized for Thesis)
// Logical performance optimization with non-blocking DB operations

import nodemailer from "nodemailer";
import crypto from "crypto";
import Otp from "../models/otpModel.js";
import jwt from "jsonwebtoken";

// --- CONFIG ---
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const OTP_MAX_ATTEMPTS = 3;

// --- Transporter Factory (pooled for speed) ---
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const secure = port === 465;
  const auth = {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  };

  if (!host || !port || !auth.user || !auth.pass) {
    throw new Error("SMTP environment variables are missing!");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth,
    pool: true, // enables connection reuse
    maxConnections: 5,
  });
};

// Single pooled transporter instance
const transporter = getTransporter();

// --- Helper ---
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// --- STEP 1: Send OTP (Fast Mode) ---
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: "Email is required" });

    // Generate OTP & hash
    const otp = generateOtp();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // Cleanup old OTPs
    await Otp.deleteMany({ email });

    // Store new OTP
    await Otp.create({
      email,
      otp: hashedOtp,
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
    });

    // Prepare email
    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    };

    // Send email asynchronously (fire-and-forget)
    transporter
      .sendMail(mailOptions)
      .then((info) => {
        console.log(`[sendOtp] Email sent to ${email} (msgId: ${info.messageId})`);
      })
      .catch((err) => {
        console.error("[sendOtp] Email error:", err);
      });

    console.log(`[sendOtp][FAST] OTP created for ${email}`);
    return res.status(202).json({ success: true, message: "OTP requested (check email)" });
  } catch (err) {
    console.error("[sendOtp][FAST] error:", err);
    return res.status(500).json({ success: false, message: "Failed to process OTP request" });
  }
};

// --- STEP 2: Verify OTP (Optimized Mode) ---
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ success: false, message: "Email and OTP are required" });

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // Efficient DB fetch
    const record = await Otp.findOne({ email }).lean();

    if (!record) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    // Expired?
    if (record.expiresAt < Date.now()) {
      Otp.deleteMany({ email }).catch(() => {});
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    // Wrong OTP → async increment
    if (record.otp !== hashedOtp) {
      Otp.updateOne({ email }, { $inc: { attempts: 1 } }).catch(() => {});
      if ((record.attempts || 0) + 1 >= OTP_MAX_ATTEMPTS) {
        Otp.deleteMany({ email }).catch(() => {});
        return res.status(429).json({ success: false, message: "Too many attempts" });
      }
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // ✅ Correct OTP — instantly issue JWT
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Async cleanup
    Otp.deleteMany({ email }).catch(() => {});

    console.log(`[verifyOtp][FAST-OPTIMIZED] OTP verified for ${email}`);
    return res.json({ success: true, token });
  } catch (err) {
    console.error("[verifyOtp][FAST-OPTIMIZED] error:", err);
    return res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
};
