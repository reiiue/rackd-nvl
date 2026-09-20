
import Link from "next/link";

import ProductCarousel from "@/components/ProductCarousel";

import { getProducts } from "@/lib/products";

export default async function HomePage() {
  const products = await getProducts();
  const latestProducts = products.slice(0, 10);

  return (
    <main className="bg-white text-black">
      {/* Hero */}
      <section>
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">
          <div className="flex min-h-[400px] flex-col items-center justify-center py-8 text-center md:min-h-[460px] md:py-10">
            <div className="w-full max-w-5xl">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-neutral-400">
                Curated Pre-Loved Clothing
              </p>

              <h1 className="text-[16vw] font-bold leading-[0.78] tracking-[-0.07em] sm:text-[12vw] md:text-[10vw] lg:text-[9rem]">
                RACK&apos;D
                <br />
                {/* <span className="text-neutral-300">NVL</span> */}
              </h1>

              <div className="mt-6 flex flex-col items-center gap-4">
                <p className="max-w-md text-sm leading-6 text-neutral-500 md:text-base">
                  Branded pieces, carefully selected and priced reasonably.
                  Discover workwear, vintage, streetwear and sportswear.
                </p>

                <div className="flex gap-3">
                  <Link
                    href="/shop"
                    className="group inline-flex items-center gap-4 bg-black px-6 py-3.5 text-sm font-medium !text-white transition hover:bg-neutral-800"
                  >
                    <span className="!text-white">
                      Shop Collection
                    </span>

                    <span className="!text-white transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </Link>

                  <Link
                    href="#latest"
                    className="hidden border border-neutral-300 px-6 py-3.5 text-sm font-medium text-black transition hover:border-black sm:inline-flex"
                  >
                    Latest
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-7 flex w-full max-w-5xl items-center justify-center border-t border-neutral-200 pt-3">
              <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">
                Affordable / Branded / Yours
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section
        id="latest"
        className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 md:py-10 lg:px-10"
      >
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-400">
              Just In
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] md:text-5xl">
              New Arrivals
            </h2>
          </div>

          <Link
            href="/shop"
            className="group hidden items-center gap-2 text-sm font-medium text-black sm:flex"
          >
            View all

            <span className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

        {latestProducts.length > 0 ? (
          <ProductCarousel products={latestProducts} />
        ) : (
          <div className="border border-neutral-200 px-6 py-16 text-center">
            <p className="text-sm text-neutral-500">
              No products available yet.
            </p>

            <Link
              href="/shop"
              className="mt-4 inline-block text-sm font-medium text-black underline underline-offset-4"
            >
              Browse Shop
            </Link>
          </div>
        )}

        <div className="mt-5 sm:hidden">
          <Link
            href="/shop"
            className="group flex items-center justify-between border-t border-neutral-200 pt-4 text-sm font-medium text-black"
          >
            View all products

            <span className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="border-y border-neutral-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-5 py-9 sm:px-8 md:py-11 lg:px-10">
          {/* Section Header */}
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-400">
                Explore
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] md:text-5xl">
                Shop by Category
              </h2>
            </div>

            <Link
              href="/shop"
              className="hidden text-sm font-medium text-neutral-500 transition-colors hover:text-black sm:block"
            >
              View all →
            </Link>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              {
                name: "T-Shirts",
                description: "Everyday essentials",
              },
              {
                name: "Jeans",
                description: "Classic denim",
              },
              {
                name: "Sweatshirts",
                description: "Comfort & warmth",
              },
              {
                name: "Jackets",
                description: "Layer with character",
              },
            ].map((category) => (
              <Link
                key={category.name}
                href={`/shop?category=${encodeURIComponent(
                  category.name
                )}`}
                className="group flex min-h-[150px] flex-col justify-between border border-neutral-200 bg-white p-5 text-black transition-all duration-300 hover:border-black hover:bg-black hover:text-white md:min-h-[180px] md:p-6"
              >
                {/* Top */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 transition-colors duration-300 group-hover:text-white/50">
                    Category
                  </span>

                  <span className="text-lg text-neutral-400 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white">
                    ↗
                  </span>
                </div>

                {/* Bottom */}
                <div>
                  <h3 className="text-xl font-semibold tracking-[-0.03em] text-black transition-colors duration-300 group-hover:text-white md:text-2xl">
                    {category.name}
                  </h3>

                  <p className="mt-1 text-xs text-neutral-400 transition-colors duration-300 group-hover:text-white/50">
                    {category.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Mobile View All */}
          <div className="mt-5 sm:hidden">
            <Link
              href="/shop"
              className="flex items-center justify-between border-t border-neutral-200 pt-4 text-sm font-medium text-black transition-colors hover:text-neutral-500"
            >
              View all products

              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Brand Statement */}
      <section className="border-y border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 md:py-16 lg:px-10">
          <div className="grid gap-7 md:grid-cols-[1.3fr_1fr] md:items-end">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-400">
                About rack'd
              </p>

              <h2 className="mt-4 text-4xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-5xl md:text-7xl">
                Good clothes
                <br />
                shouldn&apos;t cost
                <br />
                <span className="text-neutral-300">a fortune.</span>
              </h2>
            </div>

            <div className="max-w-md md:pb-1">
              <p className="text-sm leading-7 text-neutral-500 md:text-base">
                rack'd brings together branded clothing worth wearing
                again. Every piece is selected with condition, style and value
                in mind.
              </p>

              <Link
                href="/shop"
                className="group mt-5 inline-flex items-center gap-3 border-b border-black pb-1 text-sm font-medium text-black"
              >
                Explore the collection

                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
