
"use client";

import { useRef } from "react";

import ProductCard from "@/components/ProductCard";

type ProductCarouselProps = {
  products: any[];
};

export default function ProductCarousel({
  products,
}: ProductCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!carouselRef.current) return;

    const amount = carouselRef.current.clientWidth * 0.8;

    carouselRef.current.scrollBy({
      left: direction === "right" ? amount : -amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      {/* Carousel */}
      <div
        ref={carouselRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scrollbar-hide sm:gap-6"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="
              w-[75%]
              shrink-0
              snap-start

              sm:w-[48%]

              md:w-[34%]

              lg:w-[24%]
            "
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="mt-6 flex items-center justify-between border-t border-neutral-200 pt-5">
        <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">
          Swipe to explore
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Previous products"
            className="flex h-10 w-10 items-center justify-center border border-neutral-200 text-lg text-black transition hover:border-black"
          >
            ←
          </button>

          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Next products"
            className="flex h-10 w-10 items-center justify-center border border-neutral-200 text-lg text-black transition hover:border-black"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
