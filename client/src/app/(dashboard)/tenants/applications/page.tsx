"use client";

import ApplicationCard from "@/components/ApplicationCard";
import ContractPreview from "@/components/ContractPreview";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { useGetApplicationsQuery, useGetAuthUserQuery } from "@/state/api";
import { CircleCheckBig, Clock, Download, XCircle } from "lucide-react";
import React, { useRef } from "react";
import html2pdf from "html2pdf.js";
import { createRoot } from "react-dom/client";

const Applications = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const { data: applications, isLoading, isError } = useGetApplicationsQuery({
    userId: authUser?.cognitoInfo?.userId,
    userType: "tenant",
  });

  if (isLoading) return <Loading />;
  if (isError || !applications) return <div>Lỗi khi tải yêu cầu thuê</div>;

  const calculateCost = (app: any) => {
    const start = new Date(app.startDate).getTime();
    const end = new Date(app.endDate).getTime();
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const rentCost = (app.property.pricePerMonth / 30) * days;
    const depositCost = app.property.securityDeposit || 0;
    const applicationFee = app.property.applicationFee || 0;
    return {
      days,
      rentCost,
      depositCost,
      applicationFee,
      totalCost: rentCost + depositCost + applicationFee,
    };
  };

  const handleDownloadPDF = (contractData: any, propertyName: string) => {
  const element = document.createElement("div");
  document.body.appendChild(element);

  const root = createRoot(element); // Tạo root
  root.render(<ContractPreview data={contractData} />);

  html2pdf()
    .set({ margin: 10, filename: `HopDong-${propertyName}.pdf` })
    .from(element)
    .save()
    .finally(() => {
      root.unmount(); 
      document.body.removeChild(element);
    });
};

  return (
    <div className="dashboard-container">
      <Header
        title="Yêu cầu thuê"
        subtitle="Theo dõi và quản lý yêu cầu thuê căn hộ của bạn"
      />
      <div className="w-full">
        {applications.map((application) => {
          const cost = calculateCost(application);

          const contractData = {
            contractDate: new Date().toLocaleDateString(),
            landlordName: application.manager.name,
            tenantName: application.tenant.name,
            tenantEmail: application.tenant.email,
            tenantPhone: application.tenant.phoneNumber,
            propertyName: application.property.name,
            address: `${application.property.location.city}, ${application.property.location.country}`,
            pricePerMonth: application.property.pricePerMonth,
            startDate: new Date(application.startDate).toLocaleDateString(),
            endDate: new Date(application.endDate).toLocaleDateString(),
            deposit: application.property.securityDeposit || 0,
            applicationFee: application.property.applicationFee || 0,
            totalCost: cost.totalCost,
            numberOfDays: cost.days,
          };

          return (
            <ApplicationCard
              key={application.id}
              application={application}
              userType="renter"
            >
              <div className="flex justify-between gap-5 w-full pb-4 px-4">
                {application.status === "Approved" ? (
                  <div className="bg-green-100 p-4 text-green-700 grow flex items-center">
                    <CircleCheckBig className="w-5 h-5 mr-2" />
                    Căn hộ đang được bạn thuê đến{" "}
                    {new Date(application.lease?.endDate).toLocaleDateString()}
                  </div>
                ) : application.status === "Pending" ? (
                  <div className="bg-yellow-100 p-4 text-yellow-700 grow flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Yêu cầu thuê của bạn đang chờ phê duyệt
                  </div>
                ) : (
                  <div className="bg-red-100 p-4 text-red-700 grow flex items-center">
                    <XCircle className="w-5 h-5 mr-2" />
                    Yêu cầu thuê của bạn đã bị từ chối
                  </div>
                )}

                {application.status === "Approved" && (
                  <button
                    className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md flex items-center justify-center hover:bg-primary-700 hover:text-primary-50"
                    onClick={() =>
                      handleDownloadPDF(contractData, application.property.name)
                    }
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Tải Hợp đồng
                  </button>
                )}
              </div>
            </ApplicationCard>
          );
        })}
      </div>
    </div>
  );
};

export default Applications;
