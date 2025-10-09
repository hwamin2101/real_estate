
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
      console.error("You must be logged in as a tenant to submit an application");
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
          <DialogTitle>Submit Application for this Property</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <CustomFormField
              name="name"
              label="Name"
              type="text"
              placeholder="Enter your full name"
            />
            <CustomFormField
              name="email"
              label="Email"
              type="email"
              placeholder="Enter your email address"
            />
            <CustomFormField
              name="phoneNumber"
              label="Phone Number"
              type="text"
              placeholder="Enter your phone number"
            />
            <CustomFormField
              name="message"
              label="Message (Optional)"
              type="textarea"
              placeholder="Enter any additional information"
            />
            {/* Hiển thị ngày bắt đầu và kết thúc (readonly) */}
            <CustomFormField
              name="startDate"
              label="Start Date"
              type="text"
              readOnly
              placeholder="Select start date from calendar"
            />
            <CustomFormField
              name="endDate"
              label="End Date"
              type="text"
              readOnly
              placeholder="Select end date from calendar"
            />
            <Button type="submit" className="bg-primary-700 text-white w-full">
              Submit Application
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationModal;
