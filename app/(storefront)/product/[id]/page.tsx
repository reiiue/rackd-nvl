
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getProductById } from "@/lib/products";
import ProductGallery from "@/components/ProductGallery";

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;

  const product = await getProductById(id);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: product.name,
    description: `${product.brand} ${product.name} — ₱${product.price.toLocaleString()} at rackd.nvl.`,
    openGraph: {
      title: `${product.name} | rackd.nvl`,
      description: `${product.brand} ${product.name} — ₱${product.price.toLocaleString()}.`,
      type: "website",
      images: product.image
        ? [
            {
              url: product.image,
              alt: product.name,
            },
          ]
        : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { id } = await params;

  // Get product from Supabase
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const isSold = product.status === "sold";

  const productImages =
    product.images?.length
      ? product.images
      : [product.image];

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12">
        {/* Back */}
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 transition hover:text-black"
        >
          <span className="text-base">←</span>
          Back to Shop
        </Link>

        {/* Main Product Layout */}
        <div className="mt-8 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          {/* Product Gallery */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <ProductGallery
              images={productImages}
              name={product.name}
              isSold={isSold}
            />
          </div>

          {/* Product Information */}
          <div className="flex flex-col">
            {/* Brand + Name */}
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-neutral-400">
                {product.brand}
              </p>

              <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-black md:text-4xl">
                {product.name}
              </h1>

              {/* Price */}
              <div className="mt-5 flex items-baseline gap-3">
                <span
                  className={`text-2xl font-semibold tracking-tight ${
                    isSold ? "text-neutral-400" : "text-black"
                  }`}
                >
                  ₱{product.price.toLocaleString()}
                </span>

                {product.originalPrice && (
                  <span className="text-sm text-neutral-400 line-through">
                    ₱{product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Sold Status */}
              {isSold && (
                <div className="mt-5 inline-flex bg-black px-4 py-2 text-xs font-medium uppercase tracking-wide text-white">
                  Sold
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="my-8 h-px bg-neutral-200" />

            {/* Product Details */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Product Details
              </h2>

              <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200">
                <div className="grid grid-cols-2 border-b border-neutral-200 px-4 py-4">
                  <span className="text-sm text-neutral-500">
                    Size
                  </span>

                  <span className="text-right text-sm font-medium text-black">
                    {product.size}
                  </span>
                </div>

                <div className="grid grid-cols-2 border-b border-neutral-200 px-4 py-4">
                  <span className="text-sm text-neutral-500">
                    Color
                  </span>

                  <span className="text-right text-sm font-medium text-black">
                    {product.color}
                  </span>
                </div>

                <div className="grid grid-cols-2 border-b border-neutral-200 px-4 py-4">
                  <span className="text-sm text-neutral-500">
                    Condition
                  </span>

                  <span className="text-right text-sm font-medium text-black">
                    {product.condition}
                  </span>
                </div>

                <div className="grid grid-cols-2 px-4 py-4">
                  <span className="text-sm text-neutral-500">
                    Category
                  </span>

                  <span className="text-right text-sm font-medium text-black">
                    {product.category}
                  </span>
                </div>
              </div>
            </section>

            {/* Measurements */}
            {product.measurements && (
              <section className="mt-8">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  Measurements
                </h2>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {product.measurements.length && (
                    <div className="rounded-lg border border-neutral-200 px-4 py-4">
                      <p className="text-xs text-neutral-400">
                        Length
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {product.measurements.length}
                      </p>
                    </div>
                  )}

                  {product.measurements.width && (
                    <div className="rounded-lg border border-neutral-200 px-4 py-4">
                      <p className="text-xs text-neutral-400">
                        Width
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {product.measurements.width}
                      </p>
                    </div>
                  )}

                  {product.measurements.waist && (
                    <div className="rounded-lg border border-neutral-200 px-4 py-4">
                      <p className="text-xs text-neutral-400">
                        Waist
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {product.measurements.waist}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Description */}
            {product.description && (
              <section className="mt-8">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  Details
                </h2>

                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-neutral-600">
                  {product.description}
                </p>
              </section>
            )}

            {/* Order Area */}
            <section className="mt-10 border-t border-neutral-200 pt-8">
              {isSold ? (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-5 py-4 text-center">
                  <p className="text-sm font-medium text-neutral-600">
                    This item has been sold.
                  </p>
                </div>
              ) : (
                <>
                  <a
                    href="https://www.facebook.com/profile.php?id=61594242150610"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center rounded-lg bg-black px-6 py-4 text-sm font-medium !text-white transition duration-200 hover:bg-neutral-800"
                  >
                    <span className="!text-white">
                      DM to Order
                    </span>
                  </a>


                  {/* How to Order */}
                  <div className="mt-8 border-t border-neutral-200 pt-8">
                    <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                      How to Order
                    </h2>

                    <ol className="mt-5 space-y-4">
                      <li className="flex gap-4">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium">
                          1
                        </span>

                        <p className="pt-1 text-sm leading-6 text-neutral-600">
                          Screenshot the item you want.
                        </p>
                      </li>

                      <li className="flex gap-4">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium">
                          2
                        </span>

                        <p className="pt-1 text-sm leading-6 text-neutral-600">
                          Press the <span className="font-medium text-black">DM to Order</span> button.
                        </p>
                      </li>

                      <li className="flex gap-4">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium">
                          3
                        </span>

                        <p className="pt-1 text-sm leading-6 text-neutral-600">
                          Send the screenshot to our official Facebook page{" "}
                          <a
                            href="https://www.facebook.com/profile.php?id=61594242150610"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-black underline underline-offset-4"
                          >
                            Rack’d.nvl
                          </a>
                          .
                        </p>
                      </li>

                      <li className="flex gap-4">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium">
                          4
                        </span>

                        <p className="pt-1 text-sm leading-6 text-neutral-600">
                          Our team will assist you with the next steps to get your chosen items.
                        </p>
                      </li>
                    </ol>
                  </div>

                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
