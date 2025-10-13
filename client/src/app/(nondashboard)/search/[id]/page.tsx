
"use client";

import { useGetAuthUserQuery } from "@/state/api";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import ImagePreviews from "./ImagePreviews";
import PropertyOverview from "./PropertyOverview";
import PropertyDetails from "./PropertyDetails";
import PropertyLocation from "./PropertyLocation";
import ContactWidget from "./ContactWidget";
import ApplicationModal from "./ApplicationModal";
import Calendar from "./Calendar";
import { addDays } from "date-fns";
import { RangeKeyDict } from "react-date-range";

// Định nghĩa interface cho trạng thái dateRange
interface DateRangeState {
  startDate: Date;
  endDate: Date;
  key: string;
}

const SingleListing: React.FC = () => {
  const { id } = useParams();
  const propertyId = Number(id);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const { data: authUser } = useGetAuthUserQuery();

  // Trạng thái cho khoảng ngày được chọn
  const [dateRange, setDateRange] = useState<DateRangeState[]>([
    {
      startDate: new Date(),
      endDate: addDays(new Date(), 1), // Mặc định chọn 1 ngày
      key: "selection",
    },
  ]);

  // Danh sách các ngày không khả dụng (ví dụ)
  const disabledDates: Date[] = [
    // Thêm các ngày khác từ API hoặc database
  ];

// Hàm xử lý khi người dùng chọn khoảng ngày
  const handleDateChange = (ranges: RangeKeyDict) => {
    const newDateRange = [ranges.selection as DateRangeState];
    console.log("Selected Range:", {
      startDate: newDateRange[0].startDate,
      endDate: newDateRange[0].endDate,
    }); // Gỡ lỗi
    setDateRange(newDateRange);
  };

  return (
    <div>
      <ImagePreviews images={["/singlelisting-2.jpg", "/singlelisting-3.jpg"]} />
      <div className="flex flex-col md:flex-row justify-center gap-10 mx-10 md:w-2/3 md:mx-auto mt-16 mb-8">
        <div className="order-2 md:order-1">
          <PropertyOverview propertyId={propertyId} />
          <PropertyDetails propertyId={propertyId} />
          <PropertyLocation propertyId={propertyId} />
        </div>

        <div className="order-1 md:order-2">
          <Calendar
            dateRange={dateRange}
            disabledDates={disabledDates}
            onDateChange={handleDateChange}
          />
          <ContactWidget onOpenModal={() => setIsModalOpen(true)} />
        </div>
      </div>

      {authUser && (
        <ApplicationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          propertyId={propertyId}
          startDate={dateRange[0].startDate}
          endDate={dateRange[0].endDate}
        />
      )}
    </div>
  );
};

export default SingleListing;