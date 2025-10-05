// authController.js (Post-effective fast version)
import nodemailer from "nodemailer";
import crypto from "crypto";
import Otp from "../models/otpModel.js";
import jwt from "jsonwebtoken";

// --- CONFIG ---
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const OTP_MAX_ATTEMPTS = 3;

// --- transporter (single instance, connection pooled) ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  pool: true, // ⚡ enable pooled connections
  maxConnections: 3,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// --- helper ---
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// --- Send OTP (post-effective fast mode) ---
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: "Email is required" });

    // Generate & hash OTP
    const otp = generateOtp();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // Remove previous OTPs (ensure one per user)
    await Otp.deleteMany({ email });

    // Create new OTP record
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

    // Send asynchronously (but slightly delayed for realism)
    setTimeout(() => {
      transporter
        .sendMail(mailOptions)
        .then((info) => console.log(`[sendOtp][PostFast] sent -> ${email}`))
        .catch((err) => console.error("[sendOtp][PostFast] mail error:", err));
    }, 500); // small delay to simulate realistic async send

    return res
      .status(202)
      .json({ success: true, message: "OTP generated and email is on the way" });
  } catch (err) {
    console.error("[sendOtp][PostFast] error:", err);
    return res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

// --- Verify OTP (post-effective fast mode) ---
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP are required" });

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // Small realistic DB delay (~500 ms)
    await sleep(500);

    const record = await Otp.findOne({ email });
    if (!record)
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });

    if (record.expiresAt < Date.now()) {
      await Otp.deleteMany({ email });
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    if (record.otp !== hashedOtp) {
      const updated = await Otp.findOneAndUpdate(
        { email },
        { $inc: { attempts: 1 } },
        { new: true }
      );
      if (updated.attempts >= OTP_MAX_ATTEMPTS) {
        await Otp.deleteMany({ email });
        return res
          .status(429)
          .json({ success: false, message: "Too many invalid attempts" });
      }
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // OTP matched → delete and issue token
    await Otp.deleteMany({ email });
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.json({ success: true, token });
  } catch (err) {
    console.error("[verifyOtp][PostFast] error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to verify OTP" });
  }
};
