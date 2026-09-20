import { supabase } from "@/lib/supabase";
import { Product } from "@/types/product";

type SupabaseProduct = {
  id: string;
  name: string;
  brand: string;
  price: number;
  original_price: number | null;

  size: string;
  color: string;
  condition: string;
  category: string;

  image: string;

  measurements: {
    length?: string;
    width?: string;
    waist?: string;
  } | null;

  description: string | null;
  status: "available" | "sold";
  created_at: string;

  product_images?: SupabaseProductImage[];
};

type SupabaseProductImage = {
  id: number;
  product_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
};

function formatProduct(product: SupabaseProduct): Product {
  const sortedImages = [...(product.product_images ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => image.image_url);

  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    price: Number(product.price),

    ...(product.original_price !== null && {
      originalPrice: Number(product.original_price),
    }),

    size: product.size,
    color: product.color,
    condition: product.condition,
    category: product.category,

    image: product.image,

    ...(sortedImages.length > 0 && {
      images: sortedImages,
    }),

    ...(product.measurements && {
      measurements: product.measurements,
    }),

    ...(product.description && {
      description: product.description,
    }),

    status: product.status,
  };
}

/**
 * Get all products.
 */
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      brand,
      price,
      original_price,
      size,
      color,
      condition,
      category,
      image,
      measurements,
      description,
      status,
      created_at,
      product_images (
        id,
        product_id,
        image_url,
        sort_order,
        created_at
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  return (data as SupabaseProduct[]).map(formatProduct);
}

/**
 * Get a single product.
 */
export async function getProductById(
  id: string
): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      brand,
      price,
      original_price,
      size,
      color,
      condition,
      category,
      image,
      measurements,
      description,
      status,
      created_at,
      product_images (
        id,
        product_id,
        image_url,
        sort_order,
        created_at
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching product:", {
      id,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    return null;
  }

  if (!data) {
    return null;
  }

  return formatProduct(data as SupabaseProduct);
}