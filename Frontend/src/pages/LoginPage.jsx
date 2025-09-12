import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthProvider";

export default function LoginPage() {
  const { loginUser, sendOtp, verifyOtp } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("login"); // "login" or "otp"
  const [loading, setLoading] = useState(false);

  // Step 1: Firebase login + send OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginUser(email, password); // Only credential check
      await sendOtp(email); // Send OTP from backend
      setStep("otp");
      alert("OTP sent to your email!");
    } catch (err) {
      console.error(err);
      alert("Login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await verifyOtp(email, otp);
      if (res.success) {
        alert("✅ Login successful!");
        navigate("/"); // Redirect after OTP verified
      } else {
        alert("❌ " + res.message);
      }
    } catch (err) {
      console.error(err);
      alert("OTP verification failed");
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <p className="text-sm text-gray-600 text-center mt-4">
              Don’t have an account?{" "}
              <Link to="/request" className="text-blue-600 hover:underline">
                Request To Create an Account
              </Link>
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-center mb-6">Verify OTP</h2>
            <form onSubmit={handleOtpVerify} className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Enter OTP sent to {email}
              </label>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded-lg"
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
