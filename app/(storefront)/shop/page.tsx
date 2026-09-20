import type { Metadata } from "next";

import ShopClient from "@/components/ShopClient";
import { getProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop | rackd.nvl",
  description:
    "Shop affordable pre-loved branded clothing from rackd.nvl. Discover workwear, vintage, streetwear, sportswear, and more.",
};

type ShopPageProps = {
  searchParams: Promise<{
    category?: string;
  }>;
};

export default async function ShopPage({
  searchParams,
}: ShopPageProps) {
  const [products, params] = await Promise.all([
    getProducts(),
    searchParams,
  ]);

  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <ShopClient
        products={products}
        selectedCategory={params.category}
      />
    </main>
  );
}