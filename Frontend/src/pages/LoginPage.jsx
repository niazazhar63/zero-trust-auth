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

  // Step 1: Login credentials
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginUser(email, password);
      await sendOtp(email);
      toast.success("OTP sent to your email!");
      setStep("otp");
    } catch (err) {
      console.error(err);
      toast.error("Login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & assess risk
  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const otpRes = await verifyOtp(email, otp);
      if (!otpRes.success) {
        toast.error("Invalid OTP");
        return;
      }

      const riskData = await collectRiskData();
      const { data: riskRes } = await axios.post(`${API_URL}/api/risk/assess`, {
        email,
        riskData,
      });

      if (riskRes.riskLevel === "high" || riskRes.riskLevel === "medium") {
        toast.error(
          `⚠️ ${riskRes.riskLevel.toUpperCase()} RISK detected — please verify again.`
        );
        await sendOtp(email);
        setStep("otp");
      } else {
        toast.success("🎉 Login successful — Low risk detected!");
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error during verification");
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