
import { CustomFormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { ApplicationFormData, applicationSchema } from "@/lib/schemas";
import { useCreateApplicationMutation, useGetAuthUserQuery } from "@/state/api";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";

// Định nghĩa interface cho props
interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: number;
  startDate?: Date; // Ngày bắt đầu có thể là undefined
  endDate?: Date;   // Ngày kết thúc có thể là undefined
}

const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  onClose,
  propertyId,
  startDate,
  endDate,
}) => {
  const [createApplication] = useCreateApplicationMutation();
  const { data: authUser } = useGetAuthUserQuery();

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      message: "",
      startDate: "", // Khởi tạo rỗng, sẽ được cập nhật sau
      endDate: "",   // Khởi tạo rỗng, sẽ được cập nhật sau
    },
  });

  // Đồng bộ hóa ngày từ props vào form khi modal mở
  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        name: "",
        email: "",
        phoneNumber: "",
        message: "",
        startDate: startDate
          ? startDate.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" })
          : "",
        endDate: endDate
          ? endDate.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" })
          : "",
      });
      console.log("Form Reset:", {
        startDate: startDate
          ? startDate.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" })
          : "",
        endDate: endDate
          ? endDate.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" })
          : "",
      }); // Gỡ lỗi
    }
  }, [isOpen, startDate, endDate, form]);

  // Hàm xử lý submit
  const onSubmit = async (data: ApplicationFormData) => {
    if (!authUser || authUser.userRole !== "tenant") {
      console.error("Bạn cần đăng nhập bằng tài khoản người thuê để đăng ký thuê căn hộ.");
      return;
    }

    // Thêm startDate và endDate vào dữ liệu submit
    const submissionData = {
      ...data,
      applicationDate: new Date().toISOString(),
      status: "Pending",
      propertyId,
      tenantCognitoId: authUser.cognitoInfo.userId,
      startDate: data.startDate, // Gửi trực tiếp từ form
      endDate: data.endDate,     // Gửi trực tiếp từ form
    };

    await createApplication(submissionData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white">
        <DialogHeader className="mb-4">
          <DialogTitle>Đăng ký thuê căn hộ</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <CustomFormField
              name="name"
              label="Họ và Tên"
              type="text"
              placeholder="Nhập họ và tên của bạn"
            />
            <CustomFormField
              name="email"
              label="Email"
              type="email"
              placeholder="Nhập địa chỉ email"
            />
            <CustomFormField
              name="phoneNumber"
              label="Số điện thoại"
              type="text"
              placeholder="Nhập số điện thoại của bạn"
            />
            <CustomFormField
              name="message"
              label="Lời nhắn (không bắt buộc)"
              type="textarea"
              placeholder="Nhập thêm thông tin nếu cần (ví dụ: thời gian dọn vào, yêu cầu đặc biệt...)"
            />
            {/* Hiển thị ngày bắt đầu và kết thúc (readonly) */}
            <CustomFormField
              name="startDate"
              label="Ngày bắt đầu thuê"
              type="text"
              readOnly
              placeholder="Chọn ngày bắt đầu từ lịch"
            />
            <CustomFormField
              name="endDate"
              label="Ngày kết thúc thuê"
              type="text"
              readOnly
              placeholder="Chọn ngày kết thúc từ lịch"
            />
            <Button type="submit" className="bg-primary-700 text-white w-full">
              Gửi đăng ký thuê 
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationModal;
