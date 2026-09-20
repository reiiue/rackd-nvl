"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ProductImage = {
  id: number;
  image_url: string;
  sort_order: number;
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();

  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [condition, setCondition] = useState("");
  const [category, setCategory] = useState("");

  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [waist, setWaist] = useState("");

  const [description, setDescription] = useState("");

  const [status, setStatus] = useState<"available" | "sold">(
    "available"
  );

  const [images, setImages] = useState<ProductImage[]>([]);

  /*
   * Load product
   */
  useEffect(() => {
    async function loadProduct() {
      setError("");

      const { data: product, error: productError } =
        await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .single();

      if (productError || !product) {
        console.error("Load product error:", productError);

        setError("Product could not be found.");
        setLoading(false);

        return;
      }

      setName(product.name);
      setBrand(product.brand);
      setPrice(String(product.price));

      setOriginalPrice(
        product.original_price !== null
          ? String(product.original_price)
          : ""
      );

      setSize(product.size);
      setColor(product.color);
      setCondition(product.condition);
      setCategory(product.category);

      setLength(product.measurements?.length ?? "");
      setWidth(product.measurements?.width ?? "");
      setWaist(product.measurements?.waist ?? "");

      setDescription(product.description ?? "");

      setStatus(product.status);

      const {
        data: productImages,
        error: imagesError,
      } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order", {
          ascending: true,
        });

      if (imagesError) {
        console.error(
          "Load product images error:",
          imagesError
        );
      }

      setImages(productImages ?? []);
      setLoading(false);
    }

    loadProduct();
  }, [productId]);

  /*
   * Save product
   */
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSaving(true);

    const measurements = {
      ...(length && { length }),
      ...(width && { width }),
      ...(waist && { waist }),
    };

    const { error: updateError } = await supabase
      .from("products")
      .update({
        name,
        brand,
        price: Number(price),
        original_price: originalPrice
          ? Number(originalPrice)
          : null,
        size,
        color,
        condition,
        category,
        measurements,
        description: description || null,
        status,
      })
      .eq("id", productId);

    if (updateError) {
      console.error(
        "Update product error:",
        updateError
      );

      setError(updateError.message);
      setSaving(false);

      return;
    }

    router.push("/admin");
    router.refresh();
  }

  /*
   * Add more product photos
   *
   * Newly selected images are added to the
   * existing images instead of replacing them.
   */
  async function handleAddImages(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    if (!event.target.files) {
      return;
    }

    const files = Array.from(event.target.files);

    if (files.length === 0) {
      return;
    }

    setImageError("");
    setImageLoading(true);

    try {
      const nextSortOrder =
        images.length > 0
          ? Math.max(
              ...images.map(
                (image) => image.sort_order
              )
            ) + 1
          : 0;

      const uploadedImages: ProductImage[] = [];

      for (
        let index = 0;
        index < files.length;
        index++
      ) {
        const file = files[index];

        const extension =
          file.name.split(".").pop()?.toLowerCase() ||
          "jpg";

        const timestamp = Date.now();

        const filePath =
          `${productId}/${timestamp}-${index}.${extension}`;

        const { error: uploadError } =
          await supabase.storage
            .from("product-images")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
            });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const {
          data: { publicUrl },
        } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        const {
          data: insertedImage,
          error: insertError,
        } = await supabase
          .from("product_images")
          .insert({
            product_id: productId,
            image_url: publicUrl,
            sort_order:
              nextSortOrder + index,
          })
          .select()
          .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        uploadedImages.push(insertedImage);
      }

      setImages((currentImages) => [
        ...currentImages,
        ...uploadedImages,
      ]);

      /*
       * If there was no previous image,
       * make the first uploaded image the main image.
       */
      if (
        images.length === 0 &&
        uploadedImages.length > 0
      ) {
        const {
          error: mainImageError,
        } = await supabase
          .from("products")
          .update({
            image:
              uploadedImages[0].image_url,
          })
          .eq("id", productId);

        if (mainImageError) {
          throw new Error(
            mainImageError.message
          );
        }
      }
    } catch (error) {
      console.error(
        "Add images error:",
        error
      );

      setImageError(
        error instanceof Error
          ? error.message
          : "Something went wrong while uploading images."
      );
    } finally {
      setImageLoading(false);

      /*
       * Reset input so the same image
       * can be selected again.
       */
      event.target.value = "";
    }
  }

  /*
   * Delete image
   */
  async function handleDeleteImage(
    image: ProductImage
  ) {
    const confirmed = window.confirm(
      "Delete this product photo?"
    );

    if (!confirmed) {
      return;
    }

    setImageError("");
    setImageLoading(true);

    try {
      const marker =
        "/storage/v1/object/public/product-images/";

      const markerIndex =
        image.image_url.indexOf(marker);

      if (markerIndex === -1) {
        throw new Error(
          "Could not determine the storage path for this image."
        );
      }

      const filePath =
        image.image_url.substring(
          markerIndex + marker.length
        );

      const { error: storageError } =
        await supabase.storage
          .from("product-images")
          .remove([filePath]);

      if (storageError) {
        throw new Error(
          storageError.message
        );
      }

      const { error: databaseError } =
        await supabase
          .from("product_images")
          .delete()
          .eq("id", image.id);

      if (databaseError) {
        throw new Error(
          databaseError.message
        );
      }

      const remainingImages = images.filter(
        (currentImage) =>
          currentImage.id !== image.id
      );

      setImages(remainingImages);

      /*
       * If the deleted image was the main image,
       * automatically use the first remaining image.
       */
      const { data: product } =
        await supabase
          .from("products")
          .select("image")
          .eq("id", productId)
          .single();

      if (
        product?.image === image.image_url
      ) {
        const newMainImage =
          remainingImages[0]?.image_url || "";

        const {
          error: mainImageError,
        } = await supabase
          .from("products")
          .update({
            image: newMainImage,
          })
          .eq("id", productId);

        if (mainImageError) {
          throw new Error(
            mainImageError.message
          );
        }
      }
    } catch (error) {
      console.error(
        "Delete image error:",
        error
      );

      setImageError(
        error instanceof Error
          ? error.message
          : "Something went wrong while deleting the image."
      );
    } finally {
      setImageLoading(false);
    }
  }

  /*
   * Change main image
   */
  async function handleSetMainImage(
    image: ProductImage
  ) {
    setImageError("");
    setImageLoading(true);

    try {
      const reorderedImages = [
        image,
        ...images.filter(
          (currentImage) =>
            currentImage.id !== image.id
        ),
      ];

      for (
        let index = 0;
        index < reorderedImages.length;
        index++
      ) {
        const currentImage =
          reorderedImages[index];

        const {
          error: updateError,
        } = await supabase
          .from("product_images")
          .update({
            sort_order: index,
          })
          .eq("id", currentImage.id);

        if (updateError) {
          throw new Error(
            updateError.message
          );
        }
      }

      const {
        error: mainImageError,
      } = await supabase
        .from("products")
        .update({
          image: image.image_url,
        })
        .eq("id", productId);

      if (mainImageError) {
        throw new Error(
          mainImageError.message
        );
      }

      setImages(reorderedImages);
    } catch (error) {
      console.error(
        "Set main image error:",
        error
      );

      setImageError(
        error instanceof Error
          ? error.message
          : "Something went wrong while changing the main image."
      );
    } finally {
      setImageLoading(false);
    }
  }

  /*
   * Delete entire product
   */
  async function handleDeleteProduct() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product? This cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setDeleting(true);

    try {
      const {
        data: storageFiles,
        error: storageListError,
      } = await supabase.storage
        .from("product-images")
        .list(productId);

      if (storageListError) {
        throw new Error(
          storageListError.message
        );
      }

      if (
        storageFiles &&
        storageFiles.length > 0
      ) {
        const filePaths =
          storageFiles.map(
            (file) =>
              `${productId}/${file.name}`
          );

        const {
          error: storageDeleteError,
        } = await supabase.storage
          .from("product-images")
          .remove(filePaths);

        if (storageDeleteError) {
          throw new Error(
            storageDeleteError.message
          );
        }
      }

      const {
        error: productDeleteError,
      } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (productDeleteError) {
        throw new Error(
          productDeleteError.message
        );
      }

      router.push("/admin");
      router.refresh();
    } catch (error) {
      console.error(
        "Delete product error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while deleting the product."
      );

      setDeleting(false);
    }
  }

  /*
   * Loading state
   */
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-sm text-neutral-500">
          Loading product...
        </p>
      </main>
    );
  }

  /*
   * Product not found
   */
  if (error && !name) {
    return (
      <main className="min-h-screen bg-neutral-50 px-5 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/admin")
            }
            className="mt-5 text-sm underline underline-offset-4"
          >
            Back to Products
          </button>
        </div>
      </main>
    );
  }

  /*
   * Display values for live preview
   */
  const displayName =
    name || "Product Name";

  const displayBrand =
    brand || "Brand";

  const displaySize =
    size || "—";

  const displayColor =
    color || "—";

  const displayCondition =
    condition || "Condition";

  const displayCategory =
    category || "Category";

  const formattedPrice =
    price
      ? `₱${Number(price).toLocaleString()}`
      : "₱0";

  const formattedOriginalPrice =
    originalPrice
      ? `₱${Number(
          originalPrice
        ).toLocaleString()}`
      : null;

  const displayStatus =
    status === "available"
      ? "Available"
      : "Sold";

  return (
    <main className="min-h-screen bg-neutral-50 text-black">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            <span>Products</span>
            <span>/</span>
            <span>Edit</span>
          </div>

          <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Edit Product
              </h1>

              <p className="mt-2 text-sm text-neutral-500 sm:text-base">
                Update your listing and preview your changes before saving.
              </p>
            </div>

            <div className="hidden rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-500 lg:block">
              Live Preview
            </div>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            <span className="font-semibold">
              Error
            </span>

            <span>{error}</span>
          </div>
        )}

        {/* Main Layout */}
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_460px]">

          {/* LEFT — FORM */}
          <form
            onSubmit={handleSubmit}
            className="min-w-0"
          >
            <div className="space-y-5">

              {/* Basic Information */}
              <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                    01
                  </p>

                  <h2 className="mt-1 text-lg font-semibold">
                    Basic Information
                  </h2>

                  <p className="mt-1 text-sm text-neutral-500">
                    Update the essential product details.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">

                  {/* Product Name */}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-medium"
                    >
                      Product Name
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      id="name"
                      required
                      value={name}
                      onChange={(event) =>
                        setName(
                          event.target.value
                        )
                      }
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                    />
                  </div>

                  {/* Brand */}
                  <div>
                    <label
                      htmlFor="brand"
                      className="mb-2 block text-sm font-medium"
                    >
                      Brand
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      id="brand"
                      required
                      value={brand}
                      onChange={(event) =>
                        setBrand(
                          event.target.value
                        )
                      }
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label
                      htmlFor="category"
                      className="mb-2 block text-sm font-medium"
                    >
                      Category
                    </label>

                    <select
                      id="category"
                      value={category}
                      onChange={(event) =>
                        setCategory(
                          event.target.value
                        )
                      }
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                    >
                      <option value="">
                        Select category
                      </option>

                      <option value="T-Shirts">
                        T-Shirts
                      </option>

                      <option value="Shirts">
                        Shirts
                      </option>

                      <option value="Sweatshirts">
                        Sweatshirts
                      </option>

                      <option value="Hoodies">
                        Hoodies
                      </option>

                      <option value="Jackets">
                        Jackets
                      </option>

                      <option value="Pants">
                        Pants
                      </option>

                      <option value="Shorts">
                        Shorts
                      </option>

                      <option value="Other">
                        Other
                      </option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Pricing */}
              <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                    02
                  </p>

                  <h2 className="mt-1 text-lg font-semibold">
                    Pricing
                  </h2>

                  <p className="mt-1 text-sm text-neutral-500">
                    Set your selling price and original price.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">

                  {/* Selling Price */}
                  <div>
                    <label
                      htmlFor="price"
                      className="mb-2 block text-sm font-medium"
                    >
                      Selling Price
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                        ₱
                      </span>

                      <input
                        id="price"
                        type="number"
                        min="0"
                        required
                        value={price}
                        onChange={(event) =>
                          setPrice(
                            event.target.value
                          )
                        }
                        className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                      />
                    </div>
                  </div>

                  {/* Original Price */}
                  <div>
                    <label
                      htmlFor="originalPrice"
                      className="mb-2 block text-sm font-medium"
                    >
                      Original Price
                      <span className="ml-1 text-xs font-normal text-neutral-400">
                        optional
                      </span>
                    </label>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                        ₱
                      </span>

                      <input
                        id="originalPrice"
                        type="number"
                        min="0"
                        value={originalPrice}
                        onChange={(event) =>
                          setOriginalPrice(
                            event.target.value
                          )
                        }
                        className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Details */}
              <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                    03
                  </p>

                  <h2 className="mt-1 text-lg font-semibold">
                    Product Details
                  </h2>

                  <p className="mt-1 text-sm text-neutral-500">
                    Add the item's size, color, condition, and status.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">

                  {/* Size */}
                  <div>
                    <label
                      htmlFor="size"
                      className="mb-2 block text-sm font-medium"
                    >
                      Size
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      id="size"
                      required
                      value={size}
                      onChange={(event) =>
                        setSize(
                          event.target.value
                        )
                      }
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                    />
                  </div>

                  {/* Color */}
                  <div>
                    <label
                      htmlFor="color"
                      className="mb-2 block text-sm font-medium"
                    >
                      Color
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      id="color"
                      required
                      value={color}
                      onChange={(event) =>
                        setColor(
                          event.target.value
                        )
                      }
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                    />
                  </div>

                  {/* Condition */}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="condition"
                      className="mb-2 block text-sm font-medium"
                    >
                      Condition
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      id="condition"
                      required
                      value={condition}
                      onChange={(event) =>
                        setCondition(
                          event.target.value
                        )
                      }
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                    />
                  </div>

                  {/* Status */}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="status"
                      className="mb-2 block text-sm font-medium"
                    >
                      Status
                    </label>

                    <select
                      id="status"
                      value={status}
                      onChange={(event) =>
                        setStatus(
                          event.target.value as
                            | "available"
                            | "sold"
                        )
                      }
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                    >
                      <option value="available">
                        Available
                      </option>

                      <option value="sold">
                        Sold
                      </option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Measurements */}
              <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                    04
                  </p>

                  <h2 className="mt-1 text-lg font-semibold">
                    Measurements
                  </h2>

                  <p className="mt-1 text-sm text-neutral-500">
                    Leave blank if a measurement does not apply.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-3">

                  {/* Length */}
                  <div>
                    <label
                      htmlFor="length"
                      className="mb-2 block text-sm font-medium"
                    >
                      Length
                    </label>

                    <input
                      id="length"
                      value={length}
                      onChange={(event) =>
                        setLength(
                          event.target.value
                        )
                      }
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                      placeholder='29"'
                    />
                  </div>

                  {/* Width */}
                  <div>
                    <label
                      htmlFor="width"
                      className="mb-2 block text-sm font-medium"
                    >
                      Width
                    </label>

                    <input
                      id="width"
                      value={width}
                      onChange={(event) =>
                        setWidth(
                          event.target.value
                        )
                      }
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                      placeholder='21"'
                    />
                  </div>

                  {/* Waist */}
                  <div>
                    <label
                      htmlFor="waist"
                      className="mb-2 block text-sm font-medium"
                    >
                      Waist
                    </label>

                    <input
                      id="waist"
                      value={waist}
                      onChange={(event) =>
                        setWaist(
                          event.target.value
                        )
                      }
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                      placeholder='27"'
                    />
                  </div>
                </div>
              </section>

              {/* Description */}
              <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                    05
                  </p>

                  <h2 className="mt-1 text-lg font-semibold">
                    Description
                  </h2>

                  <p className="mt-1 text-sm text-neutral-500">
                    Add any additional information buyers should know.
                  </p>
                </div>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  rows={5}
                  className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                  placeholder="Additional information about the product..."
                />
              </section>

              {/* Product Photos */}
              <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                    06
                  </p>

                  <h2 className="mt-1 text-lg font-semibold">
                    Product Photos
                  </h2>

                  <p className="mt-1 text-sm text-neutral-500">
                    The first photo becomes the main product image.
                  </p>
                </div>

                {/* Image Error */}
                {imageError && (
                  <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                    <span className="font-semibold">
                      Error
                    </span>

                    <span>{imageError}</span>
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  id="product-images"
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={imageLoading}
                  onChange={handleAddImages}
                  className="sr-only"
                />

                {/* No Photos */}
                {images.length === 0 && (
                  <label
                    htmlFor="product-images"
                    className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 px-5 py-10 text-center transition hover:border-neutral-400 hover:bg-neutral-100"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl shadow-sm">
                      +
                    </div>

                    <p className="mt-4 text-sm font-semibold">
                      Add product photos
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      Select one or more images
                    </p>

                    <span className="mt-4 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-xs font-medium transition group-hover:border-neutral-300">
                      {imageLoading
                        ? "Processing..."
                        : "Choose Files"}
                    </span>
                  </label>
                )}

                {/* Existing Photos */}
                {images.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {images.length}{" "}
                        {images.length === 1
                          ? "photo"
                          : "photos"}{" "}
                        added
                      </p>

                      {imageLoading && (
                        <p className="text-xs text-neutral-400">
                          Processing...
                        </p>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {images.map(
                        (image, index) => (
                          <div
                            key={image.id}
                            className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white"
                          >
                            {/* Image */}
                            <div className="relative aspect-square bg-neutral-100">
                              <Image
                                src={image.image_url}
                                alt={`${name} photo ${index + 1}`}
                                fill
                                unoptimized
                                className="object-cover"
                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                              />

                              {/* MAIN */}
                              {index === 0 && (
                                <div className="absolute left-2 top-2 rounded-md bg-black px-2 py-1 text-[9px] font-semibold tracking-[0.1em] text-white">
                                  MAIN
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="space-y-2 border-t border-neutral-200 p-3">
                              {index === 0 ? (
                                <p className="text-xs font-medium">
                                  Main Photo
                                </p>
                              ) : (
                                <button
                                  type="button"
                                  disabled={imageLoading}
                                  onClick={() =>
                                    handleSetMainImage(
                                      image
                                    )
                                  }
                                  className="text-xs text-neutral-500 underline underline-offset-4 transition hover:text-black disabled:opacity-50"
                                >
                                  Set as Main
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={imageLoading}
                                onClick={() =>
                                  handleDeleteImage(
                                    image
                                  )
                                }
                                className="block text-xs text-red-500 transition hover:text-red-700 disabled:opacity-50"
                              >
                                Delete Photo
                              </button>
                            </div>
                          </div>
                        )
                      )}

                      {/* Add More */}
                      <label
                        htmlFor="product-images"
                        className={`flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 text-center text-neutral-400 transition ${
                          imageLoading
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer hover:border-neutral-400 hover:bg-neutral-100 hover:text-black"
                        }`}
                      >
                        <span className="text-3xl font-light leading-none">
                          +
                        </span>

                        <span className="mt-2 text-xs font-medium">
                          Add more
                        </span>

                        <span className="mt-1 px-4 text-[10px] text-neutral-400">
                          Select additional photos
                        </span>
                      </label>
                    </div>

                    <p className="mt-3 text-xs text-neutral-400">
                      New photos will be added to your existing selection.
                    </p>
                  </div>
                )}
              </section>

              {/* Mobile Actions */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm lg:hidden">
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">

                  <button
                    type="button"
                    onClick={() =>
                      router.back()
                    }
                    disabled={
                      saving ||
                      deleting
                    }
                    className="h-12 w-full rounded-xl px-5 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-black disabled:opacity-50 sm:w-auto"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving ||
                      deleting ||
                      imageLoading
                    }
                    className="h-12 w-full rounded-xl bg-black px-7 text-sm font-semibold !text-white transition hover:bg-neutral-800 hover:!text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {saving
                      ? "Saving Changes..."
                      : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* RIGHT — LIVE PREVIEW */}
          <aside className="lg:sticky lg:top-6">

            {/* Preview Header */}
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  Customer View
                </p>

                <h2 className="mt-1 text-lg font-semibold">
                  Listing Preview
                </h2>
              </div>

              <span className="rounded-full bg-black px-3 py-1.5 text-[10px] font-medium text-white">
                LIVE
              </span>
            </div>

            {/* Preview Card */}
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">

              {/* Main Preview Image */}
              <div className="relative aspect-[4/5] bg-neutral-100">

                {images.length > 0 ? (
                  <Image
                    src={images[0].image_url}
                    alt={displayName}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 460px"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl text-neutral-300 shadow-sm">
                      +
                    </div>

                    <p className="mt-4 text-sm font-medium text-neutral-400">
                      Product photo
                    </p>

                    <p className="mt-1 text-xs text-neutral-400">
                      Add a product photo to preview it here
                    </p>
                  </div>
                )}

                {/* Status Badge */}
                <div
                  className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider !text-white ${
                    status === "available"
                      ? "bg-black"
                      : "bg-neutral-500"
                  }`}
                >
                  {displayStatus}
                </div>
              </div>

              {/* Preview Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto border-b border-neutral-100 p-3">
                  {images.map(
                    (image, index) => (
                      <div
                        key={`preview-${image.id}`}
                        className={`h-16 w-16 flex-none overflow-hidden rounded-lg border ${
                          index === 0
                            ? "border-black"
                            : "border-neutral-200"
                        }`}
                      >
                        <Image
                          src={image.image_url}
                          alt=""
                          width={64}
                          height={64}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Product Information */}
              <div className="p-5">

                {/* Category */}
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  {displayCategory}
                </p>

                {/* Name */}
                <h3 className="mt-2 text-xl font-semibold leading-tight tracking-tight">
                  {displayName}
                </h3>

                {/* Brand */}
                <p className="mt-1 text-sm text-neutral-500">
                  {displayBrand}
                </p>

                {/* Price */}
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold tracking-tight">
                    {formattedPrice}
                  </span>

                  {formattedOriginalPrice && (
                    <span className="text-sm text-neutral-400 line-through">
                      {formattedOriginalPrice}
                    </span>
                  )}
                </div>

                {/* Size / Color */}
                <div className="mt-5 grid grid-cols-2 border-y border-neutral-200 py-4">

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                      Size
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {displaySize}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                      Color
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {displayColor}
                    </p>
                  </div>
                </div>

                {/* Condition */}
                <div className="mt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                    Condition
                  </p>

                  <p className="mt-1 text-sm text-neutral-600">
                    {displayCondition}
                  </p>
                </div>

                {/* Measurements */}
                {(length ||
                  width ||
                  waist) && (
                  <div className="mt-5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                      Measurements
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {length && (
                        <span className="rounded-lg bg-neutral-100 px-3 py-2 text-xs font-medium">
                          Length {length}
                        </span>
                      )}

                      {width && (
                        <span className="rounded-lg bg-neutral-100 px-3 py-2 text-xs font-medium">
                          Width {width}
                        </span>
                      )}

                      {waist && (
                        <span className="rounded-lg bg-neutral-100 px-3 py-2 text-xs font-medium">
                          Waist {waist}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                {description && (
                  <div className="mt-5 border-t border-neutral-200 pt-5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                      Description
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-neutral-600">
                      {description}
                    </p>
                  </div>
                )}

                {/* Add to Cart Preview */}
                <button
                  type="button"
                  disabled
                  className="mt-6 h-12 w-full rounded-xl bg-black text-sm font-semibold !text-white opacity-100"
                >
                  Add to Cart
                </button>

                <p className="mt-3 text-center text-[10px] text-neutral-400">
                  This is a live preview of how your listing will appear.
                </p>
              </div>
            </div>

            {/* Preview Note */}
            <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
              <p className="text-xs font-medium">
                Live preview
              </p>

              <p className="mt-1 text-xs leading-5 text-neutral-500">
                Changes you make on the left will automatically appear here before you save the product.
              </p>
            </div>

            {/* Desktop Actions */}
            <div className="mt-4 hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm lg:block">
              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={() =>
                    router.back()
                  }
                  disabled={
                    saving ||
                    deleting
                  }
                  className="h-12 flex-1 rounded-xl px-5 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-black disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    saving ||
                    deleting ||
                    imageLoading
                  }
                  onClick={() => {
                    const form =
                      document.querySelector(
                        "form"
                      ) as HTMLFormElement | null;

                    form?.requestSubmit();
                  }}
                  className="h-12 flex-[1.5] rounded-xl bg-black px-6 text-sm font-semibold !text-white transition hover:bg-neutral-800 hover:!text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </div>
          </aside>
        </div>

        {/* Danger Zone */}
        <section className="mt-8 rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-6">

          <h2 className="mt-1 text-lg font-semibold text-red-600">
            Delete Product
          </h2>

          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Permanently delete this product and all of its stored images.
            This action cannot be undone.
          </p>

          <button
            type="button"
            onClick={handleDeleteProduct}
            disabled={
              deleting ||
              saving ||
              imageLoading
            }
            className="mt-5 h-12 rounded-xl border border-red-300 px-5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting
              ? "Deleting..."
              : "Delete Product"}
          </button>
        </section>
      </div>
    </main>
  );
}