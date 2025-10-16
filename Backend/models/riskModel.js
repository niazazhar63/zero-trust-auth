// models/riskModel.js
import mongoose from "mongoose";

const riskSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    ip: { type: String },
    userAgent: { type: String },
    location: {
      country: String,
      region: String,
      city: String,
      latitude: Number,
      longitude: Number,
    },
    riskScore: Number,
    riskLevel: { type: String, enum: ["low", "medium", "high"], default: "low" },
    reason: String,
  },
  { timestamps: true }
);

export default mongoose.model("Risk", riskSchema);
