// routes/application.routes.ts
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler"; // ← Thêm dòng này
import {
  createApplication,
  listApplications,
  updateApplicationStatus,
  getApplicationById,
} from "../controllers/applicationControllers";
import { getApplicationPaymentSchedule } from "../controllers/leaseControllers";

const router = express.Router();

router.post("/", authMiddleware(["tenant"]), asyncHandler(createApplication));
router.put("/:id/status", authMiddleware(["manager"]), asyncHandler(updateApplicationStatus));
router.get("/", authMiddleware(["manager", "tenant"]), asyncHandler(listApplications));
router.get("/:id", authMiddleware(["tenant", "manager"]), asyncHandler(getApplicationById));
router.get(
  "/:id/payment-schedule",
  authMiddleware(["manager", "tenant"]),
  getApplicationPaymentSchedule
);


export default router;