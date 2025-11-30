import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getPropertyPerformance = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("🏢 Fetching property performance from env...");

    // Get property performance data from environment variables
    const propertyPerformanceData = process.env.PROPERTY_PERFORMANCE_DATA;

    if (!propertyPerformanceData) {
      console.warn("⚠️ PROPERTY_PERFORMANCE_DATA not found in environment variables");
      res.json([]);
      return;
    }

    // Parse the JSON data from env
    const propertyPerformance = JSON.parse(propertyPerformanceData);

    res.json(propertyPerformance);
  } catch (error: any) {
    console.error("❌ Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getGeographicDistribution = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("📍 Fetching geographic distribution...");
    const properties = await prisma.property.findMany({
      include: { location: true },
    });

    const distribution = properties.reduce((acc, prop) => {
      const city = prop.location?.city || "Unknown";
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const formatted = Object.entries(distribution)
      .map(([city, count]) => ({
        city,
        propertyCount: count,
        percentage: ((count / properties.length) * 100).toFixed(2),
      }))
      .sort((a, b) => b.propertyCount - a.propertyCount);

    res.json(formatted);
  } catch (error: any) {
    console.error("❌ Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getLeaseExpirationAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("⏰ Fetching lease expiration alerts...");
    const currentDate = new Date();
    const next90Days = new Date(currentDate.getTime() + 90 * 24 * 60 * 60 * 1000);

    const expiringLeases = await prisma.lease.findMany({
      where: { endDate: { gte: currentDate, lte: next90Days } },
      include: { tenant: true, property: true },
      orderBy: { endDate: "asc" },
    });

    const alerts = expiringLeases.map((lease) => {
      const daysRemaining = Math.ceil((new Date(lease.endDate).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
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

    res.json(alerts);
  } catch (error: any) {
    console.error("❌ Error:", error);
    res.status(500).json({ message: error.message });
  }
};