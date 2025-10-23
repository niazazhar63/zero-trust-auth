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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch role from backend
  const fetchUserRole = async (email) => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/user/${email}`);
      if (res.data?.role) {
        return res.data.role;
      }
      return null // default fallback
    } catch (err) {
      console.error("Error fetching user role:", err);
      return null
    }
  };

  const sendOtp = async (email) => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/auth/send-otp`, { email });
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (email, password) => {
    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const riskData = await collectRiskData();
      const { data: riskRes } = await axios.post(`${API_URL}/api/risk/assess`, {
        email,
        riskData,
      });

      if (riskRes.riskLevel === "high") {
        toast.error("🚫 High risk detected! Login blocked for 15 minutes.");
        return { success: false, blocked: true };
      } else if (riskRes.riskLevel === "medium") {
        toast("⚠️ Medium risk: OTP verification required.");
        await sendOtp(email);
        return { success: false, otpRequired: true };
      } else {
        const role = await fetchUserRole(email); // 🔹 Fetch role
        localStorage.setItem("token", userCred.user.accessToken);
        setUser({ email, role }); // 🔹 Save role with user
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

  const verifyOtp = async (email, otp) => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/auth/verify-otp`, {
        email,
        otp,
      });
      if (res.data.success) {
        const role = await fetchUserRole(email); // 🔹 Fetch role after OTP success
        localStorage.setItem("token", res.data.token);
        setUser({ email, role });
      }
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const logOut = () => {
    setUser(null);
    localStorage.removeItem("token");
    return signOut(auth);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        if (decoded?.email) {
          fetchUserRole(decoded.email).then((role) => {
            setUser({ email: decoded.email, role });
          });
        }
      } catch (e) {
        console.error("Token decode failed:", e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        fetchUserRole(firebaseUser.email).then((role) => {
          setUser({ email: firebaseUser.email, role });
        });
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
