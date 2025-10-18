// controllers/authController.js
import nodemailer from "nodemailer";
import crypto from "crypto";
import Otp from "../models/otpModel.js";
import Risk from "../models/riskModel.js";
import jwt from "jsonwebtoken";
import { calculateRiskScore } from "../utils/riskEngine.js";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const OTP_MAX_ATTEMPTS = 3;
const GENERIC_MESSAGE = "If the email exists, an OTP has been sent.";

// helper
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((err) => {
  if (err) console.error("SMTP Connection error:", err);
  else console.log("SMTP ready");
});

/**
 * sendOtp
 * - Accepts: { email, riskData? }
 * - Behavior:
 *    - If user is currently banned -> return 429 with ban info
 *    - If riskData provided, evaluate risk; otherwise, fallback to last risk
 *    - If assessment results in HIGH => return blocked
 *    - If MEDIUM => send OTP (existing behavior)
 *    - If LOW => optionally skip OTP (but frontend should use /api/risk/assess to decide)
 */
export const sendOtp = async (req, res) => {
  try {
    const { email, riskData } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const last = await Risk.findOne({ email }).sort({ createdAt: -1 }).lean();

    // If user currently banned
    if (last?.bannedUntil && new Date(last.bannedUntil) > new Date()) {
      return res.status(429).json({
        success: false,
        message: "User is temporarily banned from logging in",
        bannedUntil: last.bannedUntil,
      });
    }

    // If riskData provided, compute risk here (defensive)
    let riskRes = { riskLevel: "medium" };
    if (riskData) {
      const calc = calculateRiskScore(riskData, last);
      riskRes = { riskLevel: calc.riskLevel, riskScore: calc.riskScore, reason: calc.reason };
    } else if (last) {
      riskRes = { riskLevel: last.riskLevel, riskScore: last.riskScore, reason: last.reason };
    }

    if (riskRes.riskLevel === "high") {
      // apply ban record
      const bannedUntil = new Date(Date.now() + 15 * 60 * 1000);
      await Risk.create({
        email,
        ip: riskData?.ip || last?.ip,
        userAgent: riskData?.deviceInfo?.userAgent || last?.userAgent,
        deviceId: riskData?.deviceId || last?.deviceId,
        bannedUntil,
        lastLoginAt: riskData?.timestamp ? new Date(riskData.timestamp) : new Date(),
        riskScore: riskRes.riskScore || 100,
        riskLevel: "high",
        reason: riskRes.reason || "High risk detected - banned",
      });

      return res.status(429).json({
        success: false,
        message: "High risk detected. Login blocked for 15 minutes",
        bannedUntil,
      });
    }

    // For medium risk -> send OTP
    if (riskRes.riskLevel === "medium") {
      const otp = generateOtp();
      const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

      // delete previous OTPs for email
      await Otp.deleteMany({ email });

      await Otp.create({
        email,
        otp: hashedOtp,
        expiresAt: Date.now() + OTP_TTL_MS,
        attempts: 0,
      });

      // send mail (best-effort)
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
    }

    // For low risk: indicate OTP not required (frontend should treat as logged in)
    return res.json({ success: true, message: "Low risk — OTP not required", skipOtp: true });
  } catch (err) {
    console.error("[sendOtp] error:", err);
    return res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

/**
 * verifyOtp
 * - Accepts: { email, otp, riskData? }
 * - Behavior:
 *   - Validate OTP
 *   - If invalid -> increment failedOtpCount on Risk, and if exceeds threshold -> ban user
 *   - If valid -> reset failedOtpCount and issue JWT
 */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp, riskData } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP required" });

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    const record = await Otp.findOne({ email }).lean();
    const lastRisk = await Risk.findOne({ email }).sort({ createdAt: -1 });

    // if missing or expired
    if (!record || record.expiresAt < Date.now()) {
      await Otp.deleteMany({ email });
      // increase failedOtpCount defensively
      if (lastRisk) {
        lastRisk.failedOtpCount = (lastRisk.failedOtpCount || 0) + 1;
        await lastRisk.save();
      }
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    // exceeded attempts check
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      await Otp.deleteMany({ email });
      // mark failed attempts on Risk
      if (lastRisk) {
        lastRisk.failedOtpCount = 0; // reset or keep? we reset here because record expired
        await lastRisk.save();
      }
      return res.status(429).json({ success: false, message: "Too many attempts. Request a new OTP." });
    }

    // If OTP mismatch
    if (record.otp !== hashedOtp) {
      await Otp.updateOne({ email }, { $inc: { attempts: 1 } });
      // increment failedOtpCount in Risk (create or update)
      if (lastRisk) {
        lastRisk.failedOtpCount = (lastRisk.failedOtpCount || 0) + 1;
        // if failedOtpCount reaches threshold, ban user
        if (lastRisk.failedOtpCount >= OTP_MAX_ATTEMPTS) {
          lastRisk.bannedUntil = new Date(Date.now() + 15 * 60 * 1000);
          lastRisk.riskLevel = "high";
          lastRisk.reason = "Too many failed OTP attempts — banned";
        }
        await lastRisk.save();
      } else {
        await Risk.create({
          email,
          failedOtpCount: 1,
          riskLevel: "medium",
          reason: "Failed OTP attempt",
          lastLoginAt: new Date(),
        });
      }

      const left = OTP_MAX_ATTEMPTS - (record.attempts + 1);
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${left > 0 ? `${left} attempts left.` : "No attempts left."}`,
      });
    }

    // OTP is valid
    await Otp.deleteMany({ email });

    // Reset or store success in Risk
    if (lastRisk) {
      lastRisk.failedOtpCount = 0;
      lastRisk.bannedUntil = null;
      lastRisk.riskLevel = lastRisk.riskLevel === "high" ? "medium" : lastRisk.riskLevel;
      lastRisk.lastLoginAt = new Date();
      await lastRisk.save();
    } else {
      await Risk.create({
        email,
        failedOtpCount: 0,
        riskLevel: "low",
        reason: "OTP verified",
        lastLoginAt: new Date(),
      });
    }

    // Generate JWT (1 hour)
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    return res.json({ success: true, token });
  } catch (err) {
    console.error("[verifyOtp] error:", err);
    return res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
};
