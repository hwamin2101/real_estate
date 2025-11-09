"use client";

import Header from "@/components/Header";
import Loading from "@/components/Loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetPaymentsQuery,
  useGetPropertyLeasesQuery,
  useGetPropertyQuery,
  useDeletePropertyMutation,
} from "@/state/api";
import {
  ArrowLeft,
  Home,
  MapPin,
  Bed,
  Bath,
  Square,
  DollarSign,
  Calendar,
  Star,
  Shield,
  FileText,
  Car,
  Check,
  X,
  Image as ImageIcon,
  Tag,
  Info,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import EditPropertyModal from "@/components/EditPropertyModal";
import DeletePropertyModal from "@/components/DeletePropertyModal";

const PropertyTenants = () => {
  const { id } = useParams();
  const router = useRouter();
  const propertyId = Number(id);

  // === STATE MODAL ===
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // === API HOOKS ===
  const { data: property, isLoading: propertyLoading } = useGetPropertyQuery(propertyId);
  const { data: leases, isLoading: leasesLoading } = useGetPropertyLeasesQuery(propertyId);
  const { data: payments, isLoading: paymentsLoading } = useGetPaymentsQuery(propertyId);
  const [deleteProperty, { isLoading: isDeleting }] = useDeletePropertyMutation();

  // === LIGHTBOX STATE ===
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentPhotoIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToPrev = () => {
    setCurrentPhotoIndex((prev) =>
      prev === 0 ? (property?.photoUrls.length || 0) - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentPhotoIndex((prev) =>
      prev === (property?.photoUrls.length || 0) - 1 ? 0 : prev + 1
    );
  };

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "Escape") closeLightbox();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, currentPhotoIndex, property?.photoUrls.length]);

  // === LOADING ===
  if (propertyLoading || leasesLoading || paymentsLoading) return <Loading />;

  if (!property) {
    return (
      <div className="dashboard-container text-center py-10">
        <p className="text-gray-500">Không tìm thấy căn hộ.</p>
        <Link href="/managers/properties" className="text-primary-600 hover:underline">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  // === HELPER FUNCTIONS ===
  const getCurrentMonthPaymentStatus = (leaseId: number) => {
    const currentDate = new Date();
    const currentMonthPayment = payments?.find(
      (payment) =>
        payment.leaseId === leaseId &&
        new Date(payment.dueDate).getMonth() === currentDate.getMonth() &&
        new Date(payment.dueDate).getFullYear() === currentDate.getFullYear()
    );
    return currentMonthPayment?.paymentStatus || "Chưa thanh toán";
  };

  const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null) return "0 ₫";
    return amount.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });
  };

  const BoolIcon = ({ value }: { value: boolean }) =>
    value ? (
      <Check className="w-4 h-4 text-green-600" />
    ) : (
      <X className="w-4 h-4 text-red-500" />
    );

  return (
    <div className="dashboard-container">
      {/* Back button */}
      <Link
        href="/managers/properties"
        className="flex items-center mb-4 hover:text-primary-500 transition-colors"
        scroll={false}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        <span>Quay lại danh sách căn hộ</span>
      </Link>

      <Header
        title={property.name}
        subtitle="Thông tin chi tiết & quản lý hợp đồng"
      />

      {/* === THÔNG TIN CĂN HỘ === */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <Home className="w-6 h-6 mr-2 text-primary-600" />
            Thông tin căn hộ
          </h3>

          <div className="flex items-center gap-3">
            {/* Đánh giá */}
            {property.averageRating > 0 && (
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-medium text-sm">
                  {property.averageRating.toFixed(1)} ({property.numberOfReviews} đánh giá)
                </span>
              </div>
            )}

            {/* NÚT CHỈNH SỬA & XÓA */}
            <div className="flex gap-2">
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Chỉnh sửa</span>
              </button>

              <button
                onClick={() => setDeleteOpen(true)}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Xóa căn hộ
                  </>
                )}
              </button>
            </div>

            {/* MODAL CHỈNH SỬA */}
            <EditPropertyModal
              property={property}
              open={editOpen}
              onOpenChange={setEditOpen}
            />

            {/* MODAL XÓA */}
            <DeletePropertyModal
              property={{ id: property.id, name: property.name }}
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
              onSuccess={() => {
                router.push("/managers/properties");
              }}
            />
          </div>
        </div>

        {/* === ẢNH NHỎ + LIGHTBOX === */}
        {property.photoUrls && property.photoUrls.length > 0 && (
          <div className="mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {property.photoUrls.slice(0, 8).map((url: string, idx: number) => (
                <div
                  key={idx}
                  onClick={() => openLightbox(idx)}
                  className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 cursor-pointer group shadow-sm"
                >
                  <Image
                    src={url}
                    alt={`Ảnh ${idx + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              ))}
              {property.photoUrls.length > 8 && (
                <div className="relative aspect-video rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-medium">
                  <span>+{property.photoUrls.length - 8}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === LIGHTBOX === */}
        {lightboxOpen && property.photoUrls && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={closeLightbox}
          >
            <div
              className="relative max-w-6xl w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 text-white hover:text-gray-300 transition z-10"
              >
                <X className="w-8 h-8" />
              </button>

              <button
                onClick={goToPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition z-10"
              >
                <ChevronLeft className="w-10 h-10" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition z-10"
              >
                <ChevronRight className="w-10 h-10" />
              </button>

              <div className="relative w-full h-full max-h-[90vh]">
                <Image
                  src={property.photoUrls[currentPhotoIndex]}
                  alt={`Ảnh ${currentPhotoIndex + 1}`}
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {currentPhotoIndex + 1} / {property.photoUrls.length}
              </div>
            </div>
          </div>
        )}

        {/* === THÔNG TIN CHI TIẾT === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Cột 1 */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Tên căn hộ</p>
                <p className="font-semibold text-gray-900">{property.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Địa chỉ</p>
                <p className="font-semibold text-gray-900">
                  {property.location?.address || property.location?.city || "Chưa cập nhật"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Giá thuê/tháng</p>
                <p className="font-semibold text-green-600">
                  {formatCurrency(property.pricePerMonth)}
                </p>
              </div>
            </div>
          </div>

          {/* Cột 2 */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Square className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Diện tích</p>
                <p className="font-semibold text-gray-900">
                  {property.squareFeet} ft² (~
                  {Math.round(property.squareFeet * 0.0929)} m²)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Bed className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Phòng ngủ</p>
                <p className="font-semibold text-gray-900">{property.beds}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Bath className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Phòng tắm</p>
                <p className="font-semibold text-gray-900">{property.baths}</p>
              </div>
            </div>
          </div>

          {/* Cột 3 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Tiền đặt cọc</p>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(property.securityDeposit)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Phí ứng tuyển</p>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(property.applicationFee)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Ngày đăng</p>
                <p className="font-semibold text-gray-900">
                  {new Date(property.postedDate).toLocaleDateString("vi-VN")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tiện ích & Nổi bật */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {property.amenities && property.amenities.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Tiện ích</h4>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity: any, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {amenity.name || amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {property.highlights && property.highlights.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Điểm nổi bật</h4>
              <div className="flex flex-wrap gap-2">
                {property.highlights.map((highlight: any, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                  >
                    {highlight.name || highlight}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Thú cưng & Đậu xe */}
        <div className="mt-6 flex gap-8 text-sm">
          <div className="flex items-center gap-2">
            <BoolIcon value={property.isPetsAllowed} />
            <span className={property.isPetsAllowed ? "text-green-600" : "text-red-500"}>
              {property.isPetsAllowed ? "Cho phép thú cưng" : "Không cho phép thú cưng"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-gray-600" />
            <BoolIcon value={property.isParkingIncluded} />
            <span className={property.isParkingIncluded ? "text-green-600" : "text-red-500"}>
              {property.isParkingIncluded ? "Có chỗ đậu xe" : "Không có chỗ đậu xe"}
            </span>
          </div>
        </div>

        {/* Mô tả */}
        {property.description && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-medium text-gray-700 mb-2 flex items-center">
              <Info className="w-4 h-4 mr-1" />
              Mô tả
            </h4>
            <p className="text-gray-600 leading-relaxed">{property.description}</p>
          </div>
        )}
      </div>

      {/* === HỢP ĐỒNG THUÊ === */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Hợp đồng thuê ({leases?.length || 0})
        </h3>

        {leases && leases.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người thuê</TableHead>
                  <TableHead>Hợp đồng</TableHead>
                  <TableHead>Giá thuê</TableHead>
                  <TableHead>Trạng thái tháng này</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leases.map((lease: any) => (
                  <TableRow key={lease.id}>
                    <TableCell className="font-medium">
                      {lease.tenant?.name || "Chưa có"}
                    </TableCell>
                    <TableCell>
                      {new Date(lease.startDate).toLocaleDateString("vi-VN")} →{" "}
                      {new Date(lease.endDate).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(lease.rentAmount || property.pricePerMonth)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          getCurrentMonthPaymentStatus(lease.id) === "Đã thanh toán"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {getCurrentMonthPaymentStatus(lease.id) === "Đã thanh toán" ? (
                          <Check className="w-3 h-3 mr-1" />
                        ) : null}
                        {getCurrentMonthPaymentStatus(lease.id)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">
            Chưa có hợp đồng thuê nào.
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyTenants;