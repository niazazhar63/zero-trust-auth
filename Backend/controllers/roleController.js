import express from "express";
import User from "../models/userModel.js"; // adjust the path if needed

const router = express.Router();

// ✅ GET user info by email
router.get("/user/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      name: user.name,
      email: user.email,
      role: user.role,
      photoURL: user.photoURL || null,
    });
  } catch (error) {
    console.error("Error fetching user by email:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
