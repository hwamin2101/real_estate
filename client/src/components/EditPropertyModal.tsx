"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Save, Loader2, Upload, Trash2 } from "lucide-react";
import { useUpdatePropertyMutation } from "@/state/api";
import {
  AmenityEnum,
  AmenityLabels,
  HighlightEnum,
  HighlightLabels,
  PropertyTypeEnum,
  PropertyTypeLabels,
} from "@/lib/constants";

// === Schema giống hệt khi tạo mới ===
const schema = z.object({
  name: z.string().min(1, "Tên căn hộ không được để trống"),
  description: z.string().optional(),
  pricePerMonth: z.number().positive("Giá thuê phải > 0"),
  securityDeposit: z.number().min(0),
  applicationFee: z.number().min(0),
  beds: z.number().int().min(0),
  baths: z.number().min(0),
  squareFeet: z.number().int().min(0),
  propertyType: z.enum(Object.values(PropertyTypeEnum) as [string, ...string[]]),
  address: z.string().min(1, "Địa chỉ không được để trống"),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
  isPetsAllowed: z.boolean(),
  isParkingIncluded: z.boolean(),
  amenities: z.array(z.string()),
  highlights: z.array(z.string()),
  newPhotos: z.array(z.instanceof(File)).optional(),
});

type FormData = z.infer<typeof schema>;

interface EditPropertyModalProps {
  property: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditPropertyModal: React.FC<EditPropertyModalProps> = ({
  property,
  open,
  onOpenChange,
}) => {
  const [updateProperty, { isLoading }] = useUpdatePropertyMutation();
  const [previewPhotos, setPreviewPhotos] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const watchedPhotos = watch("newPhotos");

  // Reset form khi mở modal
  useEffect(() => {
    if (open && property) {
      reset({
        name: property.name || "",
        description: property.description || "",
        pricePerMonth: property.pricePerMonth || 0,
        securityDeposit: property.securityDeposit || 0,
        applicationFee: property.applicationFee || 0,
        beds: property.beds || 0,
        baths: property.baths || 0,
        squareFeet: property.squareFeet || 0,
        propertyType: property.propertyType || PropertyTypeEnum.Apartment,
        address: property.location?.address || "",
        city: property.location?.city || "",
        state: property.location?.state || "",
        postalCode: property.location?.postalCode || "",
        country: property.location?.country || "",
        isPetsAllowed: property.isPetsAllowed || false,
        isParkingIncluded: property.isParkingIncluded || false,
        amenities: property.amenities?.map((a: any) => a.name || a) || [],
        highlights: property.highlights?.map((h: any) => h.name || h) || [],
      });

      setPreviewPhotos(property.photoUrls || []);
      setSelectedFiles([]);
      setPhotosToDelete([]);
    }
  }, [open, property, reset]);

  // Xem trước ảnh mới
  useEffect(() => {
    if (watchedPhotos && watchedPhotos.length > 0) {
      const files = Array.from(watchedPhotos);
      const urls = files.map((file) => URL.createObjectURL(file));
      setPreviewPhotos((prev) => [...prev.filter((url) => !url.startsWith("blob:")), ...urls]);
      setSelectedFiles(files);
    }
  }, [watchedPhotos]);

  const removeNewPhoto = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setValue("newPhotos", newFiles.length > 0 ? newFiles : undefined);
    setPreviewPhotos((prev) => prev.filter((_, i) => i !== index + (property.photoUrls?.length || 0)));
  };

