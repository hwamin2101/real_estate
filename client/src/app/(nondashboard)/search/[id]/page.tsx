"use client";

import { useGetAuthUserQuery, useGetPropertyQuery } from "@/state/api";
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

  const { data: property, isLoading: propertyLoading } = useGetPropertyQuery(propertyId);

  const [dateRange, setDateRange] = useState<DateRangeState[]>([
    {
      startDate: new Date(),
      endDate: addDays(new Date(), 1),
      key: "selection",
    },
  ]);

  const disabledDates: Date[] = [];

  const handleDateChange = (ranges: RangeKeyDict) => {
    const newDateRange = [ranges.selection as DateRangeState];
    setDateRange(newDateRange);
  };

  if (propertyLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg">Không tìm thấy căn hộ.</p>
      </div>
    );
  }

  return (
    <div>
      {/* ẢNH THẬT + LIGHTBOX */}
      <ImagePreviews images={property.photoUrls || []} />

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