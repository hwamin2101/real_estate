import React from "react";
import { DateRange, RangeKeyDict } from "react-date-range";
import { vi } from "date-fns/locale"; // Thêm dòng này
import "react-date-range/dist/styles.css"; // File CSS chính
import "react-date-range/dist/theme/default.css"; // File CSS theme mặc định

// Định nghĩa interface cho props
interface CalendarProps {
  dateRange: { startDate: Date; endDate: Date; key: string }[];
  disabledDates: Date[];
  onDateChange: (ranges: RangeKeyDict) => void;
}

const Calendar: React.FC<CalendarProps> = ({
  dateRange,
  disabledDates,
  onDateChange,
}) => {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Chọn ngày thuê</h3>
      <DateRange
        editableDateInputs={true}
        onChange={onDateChange}
        moveRangeOnFirstSelection={false}
        ranges={dateRange}
        disabledDates={disabledDates}
        minDate={new Date()} // Không cho chọn ngày trong quá khứ
        className="shadow-md rounded-lg"
        locale={vi} // Hiển thị tiếng Việt
      />
    </div>
  );
};

export default Calendar;
