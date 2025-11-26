import { Request, Response } from "express";
import { PrismaClient, Prisma, PropertyType } from "@prisma/client";
import { wktToGeoJSON } from "@terraformer/wkt";
import { S3Client } from "@aws-sdk/client-s3";
import { Location } from "@prisma/client";
import { Upload } from "@aws-sdk/lib-storage";
import axios from "axios";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Amenity, Highlight } from "@prisma/client";

const prisma = new PrismaClient();

const s3Client = new S3Client({
  region: process.env.APP_AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// ==============================
// 1. GET ALL PROPERTIES
// ==============================
export const getProperties = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      favoriteIds,
      priceMin,
      priceMax,
      beds,
      baths,
      propertyType,
      squareFeetMin,
      squareFeetMax,
      amenities,
      availableFrom,
      latitude,
      longitude,
    } = req.query;

    let whereConditions: Prisma.Sql[] = [];

    if (favoriteIds) {
      const favoriteIdsArray = (favoriteIds as string).split(",").map(Number);
      whereConditions.push(
        Prisma.sql`p.id IN (${Prisma.join(favoriteIdsArray)})`
      );
    }

    if (priceMin) {
      whereConditions.push(
        Prisma.sql`p."pricePerMonth" >= ${Number(priceMin)}`
      );
    }

    if (priceMax) {
      whereConditions.push(
        Prisma.sql`p."pricePerMonth" <= ${Number(priceMax)}`
      );
    }

    if (beds && beds !== "any") {
      whereConditions.push(Prisma.sql`p.beds >= ${Number(beds)}`);
    }

    if (baths && baths !== "any") {
      whereConditions.push(Prisma.sql`p.baths >= ${Number(baths)}`);
    }

    if (squareFeetMin) {
      whereConditions.push(
        Prisma.sql`p."squareFeet" >= ${Number(squareFeetMin)}`
      );
    }

    if (squareFeetMax) {
      whereConditions.push(
        Prisma.sql`p."squareFeet" <= ${Number(squareFeetMax)}`
      );
    }

    if (propertyType && propertyType !== "any") {
      whereConditions.push(
        Prisma.sql`p."propertyType" = ${propertyType}::"PropertyType"`
      );
    }

    if (amenities && amenities !== "any") {
      const amenitiesArray = (amenities as string)
        .split(",")
        .map((a) => a.trim());

      const validAmenities = amenitiesArray.filter((a) =>
        Object.values(Amenity).includes(a as any)
      );

      if (validAmenities.length > 0) {
        whereConditions.push(
          Prisma.sql`p.amenities @> ${validAmenities}::"Amenity"[]`
        );
      }
    }

    if (availableFrom && availableFrom !== "any") {
      const availableFromDate =
        typeof availableFrom === "string" ? availableFrom : null;
      if (availableFromDate) {
        const date = new Date(availableFromDate);
        if (!isNaN(date.getTime())) {
          whereConditions.push(
            Prisma.sql`EXISTS (
              SELECT 1 FROM "Lease" l 
              WHERE l."propertyId" = p.id 
              AND l."startDate" <= ${date.toISOString()}
            )`
          );
        }
      }
    }

    if (latitude && longitude) {
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const radiusInKilometers = 1000;
      const degrees = radiusInKilometers / 111;

      whereConditions.push(
        Prisma.sql`ST_DWithin(
          l.coordinates::geometry,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
          ${degrees}
        )`
      );
    }

    const completeQuery = Prisma.sql`
      SELECT 
        p.*,
        json_build_object(
          'id', l.id,
          'address', l.address,
          'city', l.city,
          'state', l.state,
          'country', l.country,
          'postalCode', l."postalCode",
          'coordinates', json_build_object(
            'longitude', ST_X(l."coordinates"::geometry),
            'latitude', ST_Y(l."coordinates"::geometry)
          )
        ) as location
      FROM "Property" p
      JOIN "Location" l ON p."locationId" = l.id
      ${
        whereConditions.length > 0
          ? Prisma.sql`WHERE ${Prisma.join(whereConditions, " AND ")}`
          : Prisma.empty
      }
    `;

    const properties = await prisma.$queryRaw(completeQuery);

    res.json(properties);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving properties: ${error.message}` });
  }
};

// ==============================
// 2. GET SINGLE PROPERTY
// ==============================
export const getProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const property = await prisma.property.findUnique({
      where: { id: Number(id) },
      include: {
        location: true,
      },
    });

    if (property) {
      const coordinates: { coordinates: string }[] =
        await prisma.$queryRaw`SELECT ST_asText(coordinates) as coordinates from "Location" where id = ${property.location.id}`;

      const geoJSON: any = wktToGeoJSON(coordinates[0]?.coordinates || "");
      const longitude = geoJSON.coordinates[0];
      const latitude = geoJSON.coordinates[1];

      const propertyWithCoordinates = {
        ...property,
        location: {
          ...property.location,
          coordinates: {
            longitude,
            latitude,
          },
        },
      };
      res.json(propertyWithCoordinates);
    } else {
      res.status(404).json({ message: "Property not found" });
    }
  } catch (err: any) {
    res
      .status(500)
      .json({ message: `Error retrieving property: ${err.message}` });
  }
};

// ==============================
// 3. CREATE PROPERTY
// ==============================
export const createProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    const {
      address,
      city,
      state,
      country,
      postalCode,
      managerCognitoId,
      ...propertyData
    } = req.body;

    // 1. Upload ảnh lên S3
    const photoUrls = await Promise.all(
      files.map(async (file) => {
        const uploadParams = {
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: `properties/${Date.now()}-${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        };

        const uploadResult = await new Upload({
          client: s3Client,
          params: uploadParams,
        }).done();

        return uploadResult.Location;
      })
    );

    // 2. Geocoding bằng Nominatim
    const geocodingUrl = `https://nominatim.openstreetmap.org/search?${new URLSearchParams(
      {
        street: address,
        city,
        country,
        postalcode: postalCode,
        format: "json",
        limit: "1",
      }
    ).toString()}`;

    const geocodingResponse = await axios.get(geocodingUrl, {
      headers: {
        "User-Agent": "RealEstateApp (justsomedummyemail@gmail.com)",
      },
    });

    const [longitude, latitude] =
      geocodingResponse.data[0]?.lon && geocodingResponse.data[0]?.lat
        ? [
            parseFloat(geocodingResponse.data[0].lon),
            parseFloat(geocodingResponse.data[0].lat),
          ]
        : [0, 0];

    // 3. Tạo Location với PostGIS
    const [location] = await prisma.$queryRaw<any[]>`
      INSERT INTO "Location" (address, city, state, country, "postalCode", coordinates)
      VALUES (
        ${address},
        ${city},
        ${state},
        ${country},
        ${postalCode},
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
      )
      RETURNING id, address, city, state, country, "postalCode", ST_AsText(coordinates) as coordinates;
    `;

    // 4. Helper: Chuẩn hóa mảng từ frontend (string, JSON, array đều ok)
    const normalizeArray = (input: any): string[] => {
      if (Array.isArray(input)) return input;
      if (typeof input === "string") {
        try {
          const parsed = JSON.parse(input);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return input
            .split(",")
            .map((s: string) => s.replace(/[\[\]\"]/g, "").trim())
            .filter(Boolean);
        }
      }
      return [];
    };

    // 5. Map từ tiếng Việt (hoặc key) → Prisma Enum
    const mapToAmenity = (str: string): Amenity | undefined => {
      const vietnameseMap: Record<string, Amenity> = {
        "Tủ lạnh": Amenity.Refrigerator,
        "Điều hòa": Amenity.AirConditioning,
        "Máy giặt & sấy": Amenity.WasherDryer,
        "Máy rửa bát": Amenity.Dishwasher,
        "Internet tốc độ cao": Amenity.HighSpeedInternet,
        "Wi-Fi miễn phí": Amenity.WiFi,
        "Bãi đỗ xe": Amenity.Parking,
        "Phòng tập thể dục": Amenity.Gym,
        "Hồ bơi": Amenity.Pool,
        "Cho phép vật nuôi": Amenity.PetsAllowed,
        "Lò vi sóng": Amenity.Microwave,
        "Sàn gỗ": Amenity.HardwoodFloors,
        "Tủ quần áo lớn": Amenity.WalkInClosets,
      };
      return vietnameseMap[str.trim()] || (Amenity as any)[str];
    };

    const mapToHighlight = (str: string): Highlight | undefined => {
      const vietnameseMap: Record<string, Highlight> = {
        "Điều hòa không khí": Highlight.AirConditioning,
        "Truy cập Internet tốc độ cao": Highlight.HighSpeedInternetAccess,
        "Máy giặt & sấy": Highlight.WasherDryer,
        "Hệ thống sưởi": Highlight.Heating,
        "Không hút thuốc": Highlight.SmokeFree,
        "Tầm nhìn đẹp": Highlight.GreatView,
        "Khu dân cư yên tĩnh": Highlight.QuietNeighborhood,
        "Mới được cải tạo": Highlight.RecentlyRenovated,
        "Gần phương tiện công cộng": Highlight.CloseToTransit,
        "Bồn rửa đôi": Highlight.DoubleVanities,
        "Bồn tắm & vòi sen": Highlight.TubShower,
      };
      return vietnameseMap[str.trim()] || (Highlight as any)[str];
    };

    // 6. Tạo Property – ĐÃ SỬA HOÀN TOÀN
    const newProperty = await prisma.property.create({
      data: {
        ...propertyData,
        name: propertyData.name,
        description: propertyData.description,
        pricePerMonth: parseFloat(propertyData.pricePerMonth),
        securityDeposit: parseFloat(propertyData.securityDeposit),
        applicationFee: parseFloat(propertyData.applicationFee),
        beds: parseInt(propertyData.beds),
        baths: parseFloat(propertyData.baths),
        squareFeet: parseInt(propertyData.squareFeet),
        propertyType: propertyData.propertyType as PropertyType,
        isPetsAllowed: propertyData.isPetsAllowed === "true" || propertyData.isPetsAllowed === true,
        isParkingIncluded: propertyData.isParkingIncluded === "true" || propertyData.isParkingIncluded === true,

        photoUrls,
        locationId: location.id,
        managerCognitoId,

        // ĐÚNG 100% – CHỖ QUAN TRỌNG NHẤT
        amenities: normalizeArray(propertyData.amenities)
          .map(mapToAmenity)
          .filter(Boolean) as Amenity[],

        highlights: normalizeArray(propertyData.highlights)
          .map(mapToHighlight)
          .filter(Boolean) as Highlight[],
      },
      include: {
        location: true,
        manager: true,
      },
    });

    res.status(201).json(newProperty);
  } catch (err: any) {
    console.error("Error creating property:", err);
    res.status(500).json({
      message: "Error creating property",
      error: err.message,
    });
  }
};

// ==============================
// 4. UPDATE PROPERTY – HOÀN CHỈNH
// ==============================
export const updateProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const propertyId = Number(id);

    if (isNaN(propertyId)) {
      res.status(400).json({ error: "ID không hợp lệ" });
      return;
    }

    const files = Array.isArray(req.files) ? (req.files as Express.Multer.File[]) : [];
    const { formData, ...propertyData } = req.body;

    console.log("=== UPDATE PROPERTY START ===");
    console.log("REQ.BODY:", req.body);
    console.log("FILES:", files.length);

    // === 1️⃣ Xử lý danh sách ảnh cần xóa ===
    let urlsToDelete: string[] = [];
    if (req.body.deletePhotoUrls) {
      try {
        urlsToDelete = Array.isArray(req.body.deletePhotoUrls)
          ? req.body.deletePhotoUrls
          : typeof req.body.deletePhotoUrls === "string"
          ? JSON.parse(req.body.deletePhotoUrls)
          : [];
      } catch {
        console.warn("⚠️ deletePhotoUrls không hợp lệ:", req.body.deletePhotoUrls);
      }
    }
    console.log("PHOTO TO DELETE:", urlsToDelete);

    // === 2️⃣ Lấy Property hiện tại ===
    const existingProperty = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { location: true },
    });

    if (!existingProperty) {
      res.status(404).json({ error: "Không tìm thấy căn hộ" });
      return;
    }

    // === 3️⃣ Upload ảnh mới (nếu có) ===
    let newPhotoUrls: string[] = [];
    if (files.length > 0) {
      const uploadResults = await Promise.all(
        files.map(async (file) => {
          try {
            const uploadParams = {
              Bucket: process.env.S3_BUCKET_NAME!,
              Key: `properties/${Date.now()}-${file.originalname}`,
              Body: file.buffer,
              ContentType: file.mimetype,
            };
            const uploadResult = await new Upload({
              client: s3Client,
              params: uploadParams,
            }).done();
            return uploadResult.Location;
          } catch (err) {
            console.error("❌ S3 upload failed:", err);
            return undefined;
          }
        })
      );
      newPhotoUrls = uploadResults.filter((url): url is string => Boolean(url));
    }

    // === 4️⃣ Parse các trường dạng mảng ===
    const parseArray = (input: any): string[] => {
      if (Array.isArray(input)) return input;
      if (typeof input === "string") {
        try {
          const parsed = JSON.parse(input);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return input.split(",").map((s: string) => s.trim()).filter(Boolean);
        }
      }
      return [];
    };

    const amenities = parseArray(propertyData.amenities);
    const highlights = parseArray(propertyData.highlights);

    // === 5️⃣ Chuẩn bị dữ liệu cập nhật ===
    const updateData: any = {};

    // Text fields
    if (propertyData.name && propertyData.name !== existingProperty.name) {
      updateData.name = propertyData.name;
    }
    if (propertyData.description && propertyData.description !== existingProperty.description) {
      updateData.description = propertyData.description;
    }

    // Number fields
    if (propertyData.pricePerMonth !== undefined)
      updateData.pricePerMonth = parseFloat(propertyData.pricePerMonth);
    if (propertyData.securityDeposit !== undefined)
      updateData.securityDeposit = parseFloat(propertyData.securityDeposit);
    if (propertyData.applicationFee !== undefined)
      updateData.applicationFee = parseFloat(propertyData.applicationFee);
    if (propertyData.beds !== undefined)
      updateData.beds = parseInt(propertyData.beds);
    if (propertyData.baths !== undefined)
      updateData.baths = parseFloat(propertyData.baths);
    if (propertyData.squareFeet !== undefined)
      updateData.squareFeet = parseInt(propertyData.squareFeet);

    // Boolean fields
    if (propertyData.isPetsAllowed !== undefined)
      updateData.isPetsAllowed = propertyData.isPetsAllowed === "true" || propertyData.isPetsAllowed === true;
    if (propertyData.isParkingIncluded !== undefined)
      updateData.isParkingIncluded = propertyData.isParkingIncluded === "true" || propertyData.isParkingIncluded === true;

    // Enum field
    if (propertyData.propertyType && propertyData.propertyType !== existingProperty.propertyType) {
      updateData.propertyType = propertyData.propertyType;
    }

    // === 6️⃣ Cập nhật danh sách ảnh ===
    updateData.photoUrls = {
      set: [
        ...(existingProperty.photoUrls || []).filter((url) => !urlsToDelete.includes(url)),
        ...newPhotoUrls,
      ],
    };

    // === 7️⃣ Cập nhật amenities & highlights (enum[]) ===
    if (amenities.length > 0) updateData.amenities = { set: amenities };
    if (highlights.length > 0) updateData.highlights = { set: highlights };

    // === 8️⃣ Location (nếu thay đổi) ===
    if (
  propertyData.address ||
  propertyData.city ||
  propertyData.state ||
  propertyData.country ||
  propertyData.postalCode
) {
  if (existingProperty.locationId) {
    // Property đã có location -> update
    updateData.location = {
      update: {
        ...(propertyData.address && { address: propertyData.address }),
        ...(propertyData.city && { city: propertyData.city }),
        ...(propertyData.state && { state: propertyData.state }),
        ...(propertyData.country && { country: propertyData.country }),
        ...(propertyData.postalCode && { postalCode: propertyData.postalCode }),
      },
    };
  } else {
    // Property chưa có location -> create mới
    updateData.location = {
      create: {
        address: propertyData.address ?? "",
        city: propertyData.city ?? "",
        state: propertyData.state ?? "",
        country: propertyData.country ?? "",
        postalCode: propertyData.postalCode ?? "",
        coordinates: undefined, // Nếu muốn geocoding, xử lý ở đây
      },
    };
  }
}

    // === 9️⃣ Kiểm tra nếu không có gì thay đổi ===
    if (Object.keys(updateData).length === 0) {
      console.log("⚙️ Không có thay đổi - Trả về dữ liệu cũ");
      res.json(existingProperty);
      return;
    }

    // === 🔟 Cập nhật DB ===
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: updateData,
      include: { location: true, manager: true },
    });

    console.log("✅ UPDATED PROPERTY:", updatedProperty.id);
    res.json(updatedProperty);
  } catch (err: any) {
    console.error("🔥 UPDATE PROPERTY ERROR:", err);
    res.status(500).json({
      message: "Cập nhật thất bại",
      error: err.message,
    });
  }
};


