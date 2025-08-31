import express from "express";
import { testProvision } from "../controllers/scimControllers.js";

const router = express.Router();

router.post("/provision-test", testProvision);

export default router;
