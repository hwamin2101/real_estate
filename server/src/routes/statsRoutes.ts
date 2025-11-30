import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { getStats } from "../controllers/statsControllers";

const router = express.Router();

router.get("/", authMiddleware(["manager"]), getStats);

export default router;
