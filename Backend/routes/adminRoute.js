import express from "express";
import adminLogin, { adminCreateUser, deleteUser, getAllUsers } from "../controllers/adminController.js";
import { auth } from "../middleware/auth.js";

const adminRouter = express.Router();

adminRouter.post("/login", adminLogin);
adminRouter.post("/create-user",auth, adminCreateUser);
adminRouter.get("/getAllUsers",auth, getAllUsers);
adminRouter.delete("/deleteUser/:email",auth, deleteUser);

export default adminRouter;