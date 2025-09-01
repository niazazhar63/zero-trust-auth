import express from "express";
import adminLogin, { adminCreateUser } from "../controllers/adminController.js";
import { auth } from "../middleware/auth.js";

const adminRouter = express.Router();

adminRouter.post("/login", adminLogin);
adminRouter.post("/create-user",auth, adminCreateUser);

export default adminRouter;
