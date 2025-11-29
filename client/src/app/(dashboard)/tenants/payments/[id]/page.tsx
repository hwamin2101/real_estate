"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  useGetApplicationQuery,
  useCreateVNPayPaymentMutation,
  useCreateStripeSessionMutation,
  useGetApplicationPaymentScheduleQuery,
} from "@/state/api";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { ArrowLeft, Check, CreditCard } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const formatPaymentStatus = (status: string) => {
  const map: Record<string, string> = {
    Pending: "Chưa thanh toán",
    Paid: "Đã thanh toán",
    PartiallyPaid: "Thanh toán một phần",
    Overdue: "Quá hạn",
  };
  return map[status] || status;
};

const ApplicationPaymentsPage = () => {
  const { id } = useParams();
  const applicationId = Number(id);
  const [loadingPaymentId, setLoadingPaymentId] = useState<string | null>(null);

  const { data: application, isLoading: appLoading, isError: appError } = useGetApplicationQuery(applicationId);
  const { data: payments = [], isLoading: paymentsLoading } = useGetApplicationPaymentScheduleQuery(applicationId);

  const [createVNPayPayment] = useCreateVNPayPaymentMutation();
  const [createStripeSession] = useCreateStripeSessionMutation();

  const isLoading = appLoading || paymentsLoading;
  const isError = appError || !application || !application.lease;

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="dashboard-container text-center py-20">
        <p className="text-red-600 text-lg font-medium">Không tìm thấy hợp đồng.</p>
        <Link href="/tenants/payments" className="text-primary-600 hover:underline mt-4 inline-block">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  const lease = application.lease!;
  const now = new Date();

  const currentMonthPayment = payments.find((p: any) => {
    const dueDate = new Date(p.dueDate);
    return dueDate.getFullYear() === now.getFullYear() && dueDate.getMonth() === now.getMonth();
  });

  const currentStatus = currentMonthPayment ? formatPaymentStatus(currentMonthPayment.paymentStatus) : "Chưa có kỳ thanh toán";

  const formatCurrency = (amount?: number | null) =>
    amount ? amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" }) : "0 ₫";

  const handleVNPay = async (paymentId: number) => {
    setLoadingPaymentId(paymentId.toString());
    try {
      const result = await createVNPayPayment({ paymentId }).unwrap();
      window.location.href = result.paymentUrl;
    } catch (err: any) {
      toast.error(err?.data?.message || "Không thể tạo link VNPay");
    } finally {
      setLoadingPaymentId(null);
    }
  };

const handleStripe = async (paymentId: number) => {
  setLoadingPaymentId(paymentId.toString());
  try {
    const result = await createStripeSession({
      applicationId,  
      paymentId,     
    }).unwrap();
    
    window.location.href = result.url;
  } catch (err: any) {
    toast.error(err?.data?.message || "Lỗi thanh toán thẻ");
  } finally {
    setLoadingPaymentId(null);
  }
};

  return (
    <div className="dashboard-container">
      <Link href="/tenants/payments" className="flex items-center mb-6 hover:text-primary-500">
        <ArrowLeft className="w-5 h-5 mr-2" /> Quay lại danh sách hợp đồng
      </Link>

      <Header title={application.property?.name || "Căn hộ"} subtitle="Thông tin chi tiết hợp đồng & thanh toán" />

      <div className="mt-8 space-y-8">
        {/* Thông tin hợp đồng */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Thông tin hợp đồng</h3>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Người thuê</p>
                <p className="font-medium">{application.tenant?.name || "Chưa có"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Thời gian thuê</p>
                <p className="font-medium">
                  {lease.startDate ? new Date(lease.startDate).toLocaleDateString("vi-VN") : "?"} →{" "}
                  {lease.endDate ? new Date(lease.endDate).toLocaleDateString("vi-VN") : "?"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Giá thuê/tháng</p>
                <p className="font-medium text-lg text-primary-600">
                  {formatCurrency(lease.rent || application.property?.pricePerMonth)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tình trạng tháng này</p>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                    currentStatus === "Đã thanh toán"
                      ? "bg-green-100 text-green-800"
                      : currentStatus === "Quá hạn"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {currentStatus === "Đã thanh toán" && <Check className="w-4 h-4 mr-1" />}
                  {currentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bảng thanh toán */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Lịch sử thanh toán</h3>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kỳ thanh toán</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-center">Thanh toán</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length > 0 ? (
                  payments.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.dueDate).toLocaleDateString("vi-VN")}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(p.amountDue)}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            p.paymentStatus === "Paid"
                              ? "bg-green-100 text-green-800"
                              : p.paymentStatus === "Overdue"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {formatPaymentStatus(p.paymentStatus)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {p.paymentStatus === "Paid" ? (
                          <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                            <Check className="w-4 h-4" />
                            Đã thanh toán
                          </span>
                        ) : (
                          <div className="flex gap-2 justify-center">
                            <Button
                              onClick={() => handleVNPay(p.id)}
                              disabled={loadingPaymentId === p.id.toString()}
                              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold shadow-lg text-xs"
                              size="sm"
                            >
                              {loadingPaymentId === p.id.toString() ? "Đang tạo..." : "VNPay"}
                            </Button>

                            <Button
                              onClick={() => handleStripe(p.id)}
                              disabled={loadingPaymentId === p.id.toString()}
                              variant="outline"
                              className="border-purple-600 text-purple-600 hover:bg-purple-50 font-bold text-xs"
                              size="sm"
                            >
                              <CreditCard className="w-4 h-4 mr-1" />
                              Stripe
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                      Chưa có kỳ thanh toán nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationPaymentsPage;
