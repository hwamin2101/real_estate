"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import React, { useState, useEffect } from "react";

interface ImagePreviewsProps {
  images: string[];
}

const ImagePreviews = ({ images }: ImagePreviewsProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // === SLIDE PREVIEW ===
  const handlePrev = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  // === LIGHTBOX ===
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goPrevLightbox = () => {
    setLightboxIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goNextLightbox = () => {
    setLightboxIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation cho lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrevLightbox();
      if (e.key === "ArrowRight") goNextLightbox();
      if (e.key === "Escape") closeLightbox();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, lightboxIndex, images.length]);

  // === XỬ LÝ KHÔNG CÓ ẢNH ===
  if (!images || images.length === 0) {
    return (
      <div className="relative h-[450px] w-full bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-20 h-20 mx-auto mb-2" />
          <p className="text-sm">Chưa có ảnh</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* === SLIDE PREVIEW === */}
      <div className="relative h-[450px] w-full overflow-hidden rounded-xl group">
        <div
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{
            transform: `translateX(-${currentImageIndex * 100}%)`,
          }}
        >
          {images.map((image, index) => (
            <div
              key={image}
              className="relative min-w-full h-full flex-shrink-0 cursor-pointer"
              onClick={() => openLightbox(index)}
            >
              <Image
                src={image}
                alt={`Ảnh căn hộ ${index + 1}`}
                fill
                priority={index === 0}
                className="object-cover hover:brightness-90 transition-all duration-300"
              />
            </div>
          ))}
        </div>

        {/* NÚT PREV/NEXT (HOVER HIỂN THỊ) */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/70"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/70"
              aria-label="Ảnh sau"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* DOTS CHỈ SỐ */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentImageIndex
                    ? "bg-white w-8"
                    : "bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* === LIGHTBOX === */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onClick={closeLightbox}
        >
          <div
            className="relative max-w-6xl w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* NÚT ĐÓNG */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black/50 p-2 rounded-full"
            >
              <X className="w-8 h-8" />
            </button>

            {/* NÚT PREV/NEXT */}
            <button
              onClick={goPrevLightbox}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black/50 p-3 rounded-full"
            >
              <ChevronLeft className="w-10 h-10" />
            </button>
            <button
              onClick={goNextLightbox}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black/50 p-3 rounded-full"
            >
              <ChevronRight className="w-10 h-10" />
            </button>

            {/* ẢNH LỚN */}
            <div className="relative w-full h-full max-h-[90vh]">
              <Image
                src={images[lightboxIndex]}
                alt={`Ảnh ${lightboxIndex + 1}`}
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* CHỈ SỐ ẢNH */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium">
              {lightboxIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImagePreviews;