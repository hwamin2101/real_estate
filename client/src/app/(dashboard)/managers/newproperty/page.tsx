"use client";

import { CustomFormField } from "@/components/FormField";
import Header from "@/components/Header";
import { Form } from "@/components/ui/form";
import { PropertyFormData, propertySchema } from "@/lib/schemas";
import { useCreatePropertyMutation, useGetAuthUserQuery } from "@/state/api";
import {
  AmenityEnum,
  AmenityLabels,
  HighlightEnum,
  HighlightLabels,
  PropertyTypeEnum,
  PropertyTypeLabels,
} from "@/lib/constants"; //  Import đầy đủ
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";

const NewProperty = () => {
  const [createProperty] = useCreatePropertyMutation();
  const { data: authUser } = useGetAuthUserQuery();

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: "",
      description: "",
      pricePerMonth: 100,
      securityDeposit: 500,
      applicationFee: 100,
      isPetsAllowed: true,
      isParkingIncluded: true,
      photoUrls: [],
      amenities: [],
      highlights: [],
      beds: 1,
      baths: 1,
      squareFeet: 1000,
      propertyType: PropertyTypeEnum.Apartment,
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
    },
  });

  const onSubmit = async (data: PropertyFormData) => {
    if (!authUser?.cognitoInfo?.userId) {
      throw new Error("Không tìm thấy ID quản lý");
    }

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === "photoUrls") {
        const files = value as File[];
        files.forEach((file: File) => {
          formData.append("photos", file);
        });
      } else if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });

    formData.append("managerCognitoId", authUser.cognitoInfo.userId);

    await createProperty(formData);
  };

  return (
    <div className="dashboard-container">
      <Header
        title="Thêm căn hộ mới"
        subtitle="Tạo mới một bài đăng căn hộ với đầy đủ thông tin chi tiết"
      />
      <div className="bg-white rounded-xl p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-10">
            {/* Thông tin cơ bản */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Thông tin cơ bản</h2>
              <div className="space-y-4">
                <CustomFormField name="name" label="Tên căn hộ" />
                <CustomFormField name="description" label="Mô tả" type="textarea" />
              </div>
            </div>

            <hr className="my-6 border-gray-200" />

            {/* Chi phí */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Các khoảng chi phí</h2>
              <CustomFormField name="pricePerMonth" label="Giá thuê theo ngày" type="number" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomFormField name="securityDeposit" label="Tiền đặt cọc" type="number" />
                <CustomFormField name="applicationFee" label="Phí hồ sơ" type="number" />
              </div>
            </div>

            <hr className="my-6 border-gray-200" />

            {/* Chi tiết căn hộ */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Chi tiết căn hộ</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CustomFormField name="beds" label="Số phòng ngủ" type="number" />
                <CustomFormField name="baths" label="Số phòng tắm" type="number" />
                <CustomFormField name="squareFeet" label="Diện tích" type="number" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <CustomFormField name="isPetsAllowed" label="Cho phép nuôi thú cưng" type="switch" />
                <CustomFormField name="isParkingIncluded" label="Bao gồm chỗ đỗ xe" type="switch" />
              </div>
              <div className="mt-4">
                <CustomFormField
                  name="propertyType"
                  label="Loại căn hộ"
                  type="select"
                  options={Object.keys(PropertyTypeEnum).map((type) => ({
                    value: type,
                    label: PropertyTypeLabels[type as keyof typeof PropertyTypeEnum],
                  }))}
                />
              </div>
            </div>

            <hr className="my-6 border-gray-200" />

            {/* Tiện ích và Điểm nổi bật */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Tiện ích & Điểm nổi bật</h2>
              <div className="space-y-6">
                <CustomFormField
                  name="amenities"
                  label="Tiện ích"
                  type="multiselect"
                  options={Object.values(AmenityEnum).map((amenity) => ({
                    value: AmenityLabels[amenity as AmenityEnum] || amenity,
                    label: AmenityLabels[amenity as AmenityEnum] || amenity,
                  }))}
                />
                <CustomFormField
                  name="highlights"
                  label="Điểm nổi bật"
                  type="multiselect"
                  options={Object.values(HighlightEnum).map((highlight) => ({
                    value: HighlightLabels[highlight as HighlightEnum] || highlight,
                    label: HighlightLabels[highlight as HighlightEnum] || highlight,
                }))}
                />
              </div>
            </div>

            <hr className="my-6 border-gray-200" />

            {/* Hình ảnh */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Hình ảnh</h2>
              <CustomFormField
                name="photoUrls"
                label="Tải lên hình ảnh căn hộ"
                type="file"
                accept="image/*"
              />
            </div>

            <hr className="my-6 border-gray-200" />

            {/* Thông tin bổ sung */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Thông tin bổ sung</h2>
              <CustomFormField name="address" label="Địa chỉ" />
              <div className="flex justify-between gap-4">
                <CustomFormField name="city" label="Thành phố" className="w-full" />
                <CustomFormField name="state" label="Quận" className="w-full" />
                <CustomFormField name="postalCode" label="Mã bưu chính" className="w-full" />
              </div>
              <CustomFormField name="country" label="Quốc gia" />
            </div>

            <Button type="submit" className="bg-primary-700 text-white w-full mt-8">
              Thêm mới
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default NewProperty;
