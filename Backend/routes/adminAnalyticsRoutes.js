import express from "express";
import Risk from "../models/riskModel.js"; // ✅ corrected import

const router = express.Router();

// --- 1️⃣ Risk Level Distribution ---
router.get("/risk-distribution", async (req, res) => {
  try {
    const result = await Risk.aggregate([
      { $group: { _id: "$riskLevel", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json(result);
  } catch (error) {
    console.error("Error fetching risk distribution:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// --- 2️⃣ Login Attempts Over Time ---
router.get("/login-trend", async (req, res) => {
  try {
    const result = await Risk.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(result);
  } catch (error) {
    console.error("Error fetching login trend:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
