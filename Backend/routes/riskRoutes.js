// routes/riskRoutes.js
import express from "express";
import { assessRisk } from "../controllers/riskControllers.js";

const RiskRouter = express.Router();

RiskRouter.post("/assess", assessRisk);

export default RiskRouter;