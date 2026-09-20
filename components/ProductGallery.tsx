
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type ProductGalleryProps = {
  images: string[];
  name: string;
  isSold: boolean;
};

export default function ProductGallery({
  images,
  name,
  isSold,
}: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(images[0]);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isZoomed) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isZoomed]);

  function closeZoom() {
    setIsZoomed(false);
  }

  return (
    <>
      <div>
        {/* Main Image */}
        <button
          type="button"
          onClick={() => setIsZoomed(true)}
          className="group relative block w-full cursor-zoom-in overflow-hidden bg-neutral-100"
          aria-label={`Zoom ${name}`}
        >
          <div className="relative aspect-[4/5]">
            <Image
              src={selectedImage}
              alt={name}
              fill
              priority
              loading="eager"
              unoptimized
              className={`object-cover transition duration-500 group-hover:scale-105 ${
                isSold ? "opacity-60" : ""
              }`}
              sizes="(max-width: 768px) 100vw, 50vw"
            />

            {/* Zoom Indicator */}
            {!isSold && (
              <div className="absolute bottom-4 right-4 bg-white/90 px-3 py-2 text-xs font-medium text-black opacity-0 shadow-sm transition group-hover:opacity-100">
                Click to zoom
              </div>
            )}

            {/* Sold Badge */}
            {isSold && (
              <div className="absolute left-4 top-4 bg-black px-4 py-2 text-xs font-medium uppercase tracking-wide text-white">
                Sold
              </div>
            )}
          </div>
        </button>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="mt-4 grid grid-cols-4 gap-3">
            {images.map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => setSelectedImage(image)}
                className={`relative aspect-square overflow-hidden bg-neutral-100 ${
                  selectedImage === image
                    ? "ring-2 ring-black ring-offset-2"
                    : ""
                }`}
              >
                <Image
                  src={image}
                  alt={`${name} photo ${index + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="120px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      {mounted &&
        isZoomed &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 p-4 md:p-10"
            onClick={closeZoom}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={closeZoom}
              className="absolute right-5 top-5 z-[100000] flex h-10 w-10 items-center justify-center bg-white text-black transition hover:bg-neutral-200"
              aria-label="Close zoom"
            >
              <X size={22} />
            </button>

            {/* Zoomed Image */}
            <div
              className="relative h-[94vh] w-full max-w-6xl"
              onClick={(event) => event.stopPropagation()}
            >
              <Image
                src={selectedImage}
                alt={name}
                fill
                unoptimized
                className="object-contain"
                sizes="100vw"
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
