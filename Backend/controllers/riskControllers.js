// controllers/riskController.js
import Risk from "../models/riskModel.js";
import { calculateRiskScore } from "../utils/riskEngine.js";

/**
 * POST /api/risk/assess
 * Body: { email, riskData }
 *
 * Returns: { success, riskLevel, riskScore, reason, bannedUntil? }
 */
export const assessRisk = async (req, res) => {
  try {
    const { email, riskData } = req.body;
    if (!email || !riskData) {
      return res.status(400).json({ success: false, message: "Missing email or risk data" });
    }

    // fetch last known risk record for this user
    const last = await Risk.findOne({ email }).sort({ createdAt: -1 }).lean();

    // If user is currently banned, return immediate high risk + ban info
    if (last?.bannedUntil && new Date(last.bannedUntil) > new Date()) {
      return res.status(200).json({
        success: true,
        riskLevel: "high",
        riskScore: 100,
        reason: "User is temporarily banned",
        bannedUntil: last.bannedUntil,
      });
    }

    // Calculate risk
    const { riskScore, riskLevel, reason } = calculateRiskScore(riskData, last);

    // Determine if we must set a ban for high risk
    let bannedUntil = null;
    if (riskLevel === "high") {
      // Ban for 15 minutes
      bannedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }

    // Create new risk record
    const newRisk = await Risk.create({
      email,
      ip: riskData.ip,
      userAgent: riskData.deviceInfo?.userAgent,
      deviceId: riskData.deviceId || null,
      isTrustedDevice: false, // decision to mark trusted happens elsewhere (e.g., after user confirms)
      failedOtpCount: last?.failedOtpCount || 0,
      bannedUntil,
      lastLoginAt: riskData.timestamp ? new Date(riskData.timestamp) : new Date(),
      location: {
        country: riskData.country,
        region: riskData.region,
        city: riskData.city,
        latitude: riskData.latitude,
        longitude: riskData.longitude,
      },
      riskScore,
      riskLevel,
      reason,
    });

    const response = {
      success: true,
      riskLevel,
      riskScore,
      reason,
    };
    if (bannedUntil) response.bannedUntil = bannedUntil;

    return res.json(response);
  } catch (err) {
    console.error("[assessRisk] error:", err);
    return res.status(500).json({ success: false, message: "Risk assessment failed" });
  }
};
