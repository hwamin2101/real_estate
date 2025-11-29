"use client";
import { CheckCircle, XCircle, CreditCard, QrCode } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// THÊM 2 DÒNG NÀY – QUAN TRỌNG NHẤT
import { api } from "@/state/api"; // ← đường dẫn đến file api.ts của bạn

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const vnpayStatus = searchParams.get("vnpay");
  const stripeStatus = searchParams.get("stripe");
  const amount = searchParams.get("amount");
  const order = searchParams.get("order") || searchParams.get("session_id");

  const isSuccess = vnpayStatus === "success" || stripeStatus === "success";
  const paymentMethod = vnpayStatus ? "VNPay / QR" : "Thẻ quốc tế (Stripe)";

  useEffect(() => {
    // DÒNG THẦN THÁNH – XÓA HẾT CACHE CỦA RTK QUERY
    // → Lần sau vào trang thanh toán sẽ gọi API mới → thấy "Đã thanh toán" ngay!
    api.util.resetApiState();

    const timer = setTimeout(() => {
      router.push("/tenants/payments");
    }, 10000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full text-center">
        {isSuccess ? (
          <>
            <CheckCircle className="w-32 h-32 text-green-500 mx-auto mb-8 animate-bounce" />
            <h1 className="text-5xl font-extrabold text-green-600 mb-6">
              Thanh toán thành công!
            </h1>
          </>
        ) : (
          <>
            <XCircle className="w-32 h-32 text-red-500 mx-auto mb-8" />
            <h1 className="text-5xl font-extrabold text-red-600 mb-6">
              Thanh toán thất bại
            </h1>
          </>
        )}

        <div className="bg-gray-50 rounded-2xl p-8 mb-8 space-y-4">
          {amount && (
            <div>
              <p className="text-gray-600">Số tiền</p>
              <p className="text-4xl font-bold text-indigo-600">
                {Number(amount).toLocaleString("vi-VN")} ₫
              </p>
            </div>
          )}

          {order && (
            <div>
              <p className="text-gray-600">Mã giao dịch</p>
              <p className="font-mono text-sm bg-gray-200 px-4 py-2 rounded-lg inline-block break-all">
                {order}
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 text-gray-700">
            {vnpayStatus ? <QrCode className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
            <span className="font-medium">{paymentMethod}</span>
          </div>
        </div>

        {isSuccess ? (
          <p className="text-lg text-gray-700 mb-8">
            Hệ thống đã ghi nhận thanh toán của bạn!
          </p>
        ) : (
          <p className="text-lg text-gray-700 mb-8">
            Có lỗi xảy ra. Vui lòng thử lại hoặc liên hệ chủ nhà.
          </p>
        )}

        <button
          onClick={() => router.push("/tenants/payments")}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-12 py-5 rounded-full font-bold text-xl hover:shadow-2xl transform hover:scale-105 transition duration-300"
        >
          Về trang thanh toán
        </button>

        <p className="text-sm text-gray-500 mt-6">
          Tự động chuyển hướng sau <span className="font-bold">10</span> giây...
        </p>
      </div>
    </div>
  );
}