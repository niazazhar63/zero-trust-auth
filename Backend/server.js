import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./config/db.js";
import adminRouter from "./routes/adminRoute.js";
import RequestRouter from "./routes/requestRoutes.js";
import { testProvision } from "./controllers/scimControllers.js";
import authRouter from "./routes/authRoutes.js";
import RiskRouter from "./routes/riskRoutes.js";
import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
await connectDB();

app.get("/", (req, res) => {
  res.send("api is working");
});

app.use("/api/admin", adminRouter);
app.use("/api/request", RequestRouter);
app.use("/api/auth", authRouter);
app.use("/api/risk", RiskRouter)
app.use("/api/admin/analytics", adminAnalyticsRoutes)
// app.use("/api", testProvision)

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
