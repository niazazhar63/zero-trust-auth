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
import { useNavigate } from "react-router-dom"; // 🔹 Needed for redirect

const auth = getAuth(app);
const API_URL = import.meta.env.VITE_BACKEND_URL;

export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState(null); // 🔹 store login session info
  const navigate = useNavigate(); // 🔹 for redirect

  const fetchUserRole = async (email) => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/user/${email}`);
      return res.data?.role || null;
    } catch (err) {
      console.error("Error fetching user role:", err);
      return null;
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
        const role = await fetchUserRole(email);
        localStorage.setItem("token", userCred.user.accessToken);
        setUser({ email, role });
        setSessionInfo(riskData); // 🔹 save session info for checking
        localStorage.setItem("sessionInfo", JSON.stringify(riskData)); // 🔹 persist
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
      const res = await axios.post(`${API_URL}/api/auth/verify-otp`, { email, otp });
      if (res.data.success) {
        const role = await fetchUserRole(email);
        localStorage.setItem("token", res.data.token);
        setUser({ email, role });
        const riskData = await collectRiskData();
        setSessionInfo(riskData);
        localStorage.setItem("sessionInfo", JSON.stringify(riskData));
      }
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const logOut = () => {
    setUser(null);
    setSessionInfo(null);
    localStorage.removeItem("token");
    localStorage.removeItem("sessionInfo");
    navigate("/login"); // 🔹 redirect
    return signOut(auth);
  };

  // 🔹 Periodic session check
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!user) return; // no user logged in
      try {
        const currentData = await collectRiskData();
        const savedData = JSON.parse(localStorage.getItem("sessionInfo"));
        if (
          savedData &&
          (savedData.ip !== currentData.ip ||
           savedData.device !== currentData.device ||
           savedData.location !== currentData.location)
        ) {
          toast.error("⚠️ Session changed! You have been logged out.");
          logOut();
        }
      } catch (err) {
        console.error("Session check failed:", err);
      }
    }, 5000); //

    return () => clearInterval(interval);
  }, [user]);

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

  return <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
