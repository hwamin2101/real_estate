
import {
  FiltersState,
  setFilters,
  setViewMode,
  toggleFiltersFullOpen,
} from "@/state";
import { useAppSelector } from "@/state/redux";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { debounce } from "lodash";
import { cleanParams, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Filter, Grid, List, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PropertyTypeLabels, PropertyTypeIcons } from "@/lib/constants";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// CẤU HÌNH MẶC ĐỊNH CHO NGƯỜI VIỆT NAM
const DEFAULT_LOCATION = "Việt Nam";
const DEFAULT_COORDINATES: [number, number] = [106.6297, 10.8231]; // [lng, lat]

const FiltersBar = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const filters = useAppSelector((state) => state.global.filters);
  const isFiltersFullOpen = useAppSelector((state) => state.global.isFiltersFullOpen);
  const viewMode = useAppSelector((state) => state.global.viewMode);

  // State cho ô tìm kiếm
  const [searchInput, setSearchInput] = useState<string>("");

  // TỰ ĐỘNG SET "TP. HỒ CHÍ MINH, VIỆT NAM" KHI TRANG VỪA LOAD
  useEffect(() => {
    const currentLocation = filters.location?.trim();
    const hasNoLocation =
      !currentLocation ||
      currentLocation === "" ||
      currentLocation.toLowerCase().includes("los angeles") ||
      currentLocation === "any" ||
      currentLocation === "undefined";

    if (hasNoLocation) {
      setSearchInput(DEFAULT_LOCATION);

      dispatch(
        setFilters({
          ...filters,
          location: DEFAULT_LOCATION,
          coordinates: DEFAULT_COORDINATES,
        })
      );

    
      const params = new URLSearchParams(window.location.search);
      params.set("location", DEFAULT_LOCATION);
      params.set("lng", DEFAULT_COORDINATES[0].toString());
      params.set("lat", DEFAULT_COORDINATES[1].toString());
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    } else {
      setSearchInput(currentLocation);
    }
  }, []); 
  const updateURL = debounce((newFilters: FiltersState) => {
    const cleanFilters = cleanParams(newFilters);
    const params = new URLSearchParams();

    Object.entries(cleanFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "" && value !== "any") {
        params.set(
          key,
          Array.isArray(value) ? value.join(",") : String(value)
        );
      }
    });

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, 300);

  const handleFilterChange = (key: string, value: any, isMin: boolean | null = null) => {
    let newValue = value === "any" ? null : value;

    if (key === "priceRange") {
      const range = [...(filters.priceRange || [null, null])];
      if (isMin !== null) {
        range[isMin ? 0 : 1] = value === "any" ? null : Number(value);
      }
      newValue = range;
    }

    const newFilters = { ...filters, [key]: newValue };
    dispatch(setFilters(newFilters));
    updateURL(newFilters);
  };

  const handleLocationSearch = async () => {
    if (!searchInput.trim()) {
      setSearchInput(DEFAULT_LOCATION);
      dispatch(setFilters({ ...filters, location: DEFAULT_LOCATION, coordinates: DEFAULT_COORDINATES }));
      return;
    }

    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchInput
        )}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}&country=VN&language=vi&limit=5`
      );
      const data = await res.json();

      if (data.features?.length > 0) {
        const [lng, lat] = data.features[0].center;
        const placeName = data.features[0].place_name;

        setSearchInput(placeName);
        dispatch(setFilters({ ...filters, location: placeName, coordinates: [lng, lat] }));
      }
    } catch (err) {
      console.error("Lỗi tìm kiếm địa điểm:", err);
    }
  };

  return (
    <div className="flex justify-between items-center w-full py-5 flex-wrap gap-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Nút mở full filter */}
        <Button
          variant="outline"
          className={cn(
            "gap-2 rounded-xl border-primary-400 hover:bg-primary-500 hover:text-white",
            isFiltersFullOpen && "bg-primary-700 text-white"
          )}
          onClick={() => dispatch(toggleFiltersFullOpen())}
        >
          <Filter className="w-4 h-4" />
          <span>Hiển thị tất cả</span>
        </Button>

        {/* Ô tìm kiếm địa điểm */}
        <div className="flex items-center">
          <Input
            placeholder="Nhập địa điểm cần tìm..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLocationSearch()}
            className="w-64 rounded-l-xl rounded-r-none border-primary-400 border-r-0 focus-visible:ring-0"
          />
          <Button
            onClick={handleLocationSearch}
            className="rounded-r-xl rounded-l-none border-l-0 bg-primary-600 hover:bg-primary-700 text-white"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Giá tiền */}
        <div className="flex gap-1">
          <Select value={filters.priceRange?.[0]?.toString() || "any"} onValueChange={(v) => handleFilterChange("priceRange", v, true)}>
            <SelectTrigger className="w-28 rounded-xl border-primary-400">
              <SelectValue>
                {filters.priceRange?.[0]
                  ? `${(filters.priceRange[0] / 1_000_000).toLocaleString("vi-VN")} triệu+`
                  : "Giá tối thiểu"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Giá tối thiểu</SelectItem>
              {[0.5, 1, 1.5, 2, 3, 5, 10, 15, 20].map((p) => (
                <SelectItem key={p} value={(p * 1_000_000).toString()}>Từ {p} triệu+</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.priceRange?.[1]?.toString() || "any"} onValueChange={(v) => handleFilterChange("priceRange", v, false)}>
            <SelectTrigger className="w-28 rounded-xl border-primary-400">
              <SelectValue>
                {filters.priceRange?.[1]
                  ? `Dưới ${(filters.priceRange[1] / 1_000_000).toLocaleString("vi-VN")} triệu`
                  : "Giá tối đa"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Giá tối đa</SelectItem>
              {[1, 2, 3, 5, 10, 15, 20, 30, 50].map((p) => (
                <SelectItem key={p} value={(p * 1_000_000).toString()}>Dưới {p} triệu</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Phòng ngủ & phòng tắm */}
        <div className="flex gap-1">
          <Select value={filters.beds || "any"} onValueChange={(v) => handleFilterChange("beds", v === "any" ? null : v)}>
            <SelectTrigger className="w-28 rounded-xl border-primary-400">
              <SelectValue placeholder="Phòng ngủ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Phòng ngủ</SelectItem>
              {[1, 2, 3, 4].map((n) => <SelectItem key={n} value={n.toString()}>{n}+ phòng</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filters.baths || "any"} onValueChange={(v) => handleFilterChange("baths", v === "any" ? null : v)}>
            <SelectTrigger className="w-28 rounded-xl border-primary-400">
              <SelectValue placeholder="Phòng tắm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Phòng tắm</SelectItem>
              {[1, 2, 3].map((n) => <SelectItem key={n} value={n.toString()}>{n}+ phòng tắm</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Loại căn hộ */}
        <Select value={filters.propertyType || "any"} onValueChange={(v) => handleFilterChange("propertyType", v === "any" ? null : v)}>
          <SelectTrigger className="w-32 rounded-xl border-primary-400">
            <SelectValue placeholder="Loại căn hộ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Loại căn hộ</SelectItem>
            {Object.entries(PropertyTypeIcons).map(([type, Icon]) => (
              <SelectItem key={type} value={type}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {PropertyTypeLabels[type as keyof typeof PropertyTypeLabels]}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* View Mode */}
      <div className="flex items-center">
        <div className="flex border rounded-xl overflow-hidden">
          <Button
            variant="ghost"
            className={cn("px-4 py-2", viewMode === "list" && "bg-primary-700 text-white")}
            onClick={() => dispatch(setViewMode("list"))}
          >
            <List className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            className={cn("px-4 py-2", viewMode === "grid" && "bg-primary-700 text-white")}
            onClick={() => dispatch(setViewMode("grid"))}
          >
            <Grid className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FiltersBar;