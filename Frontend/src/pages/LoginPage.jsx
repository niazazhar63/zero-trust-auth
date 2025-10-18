import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthProvider";
import toast from "react-hot-toast";
import axios from "axios";
import { collectRiskData } from "../utils/collectRiskData";

const API_URL = import.meta.env.VITE_BACKEND_URL;

export default function LoginPage() {
  const { loginUser, sendOtp, verifyOtp } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("login");
  const [loading, setLoading] = useState(false);

  // Step 1: Handle login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Try login (Firebase auth)
      await loginUser(email, password);

      // Collect risk data and send to backend
      const riskData = await collectRiskData();
      const { data: riskRes } = await axios.post(`${API_URL}/api/risk/assess`, {
        email,
        riskData,
      });

      const riskLevel = riskRes?.riskLevel || "low";

      if (riskLevel === "low") {
        navigate("/");
      } else if (riskLevel === "medium") {
        toast("⚠️ Medium Risk — OTP verification required.");
        await sendOtp(email);
        setStep("otp");
      } else if (riskLevel === "high") {
        toast.error("🚫 High Risk detected. Login blocked for 15 minutes.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle OTP verification (only for medium risk)
  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const otpRes = await verifyOtp(email, otp);
      if (!otpRes.success) {
        toast.error("Invalid OTP");
        return;
      }

      toast.success("🎉 OTP verified! Login successful.");
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error("Error verifying OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {step === "login" ? (
          <>
            <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                className="w-full border p-2 rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full border p-2 rounded"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>

              <div className="text-center text-sm mt-3">
                <Link
                  to="/request"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Don’t have an account? Request here
                </Link>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-center mb-6">Verify OTP</h2>
            <form onSubmit={handleOtpVerify} className="space-y-4">
              <input
                type="text"
                placeholder="Enter OTP"
                className="w-full border p-2 rounded"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
