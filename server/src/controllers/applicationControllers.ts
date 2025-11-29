
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const listApplications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Query Params:", req.query); // Gỡ lỗi query parameters
    const { userId, userType } = req.query;

    let whereClause = {};

    if (userId && userType) {
      if (userType === "tenant") {
        whereClause = { tenantCognitoId: String(userId) };
        console.log("Where Clause for tenant:", whereClause); // Gỡ lỗi
      } else if (userType === "manager") {
        whereClause = {
          property: {
            managerCognitoId: String(userId),
          },
        };
        console.log("Where Clause for manager:", whereClause); // Gỡ lỗi
      } else {
        console.log("Invalid userType:", userType); // Gỡ lỗi
        res.status(400).json({ message: "Invalid userType" });
        return;
      }
    } else {
      console.log("Missing userId or userType"); // Gỡ lỗi
      res.status(400).json({ message: "Missing userId or userType" });
      return;
    }

    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        property: {
          include: {
            location: true,
            manager: true,
          },
        },
        tenant: true,
        lease: true, // Đảm bảo bao gồm lease
      },
    }).catch((err) => {
      console.error("Database query error:", err); // Gỡ lỗi
      throw err;
    });

    console.log("Applications found:", applications.length); // Gỡ lỗi

    function calculateNextPaymentDate(startDate: Date): Date {
      const today = new Date();
      const nextPaymentDate = new Date(startDate);
      while (nextPaymentDate <= today) {
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      }
      return nextPaymentDate;
    }

    const formattedApplications = await Promise.all(
      applications.map(async (app) => {
        let lease = null;
        try {
          lease = await prisma.lease.findFirst({
            where: {
              tenant: {
                cognitoId: app.tenantCognitoId,
              },
              propertyId: app.propertyId,
            },
            orderBy: { startDate: "desc" },
          });
        } catch (err) {
          console.error("Error finding lease for app:", app.id, err); // Gỡ lỗi
        }

        return {
          ...app,
          property: {
            ...app.property,
            address: app.property.location.address,
          },
          manager: app.property.manager,
          lease: lease
            ? {
                ...lease,
                nextPaymentDate: calculateNextPaymentDate(lease.startDate),
              }
            : null,
        };
      })
    );

    console.log("Formatted Applications:", formattedApplications); // Gỡ lỗi
    res.json(formattedApplications);
  } catch (error: any) {
    console.error("Error in listApplications:", error); // Gỡ lỗi
    res
      .status(500)
      .json({ message: `Error retrieving applications: ${error.message}` });
  }
};

