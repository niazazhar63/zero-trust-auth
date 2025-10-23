import express from "express";
import { getUserByEmail, sendOtp, verifyOtp } from "../controllers/authController.js";


const authRouter = express.Router();

authRouter.post("/send-otp", sendOtp)
authRouter.post("/verify-otp", verifyOtp)
authRouter.get("/user/:email", getUserByEmail);

export default authRouter;