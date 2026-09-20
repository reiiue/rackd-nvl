
"use client";

import { useEffect, useMemo, useState } from "react";

import ProductGrid from "@/components/ProductGrid";

import { Product } from "@/types/product";

type ShopClientProps = {
  products: Product[];
  selectedCategory?: string;
};

export default function ShopClient({
  products,
  selectedCategory,
}: ShopClientProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("newest");

  const categories = [
    "All",
    "T-Shirts",
    "Shirts",
    "Sweatshirts",
    "Hoodies",
    "Pants",
    "Jeans",
    "Jackets",
    "Outerwear",
  ];

  const initialCategory = selectedCategory
    ? selectedCategory
        .split("-")
        .map(
          (word) =>
            word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join("-")
    : "All";

  const [category, setCategory] = useState(initialCategory);

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search
    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter((product) => {
        const searchableText = [
          product.name,
          product.brand,
          product.category,
          product.color,
          product.size,
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      });
    }

    // Category
    if (category !== "All") {
      result = result.filter(
        (product) =>
          product.category?.trim().toLowerCase() ===
          category.trim().toLowerCase()
      );
    }

    // Status
    if (status !== "All") {
      result = result.filter(
        (product) => product.status === status
      );
    }

    // Sort
    if (sort === "price-low") {
      result.sort((a, b) => a.price - b.price);
    }

    if (sort === "price-high") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, search, category, status, sort]);

  const hasActiveFilters =
    category !== "All" ||
    status !== "All" ||
    search.trim() !== "";

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setStatus("All");
    setSort("newest");
  };

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">

        {/* Header */}
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">
              Collection
            </p>

            <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              {category === "All" ? "Shop" : category}
            </h1>
          </div>

          <div className="shrink-0 pb-1 text-right">
            <p className="text-sm font-medium sm:text-base">
              {filteredProducts.length}
            </p>

            <p className="text-[11px] uppercase tracking-[0.15em] text-neutral-400">
              {filteredProducts.length === 1
                ? "Item"
                : "Items"}
            </p>
          </div>
        </div>

        {/* Search + Controls */}
        <div className="mb-5 flex flex-col gap-2 sm:flex-row">

          {/* Search */}
          <div className="relative flex-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>

            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full border border-neutral-200 bg-neutral-50 pl-11 pr-10 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-0 top-0 flex h-11 w-10 items-center justify-center text-neutral-400 transition hover:text-black"
                aria-label="Clear search"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-4 w-4"
                >
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            )}
          </div>

          {/* Availability */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-11 border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-black sm:w-[155px]"
          >
            <option value="All">All Items</option>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-11 border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-black sm:w-[175px]"
          >
            <option value="newest">Newest</option>
            <option value="price-low">
              Price: Low to High
            </option>
            <option value="price-high">
              Price: High to Low
            </option>
          </select>
        </div>

        {/* Categories */}
        <div className="mb-6 -mx-4 border-y border-neutral-100 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-none">
            {categories.map((item) => {
              const active = category === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition ${
                    active
                      ? "bg-black text-white"
                      : "border border-neutral-200 bg-white text-neutral-600 hover:border-black hover:text-black"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Filters / Results */}
        <div className="mb-5 flex min-h-[22px] items-center justify-between">
          <p className="text-xs text-neutral-400">
            {category !== "All" ? (
              <>
                Category:{" "}
                <span className="font-medium text-neutral-700">
                  {category}
                </span>
              </>
            ) : (
              "All products"
            )}
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-400 underline underline-offset-4 transition hover:text-black"
            >
              Clear
            </button>
          )}
        </div>

        {/* Products */}
        {filteredProducts.length > 0 ? (
          <ProductGrid products={filteredProducts} />
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center border border-dashed border-neutral-200 px-5 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mb-4 h-7 w-7 text-neutral-300"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>

            <h2 className="text-base font-medium">
              No products found
            </h2>

            <p className="mt-1 text-sm text-neutral-400">
              Try another search or category.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 bg-black px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-white transition hover:bg-neutral-800"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
