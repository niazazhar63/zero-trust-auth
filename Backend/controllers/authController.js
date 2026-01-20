import nodemailer from "nodemailer";
import crypto from "crypto";
import Otp from "../models/otpModel.js";
import Risk from "../models/riskModel.js";
import jwt from "jsonwebtoken";
import { calculateRiskScore } from "../utils/riskEngine.js";

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 3;
const GENERIC_MESSAGE = "If the email exists, an OTP has been sent.";

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

transporter.verify((err) => { if (err) console.error("SMTP error:", err); });

export const sendOtp = async (req, res) => {
  try {
    const { email, riskData } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    // Fetch last risk record
    let lastRisk = await Risk.findOne({ email }).sort({ createdAt: -1 });
    let isNewUser = false;

    if (!lastRisk) {
      // New user → create record and mark first login
      lastRisk = await Risk.create({
        email,
        isFirstLogin: true,
        riskLevel: "medium",
        failedOtpCount: 0,
        lastLoginAt: new Date(),
      });
      isNewUser = true;
    }

    // Check if currently banned
    if (lastRisk.bannedUntil && new Date(lastRisk.bannedUntil) > new Date()) {
      return res.status(429).json({
        success: false,
        message: "You are temporarily blocked due to high risk.",
        bannedUntil: lastRisk.bannedUntil,
      });
    }

    // Determine risk
    const trustedDevices = (await Risk.find({ email, isTrustedDevice: true }).lean())
      .map(d => d.deviceId)
      .filter(Boolean);

    let riskRes = { riskLevel: lastRisk.riskLevel || "low" };
    if (riskData && !isNewUser && !lastRisk.isFirstLogin) {
      const calc = calculateRiskScore(riskData, lastRisk, trustedDevices);
      riskRes = { riskLevel: calc.riskLevel, riskScore: calc.riskScore, reason: calc.reason };
    }

    // Determine if OTP is required
    const otpRequired = isNewUser || lastRisk.isFirstLogin || riskRes.riskLevel === "medium";

    // Low-risk returning user → skip OTP
    if (!otpRequired) {
      return res.json({ success: true, skipOtp: true, message: "Low risk — OTP not required" });
    }

    // Medium risk / first login → send OTP
    const otp = generateOtp();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    await Otp.deleteMany({ email });
    await Otp.create({
      email,
      otp: hashedOtp,
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
    });

    try {
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP is ${otp}. It expires in 5 minutes.`,
      });
    } catch (mailErr) {
      console.error("Error sending OTP:", mailErr);
    }

    return res.status(202).json({ success: true, message: GENERIC_MESSAGE });

  } catch (err) {
    console.error("[sendOtp] error:", err);
    return res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp, riskData } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP required" });

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    const record = await Otp.findOne({ email });
    const lastRisk = await Risk.findOne({ email }).sort({ createdAt: -1 });

    if (!record || record.expiresAt < Date.now()) {
      await Otp.deleteMany({ email });
      if (lastRisk) { lastRisk.failedOtpCount++; await lastRisk.save(); }
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      await Otp.deleteMany({ email });
      if (lastRisk) { lastRisk.failedOtpCount = 0; await lastRisk.save(); }
      return res.status(429).json({ success: false, message: "Too many attempts. Request a new OTP." });
    }

    if (record.otp !== hashedOtp) {
      await Otp.updateOne({ email }, { $inc: { attempts: 1 } });
      if (lastRisk) {
        lastRisk.failedOtpCount++;
        if (lastRisk.failedOtpCount >= OTP_MAX_ATTEMPTS) {
          lastRisk.bannedUntil = new Date(Date.now() + 15 * 60 * 1000);
          lastRisk.riskLevel = "high";
          lastRisk.reason = "Too many failed OTP attempts — banned";
        }
        await lastRisk.save();
      }
      const left = OTP_MAX_ATTEMPTS - (record.attempts + 1);
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${left > 0 ? `${left} attempts left.` : "No attempts left."}`,
      });
    }

    // ✅ OTP correct → mark first login done
    await Otp.deleteMany({ email });
    if (lastRisk) {
      lastRisk.failedOtpCount = 0;
      lastRisk.bannedUntil = null;
      lastRisk.riskLevel = "low";
      lastRisk.lastLoginAt = new Date();
      lastRisk.isTrustedDevice = true;
      lastRisk.isFirstLogin = false;
      lastRisk.deviceId = riskData?.deviceId || lastRisk.deviceId;
      lastRisk.userAgent = riskData?.deviceInfo?.userAgent || lastRisk.userAgent;
      lastRisk.ip = riskData?.ip || lastRisk.ip;
      await lastRisk.save();
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    return res.json({ success: true, token });

  } catch (err) {
    console.error("[verifyOtp] error:", err);
    return res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
};


/**
 * GET USER DETAILS BY EMAIL
 */
export const getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await Request.findOne({ email }).select("name email role");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Error fetching user by email:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
