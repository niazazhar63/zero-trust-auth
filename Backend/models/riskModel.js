import mongoose from "mongoose";

const riskSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true },
    ip: { type: String },
    userAgent: { type: String },
    deviceId: { type: String }, // optional device fingerprint / id
    isTrustedDevice: { type: Boolean, default: false },
    failedOtpCount: { type: Number, default: 0 },
    bannedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date },
    location: {
      country: String,
      region: String,
      city: String,
      latitude: Number,
      longitude: Number,
    },
    riskScore: { type: Number, default: 0 },
    riskLevel: { type: String, enum: ["low", "medium", "high"], default: "low" },
    reason: String,
    isFirstLogin: { type: Boolean, default: true }, // NEW: track first login
  },
  { timestamps: true }
);

export default mongoose.model("Risk", riskSchema);
