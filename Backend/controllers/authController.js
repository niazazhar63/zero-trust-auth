// authController.js (Slow login model for demo, production-ready)
import nodemailer from "nodemailer";
import crypto from "crypto";
import Otp from "../models/otpModel.js";
import jwt from "jsonwebtoken";

// --- CONFIG ---
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const OTP_MAX_ATTEMPTS = 3;

// --- helper sleep ---
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// --- transporter factory ---
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const secure = port === 465; // SSL if 465, otherwise STARTTLS
  const auth = {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  };

  if (!host || !port || !auth.user || !auth.pass) {
    throw new Error("SMTP environment variables are missing!");
  }

  return nodemailer.createTransport({ host, port, secure, auth });
};

const transporter = getTransporter();

// --- OTP util ---
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// --- Send OTP (slow mode) ---
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    // Generate OTP and hash
    const otp = generateOtp();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // Remove old OTPs
    await Otp.deleteMany({ email });

    // Create new OTP (attempts starts 0)
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

    // --- SLOW DEMO BEHAVIOR ---
    // 1) Artificial CPU load
    for (let i = 0; i < 4_000_000; i++) {
      const x = i * 2; // intentional no-op to slow down
    }

    // 2) Artificial network latency
    await sleep(3000); // 3 seconds delay

    // 3) Send email synchronously
    await transporter.sendMail(mailOptions);

    console.log(`[sendOtp][SLOW] OTP sent to ${email}`);
    return res.status(202).json({ success: true, message: "OTP requested (check email)" });
  } catch (err) {
    console.error("[sendOtp][SLOW] error:", err);
    return res.status(500).json({ success: false, message: "Failed to process OTP request" });
  }
};

// --- Verify OTP (slow mode) ---
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP are required" });

    // Artificial DB/network delay
    await sleep(2000);

    // Fetch all OTPs for email (simulate inefficient DB access)
    const allRecords = await Otp.find({ email });
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    const record = allRecords.find(r => r.otp === hashedOtp);

    if (!record) {
      // Increment attempts if old OTP exists
      if (allRecords.length > 0) {
        await Otp.updateOne({ _id: allRecords[0]._id }, { $inc: { attempts: 1 } });
      }
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Check expiry
    if (record.expiresAt < Date.now()) {
      await Otp.deleteMany({ email });
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    // Check attempts
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      await Otp.deleteMany({ email });
      return res.status(429).json({ success: false, message: "Too many attempts" });
    }

    // Consume OTP
    await Otp.findOneAndDelete({ email, otp: hashedOtp });

    // Issue JWT
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    console.log(`[verifyOtp][SLOW] OTP verified for ${email}`);
    return res.json({ success: true, token });
  } catch (err) {
    console.error("[verifyOtp][SLOW] error:", err);
    return res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
};
