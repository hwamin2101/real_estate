import {
  Wifi,
  Waves,
  Dumbbell,
  Car,
  PawPrint,
  Tv,
  Thermometer,
  Cigarette,
  Cable,
  Maximize,
  Bath,
  Phone,
  Sprout,
  Hammer,
  Bus,
  Mountain,
  VolumeX,
  Home,
  Warehouse,
  Building,
  Castle,
  Trees,
  LucideIcon,
} from "lucide-react";


// ====== Tiện ích (Amenity) ======
export enum AmenityEnum {
  WasherDryer = "WasherDryer",
  AirConditioning = "AirConditioning",
  Dishwasher = "Dishwasher",
  HighSpeedInternet = "HighSpeedInternet",
  HardwoodFloors = "HardwoodFloors",
  WalkInClosets = "WalkInClosets",
  Microwave = "Microwave",
  Refrigerator = "Refrigerator",
  Pool = "Pool",
  Gym = "Gym",
  Parking = "Parking",
  PetsAllowed = "PetsAllowed",
  WiFi = "WiFi",
}

export const AmenityIcons: Record<AmenityEnum, LucideIcon> = {
  WasherDryer: Waves,
  AirConditioning: Thermometer,
  Dishwasher: Waves,
  HighSpeedInternet: Wifi,
  HardwoodFloors: Home,
  WalkInClosets: Maximize,
  Microwave: Tv,
  Refrigerator: Thermometer,
  Pool: Waves,
  Gym: Dumbbell,
  Parking: Car,
  PetsAllowed: PawPrint,
  WiFi: Wifi,
};

// 🏷️ Dịch tên hiển thị của tiện ích
export const AmenityLabels: Record<AmenityEnum, string> = {
  WasherDryer: "Máy giặt & sấy",
  AirConditioning: "Điều hòa",
  Dishwasher: "Máy rửa bát",
  HighSpeedInternet: "Internet tốc độ cao",
  HardwoodFloors: "Sàn gỗ",
  WalkInClosets: "Tủ quần áo lớn",
  Microwave: "Lò vi sóng",
  Refrigerator: "Tủ lạnh",
  Pool: "Hồ bơi",
  Gym: "Phòng tập thể dục",
  Parking: "Bãi đỗ xe",
  PetsAllowed: "Cho phép vật nuôi",
  WiFi: "Wi-Fi miễn phí",
};

// ====== Đặc điểm nổi bật (Highlight) ======
export enum HighlightEnum {
  HighSpeedInternetAccess = "HighSpeedInternetAccess",
  WasherDryer = "WasherDryer",
  AirConditioning = "AirConditioning",
  Heating = "Heating",
  SmokeFree = "SmokeFree",
  CableReady = "CableReady",
  SatelliteTV = "SatelliteTV",
  DoubleVanities = "DoubleVanities",
  TubShower = "TubShower",
  Intercom = "Intercom",
  SprinklerSystem = "SprinklerSystem",
  RecentlyRenovated = "RecentlyRenovated",
  CloseToTransit = "CloseToTransit",
  GreatView = "GreatView",
  QuietNeighborhood = "QuietNeighborhood",
}

export const HighlightIcons: Record<HighlightEnum, LucideIcon> = {
  HighSpeedInternetAccess: Wifi,
  WasherDryer: Waves,
  AirConditioning: Thermometer,
  Heating: Thermometer,
  SmokeFree: Cigarette,
  CableReady: Cable,
  SatelliteTV: Tv,
  DoubleVanities: Maximize,
  TubShower: Bath,
  Intercom: Phone,
  SprinklerSystem: Sprout,
  RecentlyRenovated: Hammer,
  CloseToTransit: Bus,
  GreatView: Mountain,
  QuietNeighborhood: VolumeX,
};

// 🏷️ Dịch tên hiển thị của các đặc điểm nổi bật
export const HighlightLabels: Record<HighlightEnum, string> = {
  HighSpeedInternetAccess: "Truy cập Internet tốc độ cao",
  WasherDryer: "Máy giặt & sấy",
  AirConditioning: "Điều hòa không khí",
  Heating: "Hệ thống sưởi",
  SmokeFree: "Không hút thuốc",
  CableReady: "Sẵn sàng truyền hình cáp",
  SatelliteTV: "Truyền hình vệ tinh",
  DoubleVanities: "Bồn rửa đôi",
  TubShower: "Bồn tắm & vòi sen",
  Intercom: "Hệ thống liên lạc nội bộ",
  SprinklerSystem: "Hệ thống phun nước",
  RecentlyRenovated: "Mới được cải tạo",
  CloseToTransit: "Gần phương tiện công cộng",
  GreatView: "Tầm nhìn đẹp",
  QuietNeighborhood: "Khu dân cư yên tĩnh",
};

// ====== Loại căn hộ (Property Type) ======
export enum PropertyTypeEnum {
  Rooms = "Rooms",
  Tinyhouse = "Tinyhouse",
  Apartment = "Apartment",
  Villa = "Villa",
  Townhouse = "Townhouse",
  Cottage = "Cottage",
}

// 🏷️ Dịch tên hiển thị loại căn hộ
export const PropertyTypeLabels: Record<PropertyTypeEnum, string> = {
  Rooms: "Phòng",
  Tinyhouse: "Nhà nhỏ",
  Apartment: "Căn hộ",
  Villa: "Biệt thự",
  Townhouse: "Nhà phố",
  Cottage: "Nhà gỗ",
};

export const PropertyTypeIcons: Record<PropertyTypeEnum, LucideIcon> = {
  Rooms: Home,
  Tinyhouse: Warehouse,
  Apartment: Building,
  Villa: Castle,
  Townhouse: Home,
  Cottage: Trees,
};

// ====== Cấu hình khác ======
export const NAVBAR_HEIGHT = 52; // in pixels

// ====== Người dùng thử ======
export const testUsers = {
  tenant: {
    username: "Carol White",
    userId: "us-east-2:76543210-90ab-cdef-1234-567890abcdef",
    signInDetails: {
      loginId: "carol.white@example.com",
      authFlowType: "USER_SRP_AUTH",
    },
  },
  tenantRole: "tenant",
  manager: {
    username: "John Smith",
    userId: "us-east-2:12345678-90ab-cdef-1234-567890abcdef",
    signInDetails: {
      loginId: "john.smith@example.com",
      authFlowType: "USER_SRP_AUTH",
    },
  },
  managerRole: "manager",
};