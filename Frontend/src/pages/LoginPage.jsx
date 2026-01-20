import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthProvider";
import toast from "react-hot-toast";
import { collectRiskData } from "../utils/collectRiskData";

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
      // 1️⃣ Firebase login or your auth logic
      await loginUser(email, password);

      // 2️⃣ Collect device & risk info
      const riskData = await collectRiskData();

      // 3️⃣ Send OTP or check if OTP needed
      // Make sure sendOtp returns the backend response (not axios wrapper with data destructure)
      const riskRes = await sendOtp(email, riskData);

      if (riskRes.skipOtp) {
        // Low-risk returning user → skip OTP
        navigate("/");
      } else {
        // OTP required (first login or medium risk)
        toast("⚠️ OTP required for first login or medium risk.");
        setStep("otp");
      }

    } catch (err) {
      console.error(err);
      toast.error("Login failed: " + (err?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle OTP verification
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
