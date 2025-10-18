import express from "express";
import { sendOtp, verifyOtp } from "../controllers/authController.js";


const authRouter = express.Router();

authRouter.post("/send-otp", sendOtp)
authRouter.post("/verify-otp", verifyOtp)

export default authRouter;