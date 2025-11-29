
"use client";
import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useAppSelector } from "@/state/redux";
import { useGetPropertiesQuery } from "@/state/api";
import { Property } from "@/types/prismaTypes";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string;

// TỌA ĐỘ TRUNG TÂM VIỆT NAM & TP.HCM (rất chính xác)
const VIETNAM_CENTER: [number, number] = [108.2772, 14.0583];     // Toàn quốc
const HCMC_CENTER: [number, number] = [106.6297, 10.8231];       // TP. Hồ Chí Minh

const Map = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const filters = useAppSelector((state) => state.global.filters);
  const { data: properties, isLoading, isError } = useGetPropertiesQuery(filters);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Nếu map đã được tạo rồi → chỉ cập nhật, không tạo mới
    if (mapRef.current) {
      const map = mapRef.current;

      // Xác định vị trí cần focus
      let center: [number, number] = HCMC_CENTER;
      let zoom = 10;

      if (filters.coordinates && filters.coordinates[0] !== 0 && filters.coordinates[1] !== 0) {
        center = [filters.coordinates[0], filters.coordinates[1]] as [number, number];
        zoom = 12;
      } else if (properties && properties.length > 0) {
        // Nếu có căn hộ → tự động fit bounds
        const bounds = new mapboxgl.LngLatBounds();
        properties.forEach((p) => {
          bounds.extend([
            p.location.coordinates.longitude,
            p.location.coordinates.latitude,
          ]);
        });
        map.fitBounds(bounds, { padding: 60, duration: 1500 });
        return;
      }

      // Fly mượt mà về trung tâm
      map.flyTo({
        center,
        zoom,
        duration: 1500,
        essential: true,
      });
      return;
    }

    // Tạo map lần đầu
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/hwamin2102/cmg4p30i1007v01s7bfom7qf8",
      center: filters.coordinates && filters.coordinates[0] !== 0
        ? [filters.coordinates[0], filters.coordinates[1]] as [number, number]
        : HCMC_CENTER,
      zoom: filters.coordinates && filters.coordinates[0] !== 0 ? 12 : 10,
    });

    mapRef.current = map;

    map.on("load", () => {
      // Đảm bảo resize đúng
      setTimeout(() => map.resize(), 100);
    });

    // Thêm marker khi có dữ liệu
    if (!isLoading && !isError && properties && properties.length > 0) {
      properties.forEach((property) => {
        const marker = createPropertyMarker(property, map);
        const el = marker.getElement();
        const path = el.querySelector("path[fill='#3FB1CE']");
        if (path) path.setAttribute("fill", "#000000");
      });

      // Tự động zoom vừa tất cả căn hộ
      const bounds = new mapboxgl.LngLatBounds();
      properties.forEach((p) => {
        bounds.extend([p.location.coordinates.longitude, p.location.coordinates.latitude]);
      });
      map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 1500 });
    }

    // Cleanup
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [isLoading, isError, properties, filters.coordinates]);

  if (isLoading) return <div className="basis-5/12 grow rounded-xl bg-gray-200 animate-pulse" />;
  if (isError || !properties) return <div className="basis-5/12 grow rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">Không có dữ liệu</div>;

  return (
    <div className="basis-5/12 grow relative rounded-xl overflow-hidden shadow-lg">
      <div
        ref={mapContainerRef}
        className="w-full h-full"
      />
    </div>
  );
};

const createPropertyMarker = (property: Property, map: mapboxgl.Map) => {
  return new mapboxgl.Marker({ color: "#000000" })
    .setLngLat([
      property.location.coordinates.longitude,
      property.location.coordinates.latitude,
    ])
    .setPopup(
      new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(`
          <div class="w-64 p-3 bg-white rounded-lg shadow-xl border">
            <a href="/property/${property.id}" class="block">
              <img src="${property.photoUrls[0] || "/placeholder.jpg"}" alt="${property.name}" class="w-full h-32 object-cover rounded-md mb-2" />
              <h3 class="font-semibold text-lg truncate">${property.name}</h3>
              <p class="text-primary-600 font-bold">
                ${(property.pricePerMonth / 1_000_000).toFixed(1)} triệu/tháng
              </p>
              <p class="text-sm text-gray-600">${property.location.city}, ${property.location.state}</p>
            </a>
          </div>
        `)
    )
    .addTo(map);
};

export default Map;