// src/controllers/paymentControllers.ts
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import type { ReturnQueryFromVNPay } from 'vnpay';
import { vnpay } from "../utils/vnpay";
const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

/* =========================== STRIPE =========================== */

export const createStripeCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { id: applicationId } = req.params;
    const { paymentId } = req.body;

    if (!paymentId) return res.status(400).json({ message: "Thiếu paymentId" });

    const appId = Number(applicationId);
    const payId = Number(paymentId);

    const application = await prisma.application.findUnique({
      where: { id: appId },
      include: {
        tenant: true,
        property: true,
        lease: { include: { payments: { where: { id: payId } } } },
      },
    });

    if (!application?.lease) return res.status(404).json({ message: "Không tìm thấy hợp đồng" });

    const payment = application.lease.payments[0];
    if (!payment) return res.status(404).json({ message: "Không tìm thấy kỳ thanh toán" });
    if (payment.paymentStatus !== "Pending")
      return res.status(400).json({ message: "Kỳ này đã thanh toán hoặc không hợp lệ" });

    // Tạo hoặc lấy customer Stripe
    let customer = (await stripe.customers.list({ email: application.tenant.email, limit: 1 })).data[0];

    if (!customer) {
      customer = await stripe.customers.create({
        email: application.tenant.email,
        name: application.tenant.name,
        metadata: { cognitoId: application.tenantCognitoId },
      });
    }

const amountOverride = req.body.amountOverride;
const amountInVND = amountOverride
  ? Number(amountOverride)
  : Number(payment.amountDue);


    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer: customer.id,
      line_items: [
        {
          price_data: {
            currency: "vnd",
            product_data: {
              name: `Thanh toán tiền thuê - ${application.property.name}`,
              description: `Kỳ thanh toán: ${new Date(payment.dueDate).toLocaleDateString("vi-VN")}`,
            },
            unit_amount: Math.round(amountInVND), // Stripe nhận đơn vị đồng
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/tenants/payments/success?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/tenants/payments/success?stripe=fail`,
      metadata: {
        applicationId: applicationId,
        paymentId: paymentId.toString(),
        tenantId: application.tenantCognitoId,
      },
    });

    await prisma.payment.update({
      where: { id: payId },
      data: { stripePaymentId: session.id },
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    res.status(500).json({ message: error.message || "Lỗi tạo thanh toán Stripe" });
  }
};

export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  console.log("Headers:", req.headers);
console.log("Raw body length:", req.body.length);


  if (!sig || !webhookSecret) {
    console.warn("[Webhook] Missing signature or secret");
    res.status(200).send("OK");
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log(`[Webhook] Verified: ${event.type}`);
    console.log("[Webhook] Event type:", event.type);
    console.log("[Webhook] Event object:", event.data.object);

  } catch (err: any) {
    console.error(`[Webhook] Verification failed: ${err.message}`);
    res.status(200).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status === "paid") {
        const paymentId = session.metadata?.paymentId;

        if (paymentId) {
          await prisma.payment.update({
            where: { id: Number(paymentId) },
            data: {
              paymentStatus: "Paid",
              amountPaid: session.amount_total!,
              amountDue: session.amount_total!,
              paymentDate: new Date(),
              stripePaymentId: session.id,
            },
          });

          console.log(`[Webhook] Payment ${paymentId} → Paid`);
        }
      }
    }
  } catch (dbError: any) {
    console.error("[Webhook] DB error (still 200):", dbError.message);
  }

  // không return response
  res.status(200).json({ received: true });
};

/* =========================== VNPAY =========================== */

export const createVNPayPayment = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { id: Number(paymentId) },
      include: { lease: true },
    });

    if (!payment || payment.paymentStatus !== "Pending") {
      return res.status(400).json({ message: "Kỳ thanh toán không hợp lệ" });
    }

    const txnRef = `VNP${Date.now()}${paymentId}`;

    // amountDue là Decimal → chuyển thành number rồi nhân 100 (VNPAY tính bằng đồng)
    const amountInDong = Number(payment.amountDue) * 100;

    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: amountInDong,
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan tien thue HD${payment.leaseId} - ID ${paymentId}`,
      vnp_ReturnUrl: process.env.VNP_RETURN_URL!,
      vnp_IpAddr: (() => {
      const forwarded = req.headers["x-forwarded-for"];
      if (Array.isArray(forwarded)) return forwarded[0];
      if (typeof forwarded === "string") return forwarded.split(',')[0].trim();
      return req.ip || "127.0.0.1";
    })(),
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { vnpayTxnRef: txnRef },
    });

    res.json({ paymentUrl });
  } catch (error: any) {
    console.error("VNPay create error:", error);
    res.status(500).json({ message: "Lỗi tạo thanh toán VNPay" });
  }
};



// VNPAY IPN – CHUẨN MỚI NHẤT
export const vnpayIPN = async (req: Request, res: Response) => {
  try {
    console.log("[VNPAY IPN] Received query:", req.query);
    const verify = vnpay.verifyIpnCall(req.query as ReturnQueryFromVNPay);
    console.log("[VNPAY IPN] Verification result:", { isSuccess: verify.isSuccess, isVerified: verify.isVerified, vnp_ResponseCode: verify.vnp_ResponseCode });

    if (!verify.isSuccess || !verify.isVerified) {
      console.error("[VNPAY IPN] Signature verification failed");
      return res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
    }

    // ĐÚNG: truy cập trực tiếp các field đã được typed
    if (verify.vnp_ResponseCode !== "00") {
      return res.status(200).json({ RspCode: verify.vnp_ResponseCode, Message: "Failed" });
    }

    const txnRef = verify.vnp_TxnRef;
    const amount = Number(verify.vnp_Amount) / 100;

    const payment = await prisma.payment.findFirst({
      where: { vnpayTxnRef: txnRef },
    });

    if (payment && payment.paymentStatus === "Pending") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          paymentStatus: "Paid",
          amountPaid: amount,
          paymentDate: new Date(),
          stripePaymentId: `vnpay_${txnRef}`,
        },
      });
      console.log(`[VNPAY IPN] SUCCESS: ${txnRef} | ${amount.toLocaleString("vi-VN")} ₫`);
    }

    return res.status(200).json({ RspCode: "00", Message: "OK" });
  } catch (err: any) {
    console.error("VNPAY IPN error:", err.message);
    return res.status(200).json({ RspCode: "99", Message: "Unknown error" });
  }
};

// VNPAY RETURN URL – CHUẨN MỚI NHẤT
export const vnpayReturn = async (req: Request, res: Response) => {
  try {
    console.log("[VNPAY RETURN] Received query:", req.query);
    const verify = vnpay.verifyReturnUrl(req.query as ReturnQueryFromVNPay);
    console.log("[VNPAY RETURN] Verification result:", { isSuccess: verify.isSuccess, isVerified: verify.isVerified, vnp_ResponseCode: verify.vnp_ResponseCode });

    if (verify.isSuccess && verify.isVerified && verify.vnp_ResponseCode === "00") {
      const amount = Number(verify.vnp_Amount) / 100;
      return res.redirect(
        `${process.env.FRONTEND_URL}/dashboard/tenants/payment/success?vnpay=success&amount=${amount}`
      );
    } else {
      const code = verify.vnp_ResponseCode || "99";
      return res.redirect(
        `${process.env.FRONTEND_URL}/dashboard/tenants/payment/success?vnpay=fail&code=${code}`
      );
    }
  } catch (err) {
    console.error("VNPAY Return error:", err);
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard/tenants/payment/success?vnpay=error`);
  }
};