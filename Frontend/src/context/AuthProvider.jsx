import { createContext, useState, useEffect } from "react";
import app from "../firebase/firebase.config";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import axios from "axios";
import { collectRiskData } from "../utils/collectRiskData";
import toast from "react-hot-toast";

const auth = getAuth(app);
const API_URL = import.meta.env.VITE_BACKEND_URL;

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Only set after OTP verify
  const [loading, setLoading] = useState(true); // start as true while checking persistence

  // 2️⃣ Send OTP
  const sendOtp = async (email) => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/auth/send-otp`, { email });
      return res.data;
    } finally {
      setLoading(false);
    }
  };
  // 1️⃣ Firebase credential check (login)
  const loginUser = async (email, password) => {
    setLoading(true);
    try {
      // Step 1: Firebase login to verify credentials
      const userCred = await signInWithEmailAndPassword(auth, email, password);

      // Step 2: Collect risk data and send to backend
      const riskData = await collectRiskData();
      const { data: riskRes } = await axios.post(`${API_URL}/api/risk/assess`, {
        email,
        riskData,
      });

      // Step 3: Handle based on risk level
      if (riskRes.riskLevel === "high") {
        toast.error("🚫 High risk detected! Login blocked for 15 minutes.");
        return { success: false, blocked: true };
      } else if (riskRes.riskLevel === "medium") {
        toast("⚠️ Medium risk: OTP verification required.");
        await sendOtp(email);
        return { success: false, otpRequired: true };
      } else {
        // low risk → allow login directly
        localStorage.setItem("token", userCred.user.accessToken);
        setUser({ email });
        toast.success("✅ Low risk: Logged in successfully!");
        return { success: true };
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error(err.message || "Login failed");
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // 3️⃣ Verify OTP
  const verifyOtp = async (email, otp) => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/auth/verify-otp`, {
        email,
        otp,
      });
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        setUser({ email }); // ✅ Only after OTP verification
      }
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  // 4️⃣ Logout
  const logOut = () => {
    setUser(null);
    localStorage.removeItem("token");
    return signOut(auth);
  };

  // 5️⃣ Persist login on refresh
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Optional: you can decode token or call backend to verify
      const savedEmail = JSON.parse(atob(token.split(".")[1])).email; // if JWT contains email
      setUser({ email: savedEmail });
    }

    // Optional: keep Firebase state synced
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser((prev) => prev || { email: firebaseUser.email });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const authInfo = {
    user,
    loading,
    loginUser,
    sendOtp,
    verifyOtp,
    logOut,
  };

  return (
    <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
