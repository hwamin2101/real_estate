"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetApplicationsQuery } from "@/state/api";
import { fetchAuthSession } from "aws-amplify/auth";
import Image from "next/image";
import { skipToken } from "@reduxjs/toolkit/query";

const ApprovedProperties = () => {
  const [managerId, setManagerId] = useState<string | null>(null);

  useEffect(() => {
    const fetchManager = async () => {
      try {
        const session = await fetchAuthSession();
        const userSub = session.tokens?.idToken?.payload?.sub;
        setManagerId(userSub || null);
      } catch (error) {
        console.error("Error fetching manager session:", error);
      }
    };
    fetchManager();
  }, []);

  // Adjust query to handle string managerId (assuming API accepts string userId)
  const { data: applications, isLoading } = useGetApplicationsQuery(
    managerId ? { userId: managerId, userType: "manager" } : skipToken
  );

  if (isLoading || !managerId) return <Loading />;

  const approvedApps = (applications ?? []).filter(
    (app: any) => app.status === "Approved"
  );

  // Function to get payment status (fallback to lease data if available)
  const getPaymentStatus = (app: any) => {
    // Check if payments are included in the lease data
    if (app.lease?.payments && app.lease.payments.length > 0) {
      const currentDate = new Date();
      const currentMonthPayment = app.lease.payments.find(
        (payment: any) =>
          new Date(payment.dueDate).getMonth() === currentDate.getMonth() &&
          new Date(payment.dueDate).getFullYear() === currentDate.getFullYear()
      );
      return currentMonthPayment?.paymentStatus || "Not Paid";
    }
    return "No Data"; // Fallback if payments are not included
  };

  return (
    <div className="dashboard-container">
      <Header
        title="Căn hộ đã duyệt"
        subtitle="Tổng hợp danh sách căn hộ đã được duyệt và cho thuê"
      />

      <div className="mt-8 bg-white rounded-xl shadow-md overflow-hidden p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Căn hộ cho thuê</h2>
          <p className="text-sm text-gray-500">
            Xem tất cả các đơn đăng ký cho thuê đã được phê duyệt do bạn quản lý.
          </p>
        </div>

        <hr className="mb-4" />

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Căn hộ</TableHead>
                <TableHead>Người thuê</TableHead>
                <TableHead>Thời gian thuê</TableHead>
                <TableHead>Giá thuê hàng tháng</TableHead>
                <TableHead>Trạng thái thanh toán</TableHead>
                <TableHead>Liên hệ</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {approvedApps?.length > 0 ? (
                approvedApps.map((app: any) => (
                  <TableRow key={app.id} className="h-24">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Image
                          src={app.property.photoUrls?.[0] || "/placeholder.png"}
                          alt={app.property.name}
                          width={60}
                          height={60}
                          className="rounded-lg object-cover"
                        />
                        <div>
                          <div className="font-semibold">{app.property.name}</div>
                          <div className="text-sm text-gray-500">
                            {app.property.address}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-semibold">{app.tenant.name}</div>
                      <div className="text-sm text-gray-500">
                        {app.tenant.email}
                      </div>
                    </TableCell>

                    <TableCell>
                      {app.lease?.startDate && app.lease?.endDate ? (
                        <>
                          {new Date(app.lease.startDate).toLocaleDateString()} -{" "}
                          {new Date(app.lease.endDate).toLocaleDateString()}
                        </>
                      ) : (
                        <span className="text-gray-400 italic">N/A</span>
                      )}
                    </TableCell>

                    <TableCell>
                      ${app.lease?.rent?.toLocaleString() || "N/A"}
                    </TableCell>

                    <TableCell>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          getPaymentStatus(app) === "Paid"
                            ? "bg-green-100 text-green-700"
                            : getPaymentStatus(app) === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {getPaymentStatus(app) === "Paid"
                          ? "Đã thanh toán"
                          : getPaymentStatus(app) === "Pending"
                          ? "Đang xử lý"
                          : getPaymentStatus(app) === "Not Paid"
                          ? "Chưa thanh toán"
                          : "Không có dữ liệu"}
                      </span>
                    </TableCell>

                    <TableCell>
                      {app.tenant.phoneNumber || "N/A"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                    Chưa có căn hộ nào được cho thuê
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ApprovedProperties;