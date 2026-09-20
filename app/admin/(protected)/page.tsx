
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  size: string;
  color: string;
  category: string;
  image: string;
  status: "available" | "sold";
};

const categories = [
  "All",
  "T-Shirts",
  "Shirts",
  "Sweatshirts",
  "Hoodies",
  "Jackets",
  "Pants",
  "Shorts",
  "Other",
];

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("products")
        .select(
          "id, name, brand, price, size, color, category, image, status"
        )
        .order("created_at", {
          ascending: false,
        });

      if (fetchError) {
        console.error("Load products error:", fetchError);
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setProducts(
        (data ?? []).map((product) => ({
          ...product,
          price: Number(product.price),
        }))
      );

      setLoading(false);
    }

    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        searchTerm === "" ||
        product.name.toLowerCase().includes(searchTerm) ||
        product.brand.toLowerCase().includes(searchTerm);

      const matchesCategory =
        category === "All" || product.category === category;

      const matchesStatus =
        status === "All" || product.status === status;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, search, category, status]);

  const totalProducts = products.length;

  const availableProducts = products.filter(
    (product) => product.status === "available"
  ).length;

  const soldProducts = products.filter(
    (product) => product.status === "sold"
  ).length;

  async function toggleStatus(product: Product) {
    const newStatus =
      product.status === "available" ? "sold" : "available";

    setUpdatingId(product.id);
    setError("");

    const { error: updateError } = await supabase
      .from("products")
      .update({
        status: newStatus,
      })
      .eq("id", product.id);

    if (updateError) {
      console.error("Update product status error:", updateError);
      setError(updateError.message);
      setUpdatingId(null);
      return;
    }

    setProducts((currentProducts) =>
      currentProducts.map((currentProduct) =>
        currentProduct.id === product.id
          ? {
              ...currentProduct,
              status: newStatus,
            }
          : currentProduct
      )
    );

    setUpdatingId(null);
  }

  function clearFilters() {
    setSearch("");
    setCategory("All");
    setStatus("All");
  }

  const hasFilters =
    search !== "" || category !== "All" || status !== "All";

  return (
    <main className="min-h-screen bg-neutral-50 text-black">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-12">

        {/* Header */}
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">

              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
                rack'd
              </p>
            </div>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Products
            </h1>

            <p className="mt-3 max-w-lg text-base leading-7 text-neutral-500">
              Manage your inventory, update product availability,
              and keep track of your shop.
            </p>
          </div>

            <Link
            href="/admin/products/new"
            className="inline-flex h-13 items-center justify-center bg-black px-6 text-base font-medium !text-white transition hover:bg-neutral-800 hover:!text-white active:scale-[0.98]"
            >
            <span className="mr-2 text-xl leading-none !text-white">+</span>
            <span className="!text-white">Add Product</span>
            </Link>
        </header>

        {/* Stats */}
        <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">

          {/* Total */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-7">
            <p className="text-sm font-medium uppercase tracking-[0.15em] text-neutral-400">
              Total Products
            </p>

            <p className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {totalProducts}
            </p>

            <p className="mt-2 text-sm text-neutral-400">
              Items in inventory
            </p>
          </div>

          {/* Available */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-7">
            <p className="text-sm font-medium uppercase tracking-[0.15em] text-neutral-400">
              Available
            </p>

            <p className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {availableProducts}
            </p>

            <p className="mt-2 text-sm text-neutral-400">
              Currently for sale
            </p>
          </div>

          {/* Sold */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-7">
            <p className="text-sm font-medium uppercase tracking-[0.15em] text-neutral-400">
              Sold
            </p>

            <p className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {soldProducts}
            </p>

            <p className="mt-2 text-sm text-neutral-400">
              Completed sales
            </p>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-base text-red-600">
            <span className="font-semibold">!</span>
            <p>{error}</p>
          </div>
        )}

        {/* Filters */}
        <section className="mt-10 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold sm:text-lg">
                Inventory
              </h2>

              <p className="mt-1 text-sm text-neutral-400">
                Search and filter your products
              </p>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-medium text-neutral-500 underline underline-offset-4 transition hover:text-black"
              >
                Clear
              </button>
            )}
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_220px_190px]">

            {/* Search */}
            <div className="relative">
              <label htmlFor="search" className="sr-only">
                Search
              </label>

              <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-neutral-400">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </div>

              <input
                id="search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search product or brand..."
                className="h-13 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-12 pr-4 text-base outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="sr-only">
                Category
              </label>

              <select
                id="category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-13 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-base outline-none transition focus:border-black focus:bg-white"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="sr-only">
                Status
              </label>

              <select
                id="status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-13 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-base outline-none transition focus:border-black focus:bg-white"
              >
                <option value="All">All Status</option>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
              </select>
            </div>
          </div>

          {hasFilters && (
            <div className="mt-5 border-t border-neutral-100 pt-4">
              <p className="text-sm text-neutral-500">
                Showing{" "}
                <span className="font-semibold text-black">
                  {filteredProducts.length}
                </span>{" "}
                of {products.length} products
              </p>
            </div>
          )}
        </section>

        {/* Products */}
        <section className="mt-7">

          {loading ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-sm sm:p-20">
              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-neutral-200 border-t-black" />

              <p className="mt-5 text-base text-neutral-500">
                Loading products...
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-20 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-3xl">
                +
              </div>

              <h2 className="mt-6 text-xl font-semibold">
                No products yet
              </h2>

              <p className="mx-auto mt-3 max-w-sm text-base leading-7 text-neutral-500">
                Add your first product to start building your
                inventory.
              </p>

              <Link
                href="/admin/products/new"
                className="mt-7 inline-flex h-12 items-center bg-black px-6 text-base font-medium text-white transition hover:bg-neutral-800"
              >
                Add Product
              </Link>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-20 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                <svg
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </div>

              <h2 className="mt-6 text-xl font-semibold">
                No matching products
              </h2>

              <p className="mt-3 text-base text-neutral-500">
                Try changing your search or filters.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 text-base font-medium underline underline-offset-4"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">

              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className="group rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5"
                >
                  <div className="flex gap-4 sm:gap-5">

                    {/* Image */}
                    <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:h-32 sm:w-32">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          unoptimized
                          sizes="128px"
                          className={`object-cover transition duration-300 group-hover:scale-105 ${
                            product.status === "sold"
                              ? "opacity-50 grayscale"
                              : ""
                          }`}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs uppercase tracking-wide text-neutral-400">
                          No image
                        </div>
                      )}

                      {product.status === "sold" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
                            Sold
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product content */}
                    <div className="min-w-0 flex-1">

                      <div className="flex items-start justify-between gap-4">

                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400 sm:text-sm">
                            {product.brand}
                          </p>

                          <h2 className="mt-1 text-base font-semibold leading-6 sm:text-lg sm:leading-7">
                            {product.name}
                          </h2>
                        </div>

                        {/* Desktop price */}
                        <p className="hidden shrink-0 text-lg font-semibold sm:block">
                          ₱{product.price.toLocaleString()}
                        </p>
                      </div>

                      {/* Product information */}
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500 sm:mt-3 sm:text-base">
                        <span>{product.size}</span>

                        <span className="text-neutral-300">·</span>

                        <span>{product.color}</span>

                        <span className="text-neutral-300">·</span>

                        <span>{product.category}</span>
                      </div>

                      {/* Mobile price + status */}
                      <div className="mt-4 flex items-center justify-between sm:hidden">

                        <p className="text-base font-semibold">
                          ₱{product.price.toLocaleString()}
                        </p>

                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                            product.status === "sold"
                              ? "bg-green-600 text-white"
                              : "bg-black text-white"
                          }`}
                        >
                          {product.status === "sold"
                            ? "Sold"
                            : "Available"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom actions */}
                  <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4 sm:mt-5 sm:pt-5">

                    {/* Desktop status */}
                    <div className="hidden sm:block">
                      <span
                        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                          product.status === "sold"
                            ? "bg-green-600 text-white"
                            : "bg-black text-white"
                        }`}
                      >
                        {product.status === "sold"
                          ? "Sold"
                          : "Available"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex w-full items-center justify-end gap-5 sm:w-auto">

                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-sm font-medium text-neutral-500 transition hover:text-black"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        disabled={updatingId === product.id}
                        onClick={() => toggleStatus(product)}
                        className="text-sm font-medium transition hover:text-neutral-500 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {updatingId === product.id
                          ? "Updating..."
                          : product.status === "sold"
                          ? "Mark Available"
                          : "Mark Sold"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Result count */}
        {!loading && filteredProducts.length > 0 && (
          <div className="py-10 text-center">
            <p className="text-sm text-neutral-400">
              Showing {filteredProducts.length}{" "}
              {filteredProducts.length === 1
                ? "product"
                : "products"}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
