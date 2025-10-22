import { useGetPropertyQuery } from "@/state/api";
import { MapPin, Star } from "lucide-react";
import React from "react";

const PropertyOverview = ({ propertyId }: PropertyOverviewProps) => {
  const {
    data: property,
    isError,
    isLoading,
  } = useGetPropertyQuery(propertyId);

  if (isLoading) return <>Loading...</>;
  if (isError || !property) {
    return <>Không tìm thấy thông tin căn hộ</>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <div className="text-sm text-gray-500 mb-1">
          {property.location?.country} / {property.location?.state} /{" "}
          <span className="font-semibold text-gray-600">
            {property.location?.city}
          </span>
        </div>
        <h1 className="text-3xl font-bold my-5">{property.name}</h1>
        <div className="flex justify-between items-center">
          <span className="flex items-center text-gray-500">
            <MapPin className="w-4 h-4 mr-1 text-gray-700" />
            {property.location?.city}, {property.location?.state},{" "}
            {property.location?.country}
          </span>
          <div className="flex justify-between items-center gap-3">
            <span className="flex items-center text-yellow-500">
              <Star className="w-4 h-4 mr-1 fill-current" />
              {property.averageRating.toFixed(1)} ({property.numberOfReviews}{" "}
              Đánh giá)
            </span>
            <span className="text-green-600">Đã xác thực</span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="border border-primary-200 rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center gap-4 px-5">
          <div>
            <div className="text-sm text-gray-500">Giá thuê theo ngày</div>
            <div className="font-semibold">
              {property.pricePerMonth.toLocaleString("vi-VN")} VND /ngày
            </div>
          </div>
          <div className="border-l border-gray-300 h-10"></div>
          <div>
            <div className="text-sm text-gray-500">Số phòng ngủ</div>
            <div className="font-semibold">{property.beds}  phòng </div>
          </div>
          <div className="border-l border-gray-300 h-10"></div>
          <div>
            <div className="text-sm text-gray-500">Số phòng tắm</div>
            <div className="font-semibold">{property.baths} phòng </div>
          </div>
          <div className="border-l border-gray-300 h-10"></div>
          <div>
            <div className="text-sm text-gray-500">Diện tích</div>
            <div className="font-semibold">
              {property.squareFeet.toLocaleString()} m²
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="my-16">
        <h2 className="text-xl font-semibold mb-5"> Giới thiệu về {property.name}</h2>
        <p className="text-gray-500 leading-7">
          {property.description}
           Trải nghiệm không gian sống đẳng cấp tại các khu căn hộ hiện đại, nơi sự tiện nghi, sang trọng và thư giãn hòa quyện hoàn hảo. Mỗi căn hộ được thiết kế tinh tế với nội thất cao cấp, không gian mở thoáng đãng, cùng trang thiết bị hiện đại như máy giặt – máy sấy riêng, khu bếp tiện nghi, phòng làm việc, và ban công hướng nhìn tuyệt đẹp.

          Cư dân có thể tận hưởng chuỗi tiện ích nội khu hoàn hảo như hồ bơi, spa, phòng gym, khu BBQ, khuôn viên xanh, và không gian giải trí trong nhà – ngoài trời. Vị trí thuận lợi giúp dễ dàng tiếp cận trung tâm thương mại, nhà hàng, trường học, bệnh viện và các tuyến giao thông chính, mang đến sự tiện lợi tối đa trong cuộc sống hàng ngày.

          Hãy chọn cho mình một không gian sống lý tưởng, nơi bạn có thể thư giãn, tận hưởng và khẳng định phong cách sống riêng biệt – ngay giữa lòng thành phố hiện đại.
        </p>
      </div>
    </div>
  );
};

export default PropertyOverview;
