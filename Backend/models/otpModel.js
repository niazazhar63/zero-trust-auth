import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true }, // hashed OTP
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 }, // NEW: track attempts
});

export const Otp = mongoose.model("Otp", otpSchema);
export default Otp;
