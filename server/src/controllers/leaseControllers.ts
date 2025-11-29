import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getLeases = async (req: Request, res: Response): Promise<void> => {
  try {
    const leases = await prisma.lease.findMany({
      include: {
        tenant: true,
        property: true,
      },
    });
    res.json(leases);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving leases: ${error.message}` });
  }
};

export const getLeasePayments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const payments = await prisma.payment.findMany({
      where: { leaseId: Number(id) },
    });
    res.json(payments);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving lease payments: ${error.message}` });
  }
};

export const getLeaseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const lease = await prisma.lease.findUnique({
      where: { id: Number(id) },
      include: {
        tenant: true,
        property: true,
        payments: true,   // Nếu muốn trả luôn payments
      },
    });

    if (!lease) {
      res.status(404).json({ message: "Lease not found" });
      return;
    }

    res.json(lease);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving lease detail: ${error.message}` });
  }
};


export const getApplicationPaymentSchedule = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const applicationId = Number(id);

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        lease: {
          include: {
            payments: {
              orderBy: { dueDate: "asc" },
            },
          },
        },
        property: true,
      },
    });

    if (!application || !application.lease) {
      res.status(404).json({ message: "Không tìm thấy hợp đồng thuê" });
      return;
    }

    const { lease } = application;
    const rentAmount = lease.rent || application.property!.pricePerMonth;

    // TẠO THẬT CÁC KỲ THANH TOÁN TRONG DB NẾU CHƯA CÓ
    const startDate = new Date(lease.startDate);
    const endDate = new Date(lease.endDate);
    let currentDate = new Date(startDate);
    currentDate.setDate(1); // Đầu tháng

    const createdPayments: any[] = [];

    while (currentDate <= endDate) {
      const dueDate = new Date(currentDate);
      dueDate.setMonth(dueDate.getMonth() + 1); // Hạn: đầu tháng sau

      // Kiểm tra xem kỳ này đã tồn tại chưa
      const existing = lease.payments.find((p: any) => {
        const pDue = new Date(p.dueDate);
        return pDue.getFullYear() === dueDate.getFullYear() && pDue.getMonth() === dueDate.getMonth();
      });

      if (!existing) {
        // TẠO THẬT TRONG DB
        const newPayment = await prisma.payment.create({
          data: {
            leaseId: lease.id,
            amountDue: rentAmount,
            amountPaid: 0,
            dueDate,
            paymentStatus: "Pending",
          },
        });
        createdPayments.push(newPayment);
      }

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Lấy lại danh sách đầy đủ sau khi tạo (bao gồm cũ + mới tạo)
    const allPayments = await prisma.payment.findMany({
      where: { leaseId: lease.id },
      orderBy: { dueDate: "asc" },
    });

    res.json(allPayments);
  } catch (error: any) {
    console.error("Error in getApplicationPaymentSchedule:", error);
    res.status(500).json({ message: `Lỗi server: ${error.message}` });
  }
};
