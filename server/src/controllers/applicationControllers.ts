
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
    console.log("status:", status);

    const application = await prisma.application.findUnique({
      where: { id: Number(id) },
      include: {
        property: true,
        tenant: true,
        lease: true, // Bao gồm lease để kiểm tra
      },
    });

    if (!application) {
      res.status(404).json({ message: "Application not found." });
      return;
    }

    if (status === "Approved") {
      const newLease = await prisma.lease.create({
        data: {
          startDate: application.startDate || new Date(), // Sử dụng startDate từ Application
          endDate: application.endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Sử dụng endDate từ Application
          rent: application.property.pricePerMonth,
          deposit: application.property.securityDeposit,
          propertyId: application.propertyId,
          tenantCognitoId: application.tenantCognitoId,
        },
      });

      // Update the property to connect the tenant
      await prisma.property.update({
        where: { id: application.propertyId },
        data: {
          tenants: {
            connect: { cognitoId: application.tenantCognitoId },
          },
        },
      });

      // Update the application with the new lease ID
      await prisma.application.update({
        where: { id: Number(id) },
        data: { status, leaseId: newLease.id },
        include: {
          property: true,
          tenant: true,
          lease: true,
        },
      });
    } else {
      // Update the application status (for both "Denied" and other statuses)
      await prisma.application.update({
        where: { id: Number(id) },
        data: { status },
      });
    }

    // Respond with the updated application details
    const updatedApplication = await prisma.application.findUnique({
      where: { id: Number(id) },
      include: {
        property: true,
        tenant: true,
        lease: true,
      },
    });

    res.json(updatedApplication);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error updating application status: ${error.message}` });
  }
};