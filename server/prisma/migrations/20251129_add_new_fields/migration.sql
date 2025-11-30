-- Bảng mới
CREATE TABLE "Notification" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT now()
);

-- Thêm cột mới cho Payment
ALTER TABLE "Payment"
ADD COLUMN "createdAt" TIMESTAMP DEFAULT now(),
ADD COLUMN "updatedAt" TIMESTAMP DEFAULT now(),
ADD COLUMN "stripePaymentId" TEXT,
ADD COLUMN "vnpayTxnRef" TEXT;

-- Thay đổi các cột hiện tại
ALTER TABLE "Payment"
ALTER COLUMN "amountPaid" SET DEFAULT 0,
ALTER COLUMN "paymentDate" DROP NOT NULL,
ALTER COLUMN "paymentStatus" SET DEFAULT 'Pending';
