// controllers/riskController.js
import Risk from "../models/riskModel.js";
import { calculateRiskScore } from "../utils/riskEngine.js";

export const assessRisk = async (req, res) => {
  try {
    const { email, riskData } = req.body;
    if (!email || !riskData)
      return res.status(400).json({ success: false, message: "Missing email or risk data" });

    const lastLogin = await Risk.findOne({ email }).sort({ createdAt: -1 });

    const { riskScore, riskLevel, reason } = calculateRiskScore(riskData, lastLogin);

    const newRisk = await Risk.create({
      email,
      ip: riskData.ip,
      userAgent: riskData.deviceInfo?.userAgent,
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

    return res.json({
      success: true,
      riskLevel,
      riskScore,
      reason,
    });
  } catch (err) {
    console.error("[assessRisk] error:", err);
    return res.status(500).json({ success: false, message: "Risk assessment failed" });
  }
};
