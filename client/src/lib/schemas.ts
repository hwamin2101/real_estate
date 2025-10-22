import * as z from "zod";
import { PropertyTypeEnum } from "@/lib/constants";

export const propertySchema = z.object({
 name: z.string().min(1, "Vui lòng nhập tên căn hộ"),
  description: z.string().min(1, "Vui lòng nhập mô tả chi tiết"),//Đổi thành thuê theo ngày
  pricePerMonth: z
    .coerce.number()
    .positive("Giá phải lớn hơn 0")
    .min(0, "Giá không hợp lệ")
    .int("Giá phải là số nguyên"),
  securityDeposit: z
    .coerce.number()
    .positive("Đặt cọc phải lớn hơn 0")
    .min(0, "Giá trị đặt cọc không hợp lệ")
    .int("Phải là số nguyên"),
  applicationFee: z
    .coerce.number()
    .positive("Phí đăng ký phải lớn hơn 0")
    .min(0, "Phí đăng ký không hợp lệ")
    .int("Phải là số nguyên"),
  isPetsAllowed: z.boolean(),
  isParkingIncluded: z.boolean(),
  photoUrls: z
    .array(z.instanceof(File))
    .min(1, "Vui lòng tải lên ít nhất một hình ảnh"),
  amenities: z
  .array(z.string())
  .min(1, "Vui lòng chọn ít nhất một tiện nghi"),
highlights: z
  .array(z.string())
  .min(1, "Vui lòng chọn ít nhất một điểm nổi bật"),

  beds: z
    .coerce.number()
    .positive("Số giường phải lớn hơn 0")
    .min(0)
    .max(10, "Tối đa 10 giường")
    .int("Phải là số nguyên"),
  baths: z
    .coerce.number()
    .positive("Số phòng tắm phải lớn hơn 0")
    .min(0)
    .max(10, "Tối đa 10 phòng tắm")
    .int("Phải là số nguyên"),
  squareFeet: z
    .coerce.number()
    .int("Diện tích phải là số nguyên")
    .positive("Diện tích phải lớn hơn 0"),
  propertyType: z.nativeEnum(PropertyTypeEnum),
  address: z.string().min(1, "Vui lòng nhập địa chỉ"),
  city: z.string().min(1, "Vui lòng nhập thành phố"),
  state: z.string().min(1, "Vui lòng nhập Quận"),
  country: z.string().min(1, "Vui lòng nhập quốc gia"),
  postalCode: z.string().min(1, "Vui lòng nhập mã bưu chính"),
});

export type PropertyFormData = z.infer<typeof propertySchema>;

export const applicationSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập họ tên"),
  email: z.string().email("Email không hợp lệ"),
  phoneNumber: z
    .string()
    .min(10, "Số điện thoại phải có ít nhất 10 chữ số")
    .max(15, "Số điện thoại không được quá 15 chữ số"),
  message: z.string().optional(),
  startDate: z.string().min(1, "Vui lòng chọn ngày bắt đầu thuê"), // Thêm trường ngày bắt đầu
  endDate: z.string().min(1, "Vui lòng chọn ngày kết thúc thuê"),   // Thêm trường ngày kết thúc
});

export type ApplicationFormData = z.infer<typeof applicationSchema>;

export const settingsSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập họ tên"),
  email: z.string().email("Email không hợp lệ"),
  phoneNumber: z
    .string()
    .min(10, "Số điện thoại phải có ít nhất 10 chữ số")
    .max(15, "Số điện thoại không được quá 15 chữ số"),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
