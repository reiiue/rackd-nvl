
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn more about rackd.nvl, an affordable branded clothing store based in Naval, Biliran.",
};

const categories = [
  {
    number: "01",
    name: "Workwear",
    description: "Utility-inspired pieces built for everyday wear.",
  },
  {
    number: "02",
    name: "Vintage",
    description: "Timeless pieces with character and history.",
  },
  {
    number: "03",
    name: "Streetwear",
    description: "Casual pieces with a modern edge.",
  },
  {
    number: "04",
    name: "Sportswear",
    description: "Comfortable pieces made for active days.",
  },
];

export default function AboutPage() {
  return (
    <main className="bg-white text-black">
      {/* Hero */}
      <section className="border-b border-neutral-200">
        <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 md:py-32 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <div className="mb-8 flex items-center gap-3">
                <span className="h-px w-8 bg-black" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-500">
                  About rackd.nvl
                </p>
              </div>

              <h1 className="max-w-5xl text-5xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-6xl md:text-7xl lg:text-8xl">
                Good clothes.
                <br />
                <span className="text-neutral-400">Reasonable prices.</span>
              </h1>
            </div>

            <div className="lg:pb-2">
              <p className="max-w-md text-sm leading-7 text-neutral-500 md:text-base">
                A curated collection of branded and pre-loved clothing,
                selected for people who care about style, quality, and value.
              </p>

              <div className="mt-8 flex items-center gap-4">
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-neutral-800"
                >
                  Shop Collection
                </Link>

                <span className="text-xs text-neutral-400">
                  Naval, Biliran
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intro / Philosophy */}
      <section className="border-b border-neutral-200">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 md:py-28 lg:px-10">
          <div className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400">
                01 / Our Approach
              </p>
            </div>

            <div>
              <h2 className="max-w-4xl text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl md:text-5xl">
                We look for pieces worth wearing again.
              </h2>

              <div className="mt-10 grid gap-8 border-t border-neutral-200 pt-8 md:grid-cols-2">
                <p className="text-sm leading-7 text-neutral-500 md:text-base">
                  Every piece at rackd.nvl is selected with condition, style,
                  and value in mind. Rather than focusing on quantity, we aim
                  to build a collection of pieces that deserve a place in your
                  wardrobe.
                </p>

                <p className="text-sm leading-7 text-neutral-500 md:text-base">
                  From everyday basics to statement pieces, our collection
                  brings together different styles while keeping prices
                  accessible.
                </p>
              </div>

              <p className="mt-8 max-w-2xl text-sm leading-7 text-neutral-500 md:text-base">
                We believe finding good branded clothing does not always have
                to mean paying full retail price.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 md:py-28 lg:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400">
                02 / What We Carry
              </p>

              <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.035em] sm:text-4xl md:text-5xl">
                Different styles.
                <br />
                One collection.
              </h2>
            </div>

            <p className="max-w-xs text-sm leading-6 text-neutral-500">
              A rotating selection of clothing across different styles,
              seasons, and everyday essentials.
            </p>
          </div>

          <div className="mt-12 grid border-l border-t border-neutral-200 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <div
                key={category.number}
                className="group min-h-[230px] border-b border-r border-neutral-200 bg-white p-6 transition-colors hover:bg-black hover:text-white md:p-8"
              >
                <div className="flex h-full flex-col justify-between">
                  <p className="text-[10px] font-medium tracking-[0.2em] text-neutral-400 transition-colors group-hover:text-neutral-500">
                    {category.number}
                  </p>

                  <div>
                    <h3 className="text-xl font-semibold tracking-tight">
                      {category.name}
                    </h3>

                    <p className="mt-3 max-w-[220px] text-sm leading-6 text-neutral-500 transition-colors group-hover:text-neutral-400">
                      {category.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="border-b border-neutral-200">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 md:py-28 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400">
                03 / Based In
              </p>

              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl md:text-6xl">
                Naval,
                <br />
                Biliran.
              </h2>

              <p className="mt-7 max-w-lg text-sm leading-7 text-neutral-500 md:text-base">
                rackd.nvl is a local clothing store based in Naval, Biliran,
                bringing accessible branded clothing and everyday pieces to
                the community.
              </p>
            </div>

            <div className="grid gap-px border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:self-end">
              <div className="bg-white p-7 md:p-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400">
                  Location
                </p>

                <p className="mt-5 text-lg font-medium">Naval, Biliran</p>

                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Serving customers locally and beyond.
                </p>
              </div>

              <div className="bg-white p-7 md:p-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400">
                  Delivery
                </p>

                <p className="mt-5 text-lg font-medium">
                  Free within Naval
                </p>

                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Message us for orders and inquiries.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-b border-neutral-200">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 md:py-28 lg:px-10">
          <div className="grid gap-12 md:grid-cols-3 md:gap-8">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400">
                Quality
              </p>

              <p className="mt-5 text-lg font-medium tracking-tight">
                Pieces worth keeping.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400">
                Value
              </p>

              <p className="mt-5 text-lg font-medium tracking-tight">
                Good clothing at reasonable prices.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400">
                Selection
              </p>

              <p className="mt-5 text-lg font-medium tracking-tight">
                A collection that keeps changing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white">
        <div className="mx-auto max-w-[1400px] px-5 py-24 text-center sm:px-8 md:py-32 lg:px-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-neutral-500">
            rackd.nvl
          </p>

          <h2 className="mx-auto mt-5 max-w-4xl text-4xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-5xl md:text-7xl">
            Find something
            <br />
            worth wearing.
          </h2>

          <p className="mx-auto mt-7 max-w-md text-sm leading-7 text-neutral-400">
            Explore the latest pieces and find your next addition to the
            wardrobe.
          </p>

          <Link
            href="/shop"
            className="mt-9 inline-flex items-center justify-center bg-white px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.15em] text-black transition hover:bg-neutral-200"
          >
            Shop Collection
          </Link>
        </div>
      </section>
    </main>
  );
}
