import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createStripeCheckoutSession,
  stripeWebhook,
  createVNPayPayment,
  vnpayIPN,
  vnpayReturn,
} from "../controllers/paymentControllers";
import { webhookHandler } from "../utils/webhookHandler";

const router = express.Router();

// Stripe
router.post(
  "/applications/:id/pay/stripe",
  authMiddleware(["tenant"]),
  asyncHandler(createStripeCheckoutSession)
);



router.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  webhookHandler(stripeWebhook)
);



// VNPay
router.post("/vnpay", authMiddleware(["tenant"]), asyncHandler(createVNPayPayment));
router.get("/vnpay/ipn", asyncHandler(vnpayIPN));
router.get("/vnpay/return", asyncHandler(vnpayReturn)); // HOÀN HẢO

export default router;