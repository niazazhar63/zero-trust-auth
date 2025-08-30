import express from "express"
import { createRequest, getRequests } from "../controllers/requestController.js";
import { auth } from "../middleware/auth.js";

const RequestRouter = express.Router();

RequestRouter.post("/request-access", createRequest);
RequestRouter.get("/requests",auth, getRequests);

export default RequestRouter