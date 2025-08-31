import express from "express"
import { approveRequest, createRequest, getRequests, rejectRequest } from "../controllers/requestController.js";
import { auth } from "../middleware/auth.js";

const RequestRouter = express.Router();

RequestRouter.post("/request-access", createRequest);
RequestRouter.get("/requests",auth, getRequests);
RequestRouter.put("/approve/:id", auth, approveRequest)
RequestRouter.put("/reject/:id", auth, rejectRequest)

export default RequestRouter;