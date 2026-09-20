
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({
  product,
}: ProductCardProps) {
  const isSold = product.status === "sold";

  const productImages =
    product.images?.length
      ? product.images
      : [product.image];

  const [activeImage, setActiveImage] = useState(0);

  function handleMouseEnter() {
    if (productImages.length > 1) {
      setActiveImage(1);
    }
  }

  function handleMouseLeave() {
    setActiveImage(0);
  }

  function handleMouseMove(
    event: React.MouseEvent<HTMLDivElement>
  ) {
    if (productImages.length <= 1) {
      return;
    }

    const rect =
      event.currentTarget.getBoundingClientRect();

    const mouseX =
      event.clientX - rect.left;

    const percentage =
      mouseX / rect.width;

    const imageIndex = Math.min(
      productImages.length - 1,
      Math.floor(
        percentage * productImages.length
      )
    );

    setActiveImage(imageIndex);
  }

  return (
    <Link
      href={`/product/${product.id}`}
      className="group block"
    >
      <div
        className="relative aspect-[4/5] overflow-hidden bg-neutral-100"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        {productImages.map((image, index) => (
          <Image
            key={image}
            src={image}
            alt={`${product.name} photo ${index + 1}`}
            fill
            unoptimized
            priority={index === 0}
            className={`object-cover transition-opacity duration-300 ${
              activeImage === index
                ? "opacity-100"
                : "opacity-0"
            } ${
              isSold ? "opacity-60" : ""
            }`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ))}

        {isSold && (
          <div className="absolute left-3 top-3 bg-black px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-white">
            Sold
          </div>
        )}

        {/* Image indicators */}
        {productImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {productImages.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 w-1.5 rounded-full transition-all ${
                  activeImage === index
                    ? "w-4 bg-black"
                    : "bg-white/80"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="pt-4">
        <p className="text-xs uppercase tracking-wide text-neutral-400">
          {product.brand}
        </p>

        <h2 className="mt-1 line-clamp-2 text-sm font-medium">
          {product.name}
        </h2>

        <div className="mt-2 flex items-center gap-2">
          <p
            className={`text-sm font-medium ${
              isSold
                ? "text-neutral-400"
                : ""
            }`}
          >
            ₱{product.price.toLocaleString()}
          </p>

          {product.originalPrice && (
            <p className="text-xs text-neutral-400 line-through">
              ₱
              {product.originalPrice.toLocaleString()}
            </p>
          )}
        </div>

        <p className="mt-1 text-xs text-neutral-400">
          Size {product.size}
        </p>
      </div>
    </Link>
  );
}