// ==============================
// 5. DELETE PROPERTY – HOÀN CHỈNH
// ==============================
export const deleteProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const propertyId = Number(id);

    if (isNaN(propertyId)) {
      res.status(400).json({ error: "ID căn hộ không hợp lệ" });
      return;
    }

    console.log("=== DELETE PROPERTY START ===");
    console.log("PROPERTY ID:", propertyId);

    // === 1. KIỂM TRA HỢP ĐỒNG ĐANG ACTIVE ===
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeLease = await prisma.lease.findFirst({
      where: {
        propertyId,
        startDate: { lte: today },
        endDate: { gte: today },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        tenant: { select: { name: true } },
      },
    });

    if (activeLease) {
      console.log("CẢNH BÁO: Căn hộ đang có người thuê");
      res.status(409).json({
        error: "Không thể xóa căn hộ",
        message: `Căn hộ đang được thuê bởi ${activeLease.tenant?.name || "người thuê"} từ ${activeLease.startDate.toLocaleDateString()} đến ${activeLease.endDate.toLocaleDateString()}.`,
      });
      return;
    }

    // === 2. LẤY DỮ LIỆU CĂN HỘ ===
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        name: true,
        photoUrls: true,
      },
    });

    if (!property) {
      res.status(404).json({ error: "Không tìm thấy căn hộ" });
      return;
    }

    console.log("TÌM THẤY CĂN HỘ:", property.name);
    console.log("ẢNH CẦN XÓA:", property.photoUrls?.length || 0);

    // === 3. XÓA ẢNH TRÊN S3 ===
    if (property.photoUrls && property.photoUrls.length > 0) {
      await Promise.all(
        property.photoUrls.map(async (url) => {
          try {
            const urlParts = url.split("/");
            const key = urlParts.slice(urlParts.indexOf("properties")).join("/");
            await s3Client.send(
              new DeleteObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME!,
                Key: key,
              })
            );
            console.log("ĐÃ XÓA S3:", key);
          } catch (err: any) {
            console.warn("LỖI XÓA S3:", url, err.message);
          }
        })
      );
    }

    // === 4. XÓA TRONG DATABASE ===
    await prisma.property.delete({
      where: { id: propertyId },
    });

    console.log("ĐÃ XÓA CĂN HỘ:", propertyId);

    res.json({
      message: "Xóa căn hộ thành công",
      deletedProperty: { id: property.id, name: property.name },
    });
  } catch (err: any) {
    console.error("LỖI XÓA CĂN HỘ:", err);
    res.status(500).json({
      message: "Xóa căn hộ thất bại",
      error: err.message,
    });
  }
};