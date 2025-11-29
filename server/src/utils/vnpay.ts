// src/utils/vnpay.ts
import { VNPay, HashAlgorithm } from 'vnpay';

if (!process.env.VNP_TMNCODE || !process.env.VNP_SECRET) {
  throw new Error('Missing VNPAY config in .env');
}

const secret = process.env.VNP_SECRET!.trim();
const tmnCode = process.env.VNP_TMNCODE!.trim();

const hashAlgorithm: HashAlgorithm = process.env.NODE_ENV === 'production' ? HashAlgorithm.SHA256 : HashAlgorithm.MD5; 

export const vnpay = new VNPay({
  tmnCode,
  secureSecret: secret,
  vnpayHost: 'https://sandbox.vnpayment.vn',
  testMode: process.env.NODE_ENV !== 'production',
  hashAlgorithm,
});