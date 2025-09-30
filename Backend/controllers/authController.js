// authController.js (DEMO slow-capable version)
// WARNING: This file includes demo-only intentional slow operations.
// DO NOT deploy DEMO_SLOW_AUTH=true to production or any public environment.

import nodemailer from "nodemailer";
import crypto from "crypto";
import Otp from "../models/otpModel.js";
import jwt from "jsonwebtoken";

// --- CONFIG ---
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const OTP_MAX_ATTEMPTS = 3;

// --- helper sleep ---
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// --- transporter factory (use mailtrap/ethereal for demo) ---
const getTransporter = () => {
  const host = process.env.SMTP_HOST || "smtp.mailtrap.io";
  const port = Number(process.env.SMTP_PORT || 2525);
  const auth = {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  };

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth,
  });
};

const transporter = getTransporter();

// --- OTP util ---
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// --- Send OTP (slow if DEMO_SLOW_AUTH=true) ---
export const sendOtp = async (req, res) => {
  const start = Date.now();
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    // create OTP + hash
    const otp = generateOtp();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // intentionally remove old OTPs (slow DB op if many docs)
    await Otp.deleteMany({ email });

    // create (attempts starts 0)
    await Otp.create({
      email,
      otp: hashedOtp,
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
    });

    console.log(`[sendOtp] created OTP (hashed) for ${email} - ${Date.now() - start}ms`);

    // Prepare mail
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    };

    // DEMO slow behavior (controlled by env var)
    if (process.env.DEMO_SLOW_AUTH === "true") {
      // 1) Artificial CPU load (simulate heavy crypto)
      // NOTE: This loop is intentionally heavy for demo only.
      // Keep moderate counts depending on your machine.
      for (let i = 0; i < 4_000_000; i++) {
        // no-op to burn CPU
        const x = i * 2;
      }

      // 2) Artificial network latency simulation
      await sleep(3000); // 3 seconds

      // 3) Send mail synchronously (await) so request waits for SMTP
      // In demo mode we intentionally await this to make endpoint slow.
      await transporter.sendMail(mailOptions);
      console.log(`[sendOtp][DEMO] mail sent for ${email}`);
    } else {
      // FAST mode: fire-and-forget
      transporter.sendMail(mailOptions)
        .then(info => console.log(`[sendOtp] mail sent: ${info.response}`))
        .catch(err => console.error(`[sendOtp] mail error:`, err));
    }

    // respond (in demo we still respond after awaiting mail)
    return res.status(202).json({ success: true, message: "OTP requested (check email)" });
  } catch (err) {
    console.error("[sendOtp] error:", err);
    return res.status(500).json({ success: false, message: "Failed to process OTP request" });
  } finally {
    console.log(`[sendOtp] total time: ${Date.now() - start}ms`);
  }
};

// --- Verify OTP (slow if DEMO_SLOW_AUTH=true) ---
export const verifyOtp = async (req, res) => {
  const start = Date.now();
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP are required" });

    // DEMO slow: artificial DB latency + expensive comparison
    if (process.env.DEMO_SLOW_AUTH === "true") {
      // simulate DB slowness
      await sleep(2000); // 2 seconds

      // intentionally inefficient DB fetch (fetch array then JS-filter)
      const all = await Otp.find({ email });
      const hashedOtpDemo = crypto.createHash("sha256").update(otp).digest("hex");
      const found = all.find(r => r.otp === hashedOtpDemo);

      if (!found) {
        // increment attempts if record exist (inefficient separate call)
        if (all.length > 0) {
          await Otp.updateOne({ _id: all[0]._id }, { $inc: { attempts: 1 } });
        }
        return res.status(400).json({ success: false, message: "Invalid OTP" });
      }

      // expiry check
      if (found.expiresAt < Date.now()) {
        await Otp.deleteMany({ email });
        return res.status(400).json({ success: false, message: "OTP expired" });
      }

      // consume OTP (deleteMany used for slowness)
      await Otp.deleteMany({ email });

    } else {
      // FAST path: single efficient DB operation
      const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

      // find record
      const record = await Otp.findOne({ email });
      if (!record) return res.status(400).json({ success: false, message: "Invalid OTP or expired" });

      if (record.expiresAt < Date.now()) {
        await Otp.deleteMany({ email });
        return res.status(400).json({ success: false, message: "Invalid OTP or expired" });
      }

      if (record.attempts >= OTP_MAX_ATTEMPTS) {
        await Otp.deleteMany({ email });
        return res.status(429).json({ success: false, message: "Too many attempts" });
      }

      if (record.otp !== hashedOtp) {
        await Otp.updateOne({ email }, { $inc: { attempts: 1 } });
        return res.status(400).json({ success: false, message: "Invalid OTP" });
      }

      // atomic consume
      await Otp.findOneAndDelete({ email, otp: hashedOtp });
    }

    // Issue JWT
    const payload = { email }; // in real app prefer userId: { sub: userId }
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    console.log(`[verifyOtp] success for ${email} - ${Date.now() - start}ms`);
    return res.json({ success: true, token });
  } catch (err) {
    console.error("[verifyOtp] error:", err);
    return res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
};
