import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentDate = new Date();

    // Get total properties
    const totalProperties = await prisma.property.count();

    // Get rented properties (properties with paid payments in current month)
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const rentedProperties = await prisma.payment.findMany({
      where: {
        paymentStatus: "Paid",
        paymentDate: { gte: startOfMonth, lte: endOfMonth },
      },
      select: { lease: { select: { propertyId: true } } },
    });
    const uniqueRentedProperties = new Set(rentedProperties.map(p => p.lease?.propertyId).filter(Boolean));
    const rentedPropertiesCount = uniqueRentedProperties.size;

    // Get current month revenue
    const currentMonthRevenueResult = await prisma.payment.aggregate({
      _sum: { amountPaid: true },
      where: {
        paymentStatus: "Paid",
        paymentDate: { gte: startOfMonth, lte: endOfMonth },
      },
    });
    const currentMonthRevenue = currentMonthRevenueResult._sum.amountPaid || 0;

    // Get total tenants
    const totalTenants = await prisma.tenant.count();

    // Get applications today
    const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const endOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);
    const applicationsToday = await prisma.application.count({
      where: { applicationDate: { gte: startOfDay, lte: endOfDay } },
    });

    // Calculate occupancy rate
    const occupancyRate = totalProperties > 0 ? (rentedPropertiesCount / totalProperties) * 100 : 0;

    // Get total revenue
    const totalRevenueResult = await prisma.payment.aggregate({
      _sum: { amountPaid: true },
      where: { paymentStatus: "Paid" },
    });
    const totalRevenue = totalRevenueResult._sum.amountPaid || 0;

    // Get monthly revenue for last 6 months
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
      const monthRevenue = await prisma.payment.aggregate({
        _sum: { amountPaid: true },
        where: {
          paymentStatus: "Paid",
          paymentDate: { gte: monthStart, lte: monthEnd },
        },
      });
      const monthName = monthStart.toLocaleString("vi-VN", { month: "short", year: "numeric" });
      monthlyRevenue.push({
        month: monthName,
        income: monthRevenue._sum.amountPaid || 0,
      });
    }

    // Get recent transactions (only paid ones)
    const recentPayments = await prisma.payment.findMany({
      where: { paymentStatus: "Paid" },
      take: 10,
      orderBy: { paymentDate: "desc" as const },
      include: { lease: { include: { tenant: true } } },
    });

    const recentTransactions = recentPayments
      .filter((payment) => payment.lease?.tenant && payment.paymentDate)
      .map((payment) => ({
        id: payment.id,
        customer: payment.lease!.tenant.name,
        email: payment.lease!.tenant.email,
        phoneNumber: payment.lease!.tenant.phoneNumber,
        date: payment.paymentDate!.toISOString().split("T")[0],
        amount: payment.amountDue,
        status: payment.paymentStatus,
      }));

    // ✅ THÊM: Hiệu suất căn hộ (Property Performance)
    const properties = await prisma.property.findMany({
      include: {
        leases: {
          where: {
            startDate: { lte: currentDate },
            endDate: { gte: currentDate },
          },
          include: { payments: { where: { paymentStatus: "Paid" } } },
        },
        location: true,
      },
    });

    const propertyPerformance = properties.map((prop) => {
      const activeLeases = prop.leases;
      const monthlyRevenue = activeLeases.reduce((sum, lease) => {
        const leaseRevenue = lease.payments
          .filter(
            (p) =>
              p.paymentDate &&
              new Date(p.paymentDate) >= startOfMonth &&
              new Date(p.paymentDate) <= endOfMonth
          )
          .reduce((s, p) => s + Number(p.amountPaid), 0);
        return sum + leaseRevenue;
      }, 0);

      return {
        id: prop.id,
        name: prop.name,
        address: `${prop.location?.address || "N/A"}, ${prop.location?.city || "N/A"}`,
        occupancyRate: activeLeases.length > 0 ? 100 : 0,
        monthlyRevenue: monthlyRevenue || 0,
        status: activeLeases.length > 0 ? "Occupied" : "Vacant",
      };
    });

    // ✅ THÊM: Phân bố địa lý (Geographic Distribution)
    console.log("📍 Raw properties:", properties.map(p => ({ id: p.id, name: p.name, city: p.location?.city })));
    
    const geographicDistribution = properties.reduce(
      (acc, prop) => {
        const city = prop.location?.city || "Unknown";
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log("📊 Geographic distribution (raw):", geographicDistribution);

    const formattedGeographic = Object.entries(geographicDistribution)
      .map(([city, count]) => ({
        city,
        propertyCount: count,
        percentage: ((count / properties.length) * 100).toFixed(2),
      }))
      .sort((a, b) => b.propertyCount - a.propertyCount);

    console.log("📍 Formatted geographic:", formattedGeographic);

    // ✅ THÊM: Cảnh báo hết hạn hợp đồng (Lease Expiration Alerts)
    const next90Days = new Date(currentDate.getTime() + 90 * 24 * 60 * 60 * 1000);
    const expiringLeases = await prisma.lease.findMany({
      where: {
        endDate: { gte: currentDate, lte: next90Days },
      },
      include: { tenant: true, property: true },
      orderBy: { endDate: "asc" },
    });

    const leaseAlerts = expiringLeases.map((lease) => {
      const daysRemaining = Math.ceil(
        (new Date(lease.endDate).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let priority: "Critical" | "High" | "Low" = "Low";
      if (daysRemaining <= 7) priority = "Critical";
      else if (daysRemaining <= 30) priority = "High";

      return {
        id: lease.id,
        tenant: lease.tenant.name,
        property: lease.property.name,
        expiryDate: lease.endDate.toISOString().split("T")[0],
        daysRemaining,
        priority,
      };
    });

    const stats = {
      totalProperties,
      rentedProperties: rentedPropertiesCount,
      currentMonthRevenue,
      totalTenants,
      applicationsToday,
      occupancyRate,
      totalRevenue,
      monthlyRevenue,
      recentTransactions,
      propertyPerformance, // ✅ Thêm
      geographicDistribution: formattedGeographic, // ✅ Thêm
      leaseExpirationAlerts: leaseAlerts, // ✅ Thêm
    };

    res.json(stats);
  } catch (error: any) {
    console.error("Error retrieving stats:", error);
    res.status(500).json({ message: `Error retrieving stats: ${error.message}` });
  }
};
