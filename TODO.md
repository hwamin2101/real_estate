# PaymentController Review and Fixes - Completed

## Completed Tasks
- [x] **amountDue calculation**: Updated `updateApplicationStatus` in `applicationControllers.ts` to calculate prorated `amountDue` based on rental days per payment period instead of fixed monthly price.
- [x] **Stripe webhook amountPaid**: Fixed `stripeWebhook` to use `session.amount_total` directly for VND currency (removed incorrect division by 100).
- [x] **VNPay IPN amountPaid**: Fixed `vnpayIPN` to use `verify.vnp_Amount` directly without dividing by 100 (since `createVNPayPayment` already multiplies by 100).
- [x] **VNPay return URLs**: Corrected redirect URLs in `vnpayReturn` from `/dashboard/tenants/payment/success` to `/tenants/payments/success` to match frontend routes.

## Summary of Changes
- **applicationControllers.ts**: Modified payment creation logic to prorate amounts based on actual rental days in each monthly period.
- **paymentControllers.ts**: Fixed amount handling in webhooks and corrected redirect URLs for VNPay.

## Next Steps
- Test payment creation and webhook handling to ensure correct `amountDue` and `amountPaid` values.
- Verify that prorated payments work correctly for partial months.
