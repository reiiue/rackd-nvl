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
};

type SupabaseProductImage = {
  id: number;
  product_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
};

function formatProduct(
  product: SupabaseProduct,
  images: SupabaseProductImage[] = []
): Product {
  const sortedImages = [...images]
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

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
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

  const productIds = data.map((product) => product.id);

  const { data: imageData, error: imageError } = await supabase
    .from("product_images")
    .select("*")
    .in("product_id", productIds)
    .order("sort_order", { ascending: true });

  if (imageError) {
    console.error("Error fetching product images:", {
      code: imageError.code,
      message: imageError.message,
      details: imageError.details,
      hint: imageError.hint,
    });
  }

  const images = (imageData ?? []) as SupabaseProductImage[];

  return (data as SupabaseProduct[]).map((product) => {
    const productImages = images.filter(
      (image) => image.product_id === product.id
    );

    return formatProduct(product, productImages);
  });
}

export async function getProductById(
  id: string
): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
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

  const { data: imageData, error: imageError } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", id)
    .order("sort_order", { ascending: true });

  if (imageError) {
    console.error("Error fetching product images:", {
      id,
      code: imageError.code,
      message: imageError.message,
      details: imageError.details,
      hint: imageError.hint,
    });
  }

  return formatProduct(
    data as SupabaseProduct,
    (imageData ?? []) as SupabaseProductImage[]
  );
}