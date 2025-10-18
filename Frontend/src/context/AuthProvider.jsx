import { createContext, useState, useEffect } from "react";
import app from "../firebase/firebase.config";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import axios from "axios";

const auth = getAuth(app);
const API_URL = import.meta.env.VITE_BACKEND_URL;

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Only set after OTP verify
  const [loading, setLoading] = useState(true); // start as true while checking persistence

  // 1️⃣ Firebase credential check (login)
  const loginUser = (email, password) => {
    setLoading(true);
    return signInWithEmailAndPassword(auth, email, password)
      .then((userCred) => {
        return userCred.user; // ✅ Do NOT set context user yet
      })
      .finally(() => setLoading(false));
  };

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

  // 3️⃣ Verify OTP
  const verifyOtp = async (email, otp) => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/auth/verify-otp`, { email, otp });
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

  return <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
