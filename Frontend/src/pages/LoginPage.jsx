import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthProvider";
import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL;

export default function LoginPage() {
  const { loginUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("login"); // login → otp
  const [loading, setLoading] = useState(false);

  // ✅ Step 1: Email + Password Login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Firebase signIn
      const userCred = await loginUser(email, password);
      console.log("Firebase Login Success:", userCred.user);

      // Backend এ OTP পাঠানোর API call (axios দিয়ে)
      await axios.post(`${API_URL}/api/auth/send-otp`, { email });

      setStep("otp"); // OTP form দেখাও
    } catch (error) {
      console.error("Login error:", error.message);
      alert("Login failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Step 2: OTP Verify
  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/verify-otp`, { email, otp });

      if (res.data.success) {
        alert("✅ Login successful!");
        localStorage.setItem("token", res.data.token); // JWT save
        navigate("/"); // Dashboard এ redirect
      } else {
        alert("❌ " + res.data.message);
      }
    } catch (error) {
      console.error("OTP verify error:", error.message);
      alert("Something went wrong while verifying OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {step === "login" && (
          <>
            <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Enter your password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <p className="text-sm text-gray-600 text-center mt-4">
              Don’t have an account?{" "}
              <Link to={"/request"} className="text-blue-600 hover:underline">
                Request To Create an Account
              </Link>
            </p>
          </>
        )}

        {step === "otp" && (
          <>
            <h2 className="text-2xl font-bold text-center mb-6">Verify OTP</h2>
            <form onSubmit={handleOtpVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Enter OTP sent to {email}
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  placeholder="Enter OTP"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
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
