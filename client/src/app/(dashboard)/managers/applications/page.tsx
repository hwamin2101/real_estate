"use client";

import ApplicationCard from "@/components/ApplicationCard";
import ContractPreview from "@/components/ContractPreview";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useGetApplicationsQuery,
  useGetAuthUserQuery,
  useUpdateApplicationStatusMutation,
} from "@/state/api";
import { CircleCheckBig, Download, File, Hospital } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import html2pdf from "html2pdf.js";
import { createRoot } from "react-dom/client";

const Applications = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const [activeTab, setActiveTab] = useState("all");

  const {
    data: applications,
    isLoading,
    isError,
  } = useGetApplicationsQuery(
    {
      userId: authUser?.cognitoInfo?.userId,
      userType: "manager",
    },
    {
      skip: !authUser?.cognitoInfo?.userId,
    }
  );
  const [updateApplicationStatus] = useUpdateApplicationStatusMutation();

  const handleStatusChange = async (id: number, status: string) => {
    await updateApplicationStatus({ id, status });
  };

  if (isLoading) return <Loading />;
  if (isError || !applications) return <div>Lỗi khi tải đơn đăng ký thuê</div>;

  const filteredApplications = applications?.filter((application) => {
    if (activeTab === "all") return true;
    return application.status.toLowerCase() === activeTab;
  });

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
        title="Đơn đăng ký thuê"
        subtitle="Xem và quản lý đơn đăng ký thuê cho căn hộ của bạn"
      />
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full my-5"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="pending">Chờ xử lý</TabsTrigger>
          <TabsTrigger value="approved">Đã phê duyệt</TabsTrigger>
          <TabsTrigger value="denied">Đã từ chối</TabsTrigger>
        </TabsList>
        {["all", "pending", "approved", "denied"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-5 w-full">
            {filteredApplications
              .filter(
                (application) =>
                  tab === "all" || application.status.toLowerCase() === tab
              )
              .map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  userType="manager"
                >
                  <div className="flex justify-between gap-5 w-full pb-4 px-4">
                    {/* Colored Section Status */}
                    <div
                      className={`p-4 text-green-700 grow ${
                        application.status === "Approved"
                          ? "bg-green-100"
                          : application.status === "Denied"
                          ? "bg-red-100"
                          : "bg-yellow-100"
                      }`}
                    >
                      <div className="flex flex-wrap items-center">
                        <File className="w-5 h-5 mr-2 flex-shrink-0" />
                        <span className="mr-2">
                          Yêu cầu thuê được gửi vào{" "}
                          {new Date(
                            application.applicationDate
                          ).toLocaleDateString()}
                          .
                        </span>
                        <CircleCheckBig className="w-5 h-5 mr-2 flex-shrink-0" />
                        <span
                          className={`font-semibold ${
                            application.status === "Approved"
                              ? "text-green-800"
                              : application.status === "Denied"
                              ? "text-red-800"
                              : "text-yellow-800"
                          }`}
                        >
                          {application.status === "Approved" &&
                            "Yêu cầu thuê này đã được phê duyệt."}
                          {application.status === "Denied" &&
                            "Yêu cầu thuê này đã bị từ chối."}
                          {application.status === "Pending" &&
                            "Yêu cầu thuê này đang chờ xem xét."}
                        </span>
                      </div>
                    </div>

                    {/* Right Buttons */}
                    <div className="flex gap-2">
                      <Link
                        href={`/managers/properties/${application.property.id}`}
                        className={`bg-white border border-gray-300 text-gray-700 py-2 px-4 
                          rounded-md flex items-center justify-center hover:bg-primary-700 hover:text-primary-50`}
                        scroll={false}
                      >
                        <Hospital className="w-5 h-5 mr-2" />
                        Chi tiết căn hộ
                      </Link>
                      {application.status === "Approved" && (
                        <button
                          className={`bg-white border border-gray-300 text-gray-700 py-2 px-4
                          rounded-md flex items-center justify-center hover:bg-primary-700 hover:text-primary-50`}
                          onClick={() => {
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
                              startDate: new Date(
                                application.startDate
                              ).toLocaleDateString(),
                              endDate: new Date(
                                application.endDate
                              ).toLocaleDateString(),
                              deposit:
                                application.property.securityDeposit || 0,
                              applicationFee:
                                application.property.applicationFee || 0,
                              totalCost: cost.totalCost,
                              numberOfDays: cost.days,
                            };
                            handleDownloadPDF(
                              contractData,
                              application.property.name
                            );
                          }}
                        >
                          <Download className="w-5 h-5 mr-2" />
                          Tải hợp đồng
                        </button>
                      )}
                      {application.status === "Pending" && (
                        <>
                          <button
                            className="px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-500"
                            onClick={() =>
                              handleStatusChange(application.id, "Approved")
                            }
                          >
                            Phê duyệt
                          </button>
                          <button
                            className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-500"
                            onClick={() =>
                              handleStatusChange(application.id, "Denied")
                            }
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                      {application.status === "Denied" && (
                        <button
                          className={`bg-gray-800 text-white py-2 px-4 rounded-md flex items-center
                          justify-center hover:bg-secondary-500 hover:text-primary-50`}
                        >
                          Liên hệ người dùng
                        </button>
                      )}
                    </div>
                  </div>
                </ApplicationCard>
              ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Applications;
