// /payments/index.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useGetApplicationsQuery, useGetAuthUserQuery } from "@/state/api";

const PaymentsPage = () => {
  const router = useRouter();
  const { data: authUser } = useGetAuthUserQuery();

  const { data: applications, isLoading, isError } = useGetApplicationsQuery({
    userId: authUser?.cognitoInfo?.userId,
    userType: "tenant",
  });
  


  if (isLoading) return <div>Đang tải...</div>;
  if (isError || !applications) return <div>Lỗi khi tải hợp đồng</div>;


// Lọc hợp đồng approved chưa thanh toán và có property
const approvedContracts = applications.filter(
  (app) => app.status === "Approved" && !app.isPaid && app.property
);

console.log("Approved contracts filtered:", approvedContracts);



  const calculateCost = (contract: any) => {
    const start = new Date(contract.startDate).getTime();
    const end = new Date(contract.endDate).getTime();
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const rentCost = (contract.property.pricePerMonth / 30) * days;
    const deposit = contract.property.securityDeposit || 0;
    const applicationFee = contract.property.applicationFee || 0;
    return {
      days,
      rentCost,
      deposit,
      applicationFee,
      totalCost: rentCost + deposit + applicationFee,
    };
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Danh sách hợp đồng đã duyệt</h1>

      {approvedContracts.length === 0 ? (
        <p>Hiện tại không có hợp đồng nào cần thanh toán.</p>
      ) : (
        <ul className="space-y-4">
          {approvedContracts.map((contract) => {
            const cost = calculateCost(contract);

            return (
              <li
                key={contract.id}
                className="border rounded-lg shadow-sm p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4"
              >
                {/* Thông tin hợp đồng */}
                <div className="flex-1">
                  <p className="font-semibold text-lg">{contract.property.name}</p>
                  <p className="text-gray-600 mb-1">{contract.property.location.city}, {contract.property.location.country}</p>
                  <p className="text-gray-600 mb-1">
                    Thời gian thuê: {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()} ({cost.days} ngày)
                  </p>
                  <div className="text-gray-600">
                    <p>Giá thuê: {contract.property.pricePerMonth.toLocaleString()} VND/tháng </p>
                    <p> Đặt cọc: {cost.deposit.toLocaleString()} VND </p>
                    <p> Phí hồ sơ: {cost.applicationFee.toLocaleString()} VND </p>
                  </div>
                  <p className="text-gray-800 font-semibold mt-1">
                    Tổng thanh toán: {Math.round(cost.totalCost).toLocaleString()} VND
                  </p>
                </div>

                {/* Nút thanh toán */}
                <div>
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    onClick={() => router.push(`/tenants/payments/${contract.id}`)}

                  >
                    Thanh toán
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default PaymentsPage;
