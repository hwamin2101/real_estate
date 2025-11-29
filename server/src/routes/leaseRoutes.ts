import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { getLeasePayments, getLeases, getLeaseById} from "../controllers/leaseControllers";

const router = express.Router();

router.get("/", authMiddleware(["manager", "tenant"]), getLeases);
router.get(
  "/:id/payments",
  authMiddleware(["manager", "tenant"]),
  getLeasePayments
);
router.get(
  "/:id",
  authMiddleware(["manager", "tenant"]),
  getLeaseById
);

export default router;
