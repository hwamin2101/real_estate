# TODO: Fix VNPAY Signature Issue

## Investigation
- [x] Analyze VNPAY notification: "Sai chữ ký" (Wrong signature) for txnRef "6484mezzbU" at 29/11/2025 12:07:48
- [x] Review code: vnpay.ts, paymentControllers.ts, routes
- [x] Identify potential causes: secret mismatch, hash algorithm, data integrity

## Plan
- [ ] Update hash algorithm to SHA256 (VNPAY may require it)
- [ ] Add logging for signature verification details
- [ ] Ensure secret is correctly set in .env
- [ ] Test with VNPAY sandbox

## Implementation
- [x] Modify server/src/utils/vnpay.ts to use SHA256
- [x] Update vnpayIPN to log verification details
- [x] Update vnpayReturn to log verification details
- [ ] Verify .env has correct VNP_SECRET and VNP_TMNCODE

## Testing
- [x] Run server and test payment flow
- [ ] Check logs for signature verification
- [ ] Monitor for "Sai chữ ký" errors