  const removeExistingPhoto = (url: string, index: number) => {
    setPhotosToDelete((prev) => [...prev, url]);
    setPreviewPhotos((prev) => prev.filter((_, i) => i !== index));
  };

const onSubmit = async (data: FormData) => {
  try {
    const formData = new FormData();

    // GỬI TỪNG FIELD RIÊNG (KHÔNG ĐÓNG GÓI TRONG OBJECT)
    if (data.name) formData.append("name", data.name);
    if (data.description) formData.append("description", data.description);
    if (data.pricePerMonth !== undefined) formData.append("pricePerMonth", String(data.pricePerMonth));
    if (data.securityDeposit !== undefined) formData.append("securityDeposit", String(data.securityDeposit));
    if (data.applicationFee !== undefined) formData.append("applicationFee", String(data.applicationFee));
    if (data.beds !== undefined) formData.append("beds", String(data.beds));
    if (data.baths !== undefined) formData.append("baths", String(data.baths));
    if (data.squareFeet !== undefined) formData.append("squareFeet", String(data.squareFeet));
    if (data.isPetsAllowed !== undefined) formData.append("isPetsAllowed", String(data.isPetsAllowed));
    if (data.isParkingIncluded !== undefined) formData.append("isParkingIncluded", String(data.isParkingIncluded));
    if (data.propertyType) formData.append("propertyType", data.propertyType);

    // LOCATION
    if (data.address) formData.append("address", data.address);
    if (data.city) formData.append("city", data.city);
    if (data.state) formData.append("state", data.state);
    if (data.country) formData.append("country", data.country);
    if (data.postalCode) formData.append("postalCode", data.postalCode);

    // AMENITIES & HIGHLIGHTS
    if (data.amenities.length > 0) {
      formData.append("amenities", JSON.stringify(data.amenities));
    }
    if (data.highlights.length > 0) {
      formData.append("highlights", JSON.stringify(data.highlights));
    }

    // ẢNH MỚI
    if (data.newPhotos && data.newPhotos.length > 0) {
      data.newPhotos.forEach((file) => formData.append("photos", file));
    }

    // ẢNH XÓA
    if (photosToDelete.length > 0) {
      photosToDelete.forEach((url) => formData.append("deletePhotoUrls", url));
    }

    // LOG FORM DATA ĐỂ KIỂM TRA
    for (const [key, value] of formData.entries()) {
      console.log("FORM DATA:", key, value);
    }

    const result = await updateProperty({ id: property.id, formData }).unwrap();
    console.log("UPDATE SUCCESS:", result);

    onOpenChange(false);
  } catch (error: any) {
    console.error("Update failed:", error);
    alert("Cập nhật thất bại: " + (error?.data?.message || error.message));
  }
};

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-white z-10 pb-4 border-b">
          <h3 className="text-2xl font-bold">Chỉnh sửa căn hộ</h3>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* === THÔNG TIN CƠ BẢN === */}
          <section>
            <h4 className="text-lg font-semibold mb-4">Thông tin cơ bản</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên căn hộ</label>
                <input {...register("name")} className="w-full px-3 py-2 border rounded-md" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea {...register("description")} rows={3} className="w-full px-3 py-2 border rounded-md" />
              </div>
            </div>
          </section>

          <hr />

          {/* === CHI PHÍ === */}
          <section>
            <h4 className="text-lg font-semibold mb-4">Chi phí</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Giá thuê/tháng</label>
                <input type="number" {...register("pricePerMonth", { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tiền cọc</label>
                <input type="number" {...register("securityDeposit", { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phí ứng tuyển</label>
                <input type="number" {...register("applicationFee", { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-md" />
              </div>
            </div>
          </section>

          <hr />

          {/* === CHI TIẾT CĂN HỘ === */}
          <section>
            <h4 className="text-lg font-semibold mb-4">Chi tiết căn hộ</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Phòng ngủ</label>
                <input type="number" {...register("beds", { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phòng tắm</label>
                <input type="number" step="0.5" {...register("baths", { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Diện tích (ft²)</label>
                <input type="number" {...register("squareFeet", { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-md" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register("isPetsAllowed")} className="w-4 h-4" />
                <span>Cho phép thú cưng</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register("isParkingIncluded")} className="w-4 h-4" />
                <span>Có chỗ đậu xe</span>
              </label>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Loại căn hộ</label>
              <select {...register("propertyType")} className="w-full px-3 py-2 border rounded-md">
                {Object.values(PropertyTypeEnum).map((type) => (
                  <option key={type} value={type}>
                    {PropertyTypeLabels[type as keyof typeof PropertyTypeEnum]}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <hr />

          {/* === TIỆN ÍCH & ĐIỂM NỔI BẬT === */}
          <section>
            <h4 className="text-lg font-semibold mb-4">Tiện ích & Điểm nổi bật</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Tiện ích</label>
                <div className="space-y-2">
                  {Object.values(AmenityEnum).map((amenity) => (
                    <label key={amenity} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        value={amenity}
                        {...register("amenities")}
                        className="w-4 h-4"
                      />
                      <span>{AmenityLabels[amenity as AmenityEnum]}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Điểm nổi bật</label>
                <div className="space-y-2">
                  {Object.values(HighlightEnum).map((highlight) => (
                    <label key={highlight} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        value={highlight}
                        {...register("highlights")}
                        className="w-4 h-4"
                      />
                      <span>{HighlightLabels[highlight as HighlightEnum]}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <hr />

          {/* === HÌNH ẢNH === */}
          <section>
            <h4 className="text-lg font-semibold mb-4">Hình ảnh</h4>
            <div>
              <label className="block text-sm font-medium mb-2">Thêm ảnh mới</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = e.target.files ? Array.from(e.target.files) : [];
                  setValue("newPhotos", files);
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {previewPhotos.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Ảnh hiện tại ({previewPhotos.length})</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {previewPhotos.map((url, idx) => (
                    <div key={idx} className="relative group aspect-video rounded-lg overflow-hidden bg-gray-100">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          if (url.startsWith("blob:")) {
                            removeNewPhoto(idx - (property.photoUrls?.length || 0));
                          } else {
                            removeExistingPhoto(url, idx);
                          }
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <hr />

          {/* === ĐỊA CHỈ === */}
          <section>
            <h4 className="text-lg font-semibold mb-4">Địa chỉ</h4>
            <div className="space-y-4">
              <input {...register("address")} placeholder="Địa chỉ" className="w-full px-3 py-2 border rounded-md" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input {...register("city")} placeholder="Thành phố" className="w-full px-3 py-2 border rounded-md" />
                <input {...register("state")} placeholder="Quận/Huyện" className="w-full px-3 py-2 border rounded-md" />
                <input {...register("postalCode")} placeholder="Mã bưu chính" className="w-full px-3 py-2 border rounded-md" />
              </div>
              <input {...register("country")} placeholder="Quốc gia" className="w-full px-3 py-2 border rounded-md" />
            </div>
          </section>

          {/* === NÚT LƯU === */}
          <div className="flex justify-end gap-3 pt-6 border-t sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPropertyModal;