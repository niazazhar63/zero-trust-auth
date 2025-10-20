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

/**
 * SEND OTP / LOGIN HANDLER
 */
export const sendOtp = async (req, res) => {
  try {
    const { email, riskData } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const last = await Risk.findOne({ email }).sort({ createdAt: -1 });

    // Block login if currently banned
    if (last?.bannedUntil && new Date(last.bannedUntil) > new Date()) {
      return res.status(429).json({
        success: false,
        message: "You are temporarily blocked due to high risk.",
        bannedUntil: last.bannedUntil,
      });
    }

    // Fetch only trusted devices for this account
    const trustedDeviceRecords = await Risk.find({ email, isTrustedDevice: true }).lean();
    const trustedDevices = trustedDeviceRecords.map(d => d.deviceId).filter(Boolean);

    let riskRes = { riskLevel: "medium" };
    if (riskData) {
      const calc = calculateRiskScore(riskData, last, trustedDevices);
      riskRes = { riskLevel: calc.riskLevel, riskScore: calc.riskScore, reason: calc.reason };
    } else if (last) {
      riskRes = { riskLevel: last.riskLevel, riskScore: last.riskScore, reason: last.reason };
    }

    // High risk – block login and set 15-minute ban
    if (riskRes.riskLevel === "high") {
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

    // Medium risk – send OTP
    if (riskRes.riskLevel === "medium") {
      const otp = generateOtp();
      const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
      await Otp.deleteMany({ email });
      await Otp.create({ email, otp: hashedOtp, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });

      try {
        await transporter.sendMail({
          from: process.env.FROM_EMAIL || process.env.SMTP_USER,
          to: email,
          subject: "Your OTP Code",
          text: `Your OTP is ${otp}. It expires in 5 minutes.`,
        });
      } catch (mailErr) { console.error("Error sending OTP:", mailErr); }

      return res.status(202).json({ success: true, message: GENERIC_MESSAGE });
    }

    // Low risk – skip OTP
    return res.json({ success: true, message: "Low risk — OTP not required", skipOtp: true });
  } catch (err) {
    console.error("[sendOtp] error:", err);
    return res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

/**
 * VERIFY OTP HANDLER
 */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp, riskData } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP required" });

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    const record = await Otp.findOne({ email }).lean();
    const lastRisk = await Risk.findOne({ email }).sort({ createdAt: -1 });

    // Expired or missing OTP
    if (!record || record.expiresAt < Date.now()) {
      await Otp.deleteMany({ email });
      if (lastRisk) {
        lastRisk.failedOtpCount = (lastRisk.failedOtpCount || 0) + 1;
        await lastRisk.save();
      }
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    // Too many attempts
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      await Otp.deleteMany({ email });
      if (lastRisk) {
        lastRisk.failedOtpCount = 0;
        await lastRisk.save();
      }
      return res.status(429).json({ success: false, message: "Too many attempts. Request a new OTP." });
    }

    // Invalid OTP
    if (record.otp !== hashedOtp) {
      await Otp.updateOne({ email }, { $inc: { attempts: 1 } });
      if (lastRisk) {
        lastRisk.failedOtpCount = (lastRisk.failedOtpCount || 0) + 1;
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

    // Successful OTP
    await Otp.deleteMany({ email });

    if (lastRisk) {
      lastRisk.failedOtpCount = 0;
      lastRisk.bannedUntil = null;
      lastRisk.riskLevel = "low";
      lastRisk.lastLoginAt = new Date();
      lastRisk.isTrustedDevice = true;
      lastRisk.deviceId = riskData?.deviceId || lastRisk.deviceId;
      lastRisk.userAgent = riskData?.deviceInfo?.userAgent || lastRisk.userAgent;
      lastRisk.ip = riskData?.ip || lastRisk.ip;
      await lastRisk.save();
    } else {
      await Risk.create({
        email,
        failedOtpCount: 0,
        riskLevel: "low",
        lastLoginAt: new Date(),
        isTrustedDevice: true,
        deviceId: riskData?.deviceId,
        userAgent: riskData?.deviceInfo?.userAgent,
        ip: riskData?.ip,
      });
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    return res.json({ success: true, token });
  } catch (err) {
    console.error("[verifyOtp] error:", err);
    return res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
};
