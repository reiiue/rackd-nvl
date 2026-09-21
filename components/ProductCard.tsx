
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

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
      : product.image
        ? [product.image]
        : [];

  const [activeImage, setActiveImage] = useState(0);
  const [showMobileControls, setShowMobileControls] =
    useState(false);

  /*
   * Used to prevent mobile touch interactions
   * from triggering the desktop mouse handlers.
   */
  const isTouching = useRef(false);

  /*
   * ==============================
   * DESKTOP HOVER
   * ==============================
   */

  function handleMouseEnter(
    event: React.MouseEvent<HTMLDivElement>
  ) {
    /*
     * Ignore mouse events generated after
     * a touch interaction.
     */
    if (isTouching.current) {
      return;
    }

    if (productImages.length > 1) {
      setActiveImage(1);
    }
  }

  function handleMouseLeave(
    event: React.MouseEvent<HTMLDivElement>
  ) {
    /*
     * Ignore mouse events generated after
     * a touch interaction.
     */
    if (isTouching.current) {
      return;
    }

    setActiveImage(0);
  }

  function handleMouseMove(
    event: React.MouseEvent<HTMLDivElement>
  ) {
    /*
     * IMPORTANT:
     * Don't let mobile browsers' simulated mouse
     * events change the active image.
     */
    if (isTouching.current) {
      return;
    }

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

  /*
   * ==============================
   * MOBILE TOUCH
   * ==============================
   */

  function handleTouchStart() {
    /*
     * Tell the mouse handlers that this
     * interaction is coming from touch.
     */
    isTouching.current = true;

    if (productImages.length > 1) {
      setShowMobileControls(true);
    }
  }

  /*
   * ==============================
   * MOBILE PREVIOUS
   * ==============================
   */

  function showPreviousImage(
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    /*
     * Prevent the touch from reaching
     * the product Link/container.
     */
    event.preventDefault();
    event.stopPropagation();

    isTouching.current = true;

    if (productImages.length <= 1) {
      return;
    }

    setShowMobileControls(true);

    setActiveImage((current) => {
      if (current <= 0) {
        return productImages.length - 1;
      }

      return current - 1;
    });
  }

  /*
   * ==============================
   * MOBILE NEXT
   * ==============================
   */

  function showNextImage(
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    /*
     * Prevent the touch from reaching
     * the product Link/container.
     */
    event.preventDefault();
    event.stopPropagation();

    isTouching.current = true;

    if (productImages.length <= 1) {
      return;
    }

    setShowMobileControls(true);

    setActiveImage((current) => {
      if (
        current >=
        productImages.length - 1
      ) {
        return 0;
      }

      return current + 1;
    });
  }

  /*
   * ==============================
   * RESET TOUCH STATE
   * ==============================
   *
   * We wait a little before allowing mouse
   * handlers again. This prevents mobile
   * browsers from firing their synthetic
   * mouse events immediately after touching.
   */

  function handleTouchEnd() {
    window.setTimeout(() => {
      isTouching.current = false;
    }, 500);
  }

  return (
    <article className="group block">
      {/* =====================================
          PRODUCT IMAGE
          ===================================== */}

      <div
        className="relative aspect-[4/5] overflow-hidden bg-neutral-100"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* =====================================
            IMAGES
            ===================================== */}

        <Link
          href={`/product/${product.id}`}
          className="absolute inset-0 z-0 block"
          aria-label={`View ${product.name}`}
        >
          {productImages.map(
            (image, index) => (
              <Image
                key={`${image}-${index}`}
                src={image}
                alt={`${product.name} photo ${index + 1}`}
                fill
                unoptimized
                priority={index === 0}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={`object-cover transition-opacity duration-300 ${
                  activeImage === index
                    ? "opacity-100"
                    : "opacity-0"
                }`}
              />
            )
          )}
        </Link>

        {/* =====================================
            SOLD OVERLAY
            ===================================== */}

        {isSold && (
          <>
            <div className="pointer-events-none absolute inset-0 z-10 bg-white/35" />

            <div className="pointer-events-none absolute left-3 top-3 z-20 bg-black px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-white">
              Sold
            </div>
          </>
        )}

        {/* =====================================
            MOBILE PREVIOUS BUTTON
            ===================================== */}

        {productImages.length > 1 && (
          <button
            type="button"
            aria-label="Previous product photo"
            onPointerDown={showPreviousImage}
            className={`absolute left-2 top-1/2 z-40 flex h-8 w-8 -translate-y-1/2 touch-none items-center justify-center rounded-full bg-white/90 text-black shadow-sm backdrop-blur-sm transition-all duration-200 active:scale-90 md:hidden ${
              showMobileControls
                ? "pointer-events-auto translate-x-0 opacity-100"
                : "pointer-events-none -translate-x-2 opacity-0"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                d="m15 18-6-6 6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {/* =====================================
            MOBILE NEXT BUTTON
            ===================================== */}

        {productImages.length > 1 && (
          <button
            type="button"
            aria-label="Next product photo"
            onPointerDown={showNextImage}
            className={`absolute right-2 top-1/2 z-40 flex h-8 w-8 -translate-y-1/2 touch-none items-center justify-center rounded-full bg-white/90 text-black shadow-sm backdrop-blur-sm transition-all duration-200 active:scale-90 md:hidden ${
              showMobileControls
                ? "pointer-events-auto translate-x-0 opacity-100"
                : "pointer-events-none translate-x-2 opacity-0"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                d="m9 18 6-6-6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {/* =====================================
            IMAGE INDICATORS
            ===================================== */}

        {productImages.length > 1 && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5">
            {productImages.map(
              (_, index) => (
                <span
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    activeImage === index
                      ? "w-4 bg-black"
                      : "w-1.5 bg-white/80"
                  }`}
                />
              )
            )}
          </div>
        )}
      </div>

      {/* =====================================
          PRODUCT INFORMATION
          ===================================== */}

      <Link
        href={`/product/${product.id}`}
        className="block pt-4"
      >
        {/* Brand */}
        <p className="text-xs uppercase tracking-wide text-neutral-400">
          {product.brand}
        </p>

        {/* Product Name */}
        <h2 className="mt-1 line-clamp-2 text-sm font-medium leading-5">
          {product.name}
        </h2>

        {/* Price */}
        <div className="mt-2 flex items-center gap-2">
          <p
            className={`text-sm font-medium ${
              isSold
                ? "text-neutral-400"
                : "text-black"
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

        {/* Size */}
        <p className="mt-1 text-xs text-neutral-400">
          Size {product.size}
        </p>
      </Link>
    </article>
  );
}