export const createApplication = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      applicationDate,
      status,
      propertyId,
      tenantCognitoId,
      name,
      email,
      phoneNumber,
      message,
      startDate, // Lấy từ form
      endDate,   // Lấy từ form
    } = req.body;

    console.log("Received Request Body:", req.body); // Gỡ lỗi

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { pricePerMonth: true, securityDeposit: true },
    });

    if (!property) {
      res.status(404).json({ message: "Property not found" });
      return;
    }

    const newApplication = await prisma.$transaction(async (prisma) => {
      // Create lease with default values (will be updated when approved)
      const lease = await prisma.lease.create({
        data: {
          startDate: new Date(), // Default, sẽ cập nhật khi approved
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Default
          rent: property.pricePerMonth,
          deposit: property.securityDeposit,
          property: {
            connect: { id: propertyId },
          },
          tenant: {
            connect: { cognitoId: tenantCognitoId },
          },
        },
      });

      // Create application with startDate and endDate from form
      const application = await prisma.application.create({
        data: {
          applicationDate: new Date(applicationDate),
          status,
          name,
          email,
          phoneNumber,
          message,
          startDate: startDate ? new Date(startDate) : null, // Lưu ngày từ form
          endDate: endDate ? new Date(endDate) : null,       // Lưu ngày từ form
          property: {
            connect: { id: propertyId },
          },
          tenant: {
            connect: { cognitoId: tenantCognitoId },
          },
          lease: {
            connect: { id: lease.id },
          },
        },
        include: {
          property: true,
          tenant: true,
          lease: true,
        },
      });

      return application;
    });

    res.status(201).json(newApplication);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error creating application: ${error.message}` });
  }
};

export const updateApplicationStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const applicationId = Number(id);

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        property: {
          select: {
            pricePerMonth: true,
            securityDeposit: true,
          },
        },
        lease: true,
      },
    });

    if (!application) {
      res.status(404).json({ message: "Application not found." });
      return;
    }

    if (status === "Approved") {
      // Nếu đã có lease rồi thì không tạo lại
      if (application.lease) {
        await prisma.application.update({
          where: { id: applicationId },
          data: { status: "Approved" },
        });

        const updated = await prisma.application.findUnique({
          where: { id: applicationId },
          include: { property: true, tenant: true, lease: true },
        });

        res.json(updated);
        return;
      }

      const startDate = application.startDate || new Date();
      const endDate = application.endDate || new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());

      // Tạo lease + tất cả payments trong transaction (an toàn)
      const result = await prisma.$transaction(async (tx) => {
        // 1. Tạo Lease
        const lease = await tx.lease.create({
          data: {
            startDate,
            endDate,
            rent: application.property.pricePerMonth,
            deposit: application.property.securityDeposit,
            propertyId: application.propertyId,
            tenantCognitoId: application.tenantCognitoId,
          },
        });

 // 2. Tạo danh sách Payment (12 tháng hoặc theo số tháng thực tế)
const payments = [];

let currentDueDate = new Date(startDate);
currentDueDate.setDate(1); // Bắt đầu từ ngày 1 của tháng

while (currentDueDate <= endDate) {
  // ← TẠO BIẾN payment TRƯỚC KHI PUSH!
  const payment = await tx.payment.create({
    data: {
      leaseId: lease.id,
      amountDue: application.property.pricePerMonth,
      dueDate: new Date(currentDueDate),
      paymentStatus: "Pending",
    },
  });

  payments.push(payment); // ← ĐÚNG RỒI! payment (không phải payments)

  // Tăng đúng 1 tháng
  currentDueDate.setMonth(currentDueDate.getMonth() + 1);
}   

        // Cập nhật application để nối với lease
        await tx.application.update({
          where: { id: applicationId },
          data: {
            status: "Approved",
            leaseId: lease.id,
          },
        });

        return { lease, payments };
      });

      console.log(`Tạo thành công lease ID ${result.lease.id} với ${result.payments.length} kỳ thanh toán`);

      // Trả về application đã cập nhật
      const updatedApp = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          property: true,
          tenant: true,
          lease: {
            include: {
              payments: {
                orderBy: { dueDate: "asc" },
              },
            },
          },
        },
      });

      res.json(updatedApp);
    } else {
      // Các trạng thái khác: Denied, Pending...
      await prisma.application.update({
        where: { id: applicationId },
        data: { status },
      });

      const updated = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { property: true, tenant: true, lease: true },
      });

      res.json(updated);
    }
  } catch (error: any) {
    console.error("Error updating application status:", error);
    res.status(500).json({ message: error.message || "Lỗi server" });
  }
};
export const getApplicationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const applicationId = Number(id);

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        property: {
          include: {
            location: true,
            manager: true,
          },
        },
        tenant: true,
        lease: {
          include: {
            payments: {
              orderBy: { dueDate: "asc" },
            },
          },
        },
      },
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // ĐẢM BẢO middleware auth đã gán req.user đúng cách
if (!req.user || !req.user.sub || !req.user.role) {
  return res.status(401).json({ message: "Unauthorized - Missing user info" });
}

const userId = req.user.sub;      // ← Dùng sub (cognitoId)
const userRole = req.user.role;   // ← role: "tenant" | "manager"

    if (!userId || !userRole) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Tenant chỉ được xem đơn của mình
    if (userRole === "tenant" && application.tenantCognitoId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Manager chỉ được xem đơn của căn hộ mình quản lý
    if (userRole === "manager") {
      const isOwner = await prisma.property.findFirst({
        where: {
          id: application.propertyId,
          managerCognitoId: userId,
        },
      });
      if (!isOwner) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    res.json(application);
  } catch (error: any) {
    console.error("Error in getApplicationById:", error);
    res.status(500).json({ message: "Server error" });
  }
};