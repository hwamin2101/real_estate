import express from "express";
import {
  getPropertyPerformance,
  getGeographicDistribution,
  getLeaseExpirationAlerts,
} from "../controllers/analyticsControllers";

const router = express.Router();

router.get("/property-performance", getPropertyPerformance);
router.get("/geographic-distribution", getGeographicDistribution);
router.get("/lease-expiration-alerts", getLeaseExpirationAlerts);

export default router;