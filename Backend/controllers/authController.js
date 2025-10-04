// authController.js (Phase-1: ~30 % faster)
import nodemailer from "nodemailer";
import crypto from "crypto";
import Otp from "../models/otpModel.js";
import jwt from "jsonwebtoken";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 min
const OTP_MAX_ATTEMPTS = 3;

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const secure = port === 465;
  const auth = { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS };
  if (!host || !port || !auth.user || !auth.pass) {
    throw new Error("SMTP environment variables are missing!");
  }
  return nodemailer.createTransport({ host, port, secure, auth });
};
const transporter = getTransporter();

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// --- SEND OTP (Phase-1 faster) ---
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });

    const otp = generateOtp();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    await Otp.deleteMany({ email });
    await Otp.create({
      email,
      otp: hashedOtp,
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
    });

    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    };

    // Reduced artificial load
    for (let i = 0; i < 2_000_000; i++) {
      const x = i * 2;
    }

    // Fire email asynchronously while we simulate latency
    const emailPromise = transporter.sendMail(mailOptions).catch((err) => {
      console.error("[sendOtp] email error:", err);
    });

    // Cut latency to ~1.5 s
    await sleep(1500);
    await emailPromise;

    console.log(`[sendOtp][FAST-30%] OTP sent to ${email}`);
    return res
      .status(202)
      .json({ success: true, message: "OTP requested (check email)" });
  } catch (err) {
    console.error("[sendOtp][FAST-30%] error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to process OTP request" });
  }
};

// --- VERIFY OTP (Phase-1 faster) ---
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP are required" });

    // Reduced artificial delay
    await sleep(1000);

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    const record = await Otp.findOne({ email, otp: hashedOtp });

    if (!record) {
      await Otp.updateOne({ email }, { $inc: { attempts: 1 } }).catch(() => {});
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP" });
    }

    if (record.expiresAt < Date.now()) {
      await Otp.deleteMany({ email });
      return res
        .status(400)
        .json({ success: false, message: "OTP expired" });
    }

    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      await Otp.deleteMany({ email });
      return res
        .status(429)
        .json({ success: false, message: "Too many attempts" });
    }

    await Otp.deleteMany({ email });

    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    console.log(`[verifyOtp][FAST-30%] OTP verified for ${email}`);
    return res.json({ success: true, token });
  } catch (err) {
    console.error("[verifyOtp][FAST-30%] error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to verify OTP" });
  }
};
