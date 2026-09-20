export type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;

  size: string;
  color: string;
  condition: string;

  category: string;

  image: string;
  images?: string[];

  measurements?: {
    length?: string;
    width?: string;
    waist?: string;
  };

  description?: string;

  status: "available" | "sold";
};