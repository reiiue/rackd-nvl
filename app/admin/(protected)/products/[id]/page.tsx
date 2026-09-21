"use client";

import NextImage from "next/image";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

import { supabase } from "@/lib/supabase";

type ProductImage = {
  id: number;
  image_url: string;
  sort_order: number;
};

type ProductForm = {
  name: string;
  brand: string;
  price: string;
  originalPrice: string;
  size: string;
  color: string;
  condition: string;
  category: string;
  length: string;
  width: string;
  waist: string;
  description: string;
  status: "available" | "sold";
};

const categoryOptions = [
  "T-Shirts",
  "Shirts",
  "Polo",
  "Sweatshirts",
  "Hoodies",
  "Jackets",
  "Jeans",
  "Pants",
  "Shorts",
  "Sportswear",
  "Other",
];

async function optimizeImage(file: File): Promise<File> {
  let inputFile = file;

  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.hei(c|f)$/i.test(file.name);

  if (isHeic) {
    try {
      const heic2any = (
        await import("heic2any")
      ).default;

      const convertedBlob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.9,
      });

      const jpegBlob = Array.isArray(
        convertedBlob
      )
        ? convertedBlob[0]
        : convertedBlob;

      inputFile = new File(
        [jpegBlob],
        file.name.replace(
          /\.(heic|heif)$/i,
          ".jpg"
        ),
        {
          type: "image/jpeg",
          lastModified: Date.now(),
        }
      );
    } catch (error) {
      console.error(
        "HEIC conversion error:",
        error
      );

      throw new Error(
        `Could not convert ${file.name}. Please try the photo again.`
      );
    }
  }

  return new Promise((resolve, reject) => {
    const image = new window.Image();

    const objectUrl =
      URL.createObjectURL(inputFile);

    image.onload = () => {
      try {
        const maxSize = 1600;

        let width = image.naturalWidth;
        let height = image.naturalHeight;

        if (
          width > maxSize ||
          height > maxSize
        ) {
          const scale = Math.min(
            maxSize / width,
            maxSize / height
          );

          width = Math.round(
            width * scale
          );

          height = Math.round(
            height * scale
          );
        }

        const canvas =
          document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const context =
          canvas.getContext("2d");

        if (!context) {
          URL.revokeObjectURL(objectUrl);

          reject(
            new Error(
              `Could not process image: ${file.name}`
            )
          );

          return;
        }

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";

        context.drawImage(
          image,
          0,
          0,
          width,
          height
        );

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);

            if (!blob) {
              reject(
                new Error(
                  `Could not convert image: ${file.name}`
                )
              );

              return;
            }

            const baseName =
              file.name.replace(
                /\.[^/.]+$/,
                ""
              );

            const optimizedFile =
              new File(
                [blob],
                `${baseName}.webp`,
                {
                  type: "image/webp",
                  lastModified:
                    Date.now(),
                }
              );

            resolve(optimizedFile);
          },
          "image/webp",
          0.82
        );
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);

      reject(
        new Error(
          `Could not read image: ${file.name}. Please use JPG, PNG, WEBP, HEIC, or HEIF.`
        )
      );
    };

    image.src = objectUrl;
  });
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();

  const productId = String(params.id);

  const [form, setForm] =
    useState<ProductForm>({
      name: "",
      brand: "",
      price: "",
      originalPrice: "",
      size: "",
      color: "",
      condition: "",
      category: "",
      length: "",
      width: "",
      waist: "",
      description: "",
      status: "available",
    });

  const [images, setImages] = useState<
    ProductImage[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [
    imageProcessingStatus,
    setImageProcessingStatus,
  ] = useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [productExists, setProductExists] =
    useState(false);

  useEffect(() => {
    if (!productId) return;

    loadProduct();
  }, [productId]);

  async function loadProduct() {
    setLoading(true);
    setError("");

    try {
      const {
        data: product,
        error: productError,
      } = await supabase
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
          status
        `)
        .eq("id", productId)
        .single();

      if (productError) {
        throw productError;
      }

      if (!product) {
        throw new Error(
          "Product not found."
        );
      }

      const measurements =
        product.measurements ?? {};

      setForm({
        name: product.name ?? "",
        brand: product.brand ?? "",
        price:
          product.price !== null &&
          product.price !== undefined
            ? String(product.price)
            : "",
        originalPrice:
          product.original_price !==
            null &&
          product.original_price !==
            undefined
            ? String(product.original_price)
            : "",
        size: product.size ?? "",
        color: product.color ?? "",
        condition:
          product.condition ?? "",
        category:
          product.category ?? "",
        length:
          measurements.length ?? "",
        width:
          measurements.width ?? "",
        waist:
          measurements.waist ?? "",
        description:
          product.description ?? "",
        status:
          product.status === "sold"
            ? "sold"
            : "available",
      });

      const {
        data: productImages,
        error: imagesError,
      } = await supabase
        .from("product_images")
        .select(`
          id,
          image_url,
          sort_order
        `)
        .eq("product_id", productId)
        .order("sort_order", {
          ascending: true,
        });

      if (imagesError) {
        throw imagesError;
      }

      setImages(
        productImages ?? []
      );

      setProductExists(true);
    } catch (err) {
      console.error(
        "Error loading product:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not load product."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateField(
    field: keyof ProductForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSuccess("");
    setError("");
  }

  async function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError(
        "Product name is required."
      );
      return;
    }

    if (!form.brand.trim()) {
      setError(
        "Brand is required."
      );
      return;
    }

    if (!form.price.trim()) {
      setError(
        "Selling price is required."
      );
      return;
    }

    if (
      Number.isNaN(Number(form.price))
    ) {
      setError(
        "Selling price must be a valid number."
      );
      return;
    }

    if (
      form.originalPrice.trim() &&
      Number.isNaN(
        Number(form.originalPrice)
      )
    ) {
      setError(
        "Original price must be a valid number."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const measurements = {
        length: form.length.trim(),
        width: form.width.trim(),
        waist: form.waist.trim(),
      };

      const {
        error: updateError,
      } = await supabase
        .from("products")
        .update({
          name: form.name.trim(),
          brand: form.brand.trim(),
          price: Number(form.price),
          original_price:
            form.originalPrice.trim()
              ? Number(
                  form.originalPrice
                )
              : null,
          size: form.size.trim(),
          color: form.color.trim(),
          condition:
            form.condition.trim(),
          category:
            form.category.trim(),
          measurements,
          description:
            form.description.trim() ||
            null,
          status: form.status,
        })
        .eq("id", productId);

      if (updateError) {
        throw updateError;
      }

      setSuccess(
        "Product updated successfully."
      );
    } catch (err) {
      console.error(
        "Error saving product:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not update product."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAddImages(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files ?? []
    );

    if (files.length === 0) {
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    const uploadedPaths: string[] = [];
    const insertedImageIds: number[] = [];

    try {
      setImageProcessingStatus(
        "Optimizing photos..."
      );

      const optimizedFiles: File[] = [];

      for (const file of files) {
        const optimized =
          await optimizeImage(file);

        optimizedFiles.push(optimized);
      }

      setImageProcessingStatus(
        "Uploading photos..."
      );

      let nextSortOrder =
        images.length > 0
          ? Math.max(
              ...images.map(
                (image) =>
                  image.sort_order
              )
            ) + 1
          : 0;

      const newlyUploadedImages: ProductImage[] =
        [];

      for (
        let index = 0;
        index < optimizedFiles.length;
        index++
      ) {
        const file =
          optimizedFiles[index];

        const uniqueFileName = `${crypto.randomUUID()}.webp`;

        const filePath = `${productId}/${uniqueFileName}`;

        const {
          error: uploadError,
        } = await supabase.storage
          .from("product-images")
          .upload(
            filePath,
            file,
            {
              cacheControl:
                "31536000",
              upsert: false,
              contentType:
                "image/webp",
            }
          );

        if (uploadError) {
          throw uploadError;
        }

        uploadedPaths.push(
          filePath
        );

        const {
          data: publicUrlData,
        } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        const imageUrl =
          publicUrlData.publicUrl;

        const {
          data: insertedImage,
          error:
            insertImageError,
        } = await supabase
          .from("product_images")
          .insert({
            product_id: productId,
            image_url: imageUrl,
            sort_order:
              nextSortOrder,
          })
          .select(
            "id, image_url, sort_order"
          )
          .single();

        if (insertImageError) {
          throw insertImageError;
        }

        insertedImageIds.push(
          insertedImage.id
        );

        newlyUploadedImages.push(
          insertedImage
        );

        nextSortOrder++;
      }

      setImageProcessingStatus(
        "Saving product photos..."
      );

      const updatedImages = [
        ...images,
        ...newlyUploadedImages,
      ];

      if (
        images.length === 0 &&
        newlyUploadedImages.length >
          0
      ) {
        const firstImage =
          newlyUploadedImages[0];

        const {
          error: mainImageError,
        } = await supabase
          .from("products")
          .update({
            image:
              firstImage.image_url,
          })
          .eq("id", productId);

        if (mainImageError) {
          throw mainImageError;
        }
      }

      setImages(updatedImages);

      setSuccess(
        `${files.length} photo${
          files.length === 1
            ? ""
            : "s"
        } added successfully.`
      );
    } catch (err) {
      console.error(
        "Error uploading images:",
        err
      );

      if (
        insertedImageIds.length >
        0
      ) {
        await supabase
          .from("product_images")
          .delete()
          .in(
            "id",
            insertedImageIds
          );
      }

      if (
        uploadedPaths.length > 0
      ) {
        await supabase.storage
          .from("product-images")
          .remove(
            uploadedPaths
          );
      }

      setError(
        err instanceof Error
          ? err.message
          : "Could not upload photos."
      );
    } finally {
      setUploading(false);
      setImageProcessingStatus("");

      event.target.value = "";
    }
  }

  function getStoragePathFromUrl(
    url: string
  ) {
    const marker =
      "/storage/v1/object/public/product-images/";

    const index =
      url.indexOf(marker);

    if (index === -1) {
      return null;
    }

    return decodeURIComponent(
      url.slice(
        index + marker.length
      )
    );
  }

  async function handleDeleteImage(
    image: ProductImage
  ) {
    const confirmed =
      window.confirm(
        "Delete this photo? This cannot be undone."
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const storagePath =
        getStoragePathFromUrl(
          image.image_url
        );

      if (storagePath) {
        const {
          error: storageError,
        } = await supabase.storage
          .from("product-images")
          .remove([
            storagePath,
          ]);

        if (storageError) {
          console.error(
            "Storage delete error:",
            storageError
          );
        }
      }

      const {
        error: deleteError,
      } = await supabase
        .from("product_images")
        .delete()
        .eq("id", image.id);

      if (deleteError) {
        throw deleteError;
      }

      const remainingImages =
        images.filter(
          (item) =>
            item.id !== image.id
        );

      const wasMain =
        images[0]?.id === image.id;

      if (wasMain) {
        if (
          remainingImages.length >
          0
        ) {
          const newMain =
            remainingImages[0];

          await supabase
            .from("products")
            .update({
              image:
                newMain.image_url,
            })
            .eq(
              "id",
              productId
            );

          const reordered =
            remainingImages.map(
              (
                item,
                index
              ) => ({
                ...item,
                sort_order:
                  index,
              })
            );

          for (
            const item of reordered
          ) {
            await supabase
              .from(
                "product_images"
              )
              .update({
                sort_order:
                  item.sort_order,
              })
              .eq(
                "id",
                item.id
              );
          }

          setImages(
            reordered
          );
        } else {
          await supabase
            .from("products")
            .update({
              image: null,
            })
            .eq(
              "id",
              productId
            );

          setImages([]);
        }
      } else {
        setImages(
          remainingImages
        );
      }

      setSuccess(
        "Photo deleted successfully."
      );
    } catch (err) {
      console.error(
        "Error deleting image:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not delete photo."
      );
    }
  }

  async function handleSetMain(
    image: ProductImage
  ) {
    if (
      images[0]?.id === image.id
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const reordered = [
        image,
        ...images.filter(
          (item) =>
            item.id !== image.id
        ),
      ].map(
        (item, index) => ({
          ...item,
          sort_order:
            index,
        })
      );

      for (
        const item of reordered
      ) {
        const {
          error: updateError,
        } = await supabase
          .from("product_images")
          .update({
            sort_order:
              item.sort_order,
          })
          .eq(
            "id",
            item.id
          );

        if (updateError) {
          throw updateError;
        }
      }

      const {
        error: productError,
      } = await supabase
        .from("products")
        .update({
          image:
            image.image_url,
        })
        .eq("id", productId);

      if (productError) {
        throw productError;
      }

      setImages(reordered);

      setSuccess(
        "Main photo updated."
      );
    } catch (err) {
      console.error(
        "Error setting main image:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not set main photo."
      );
    }
  }

  async function handleDeleteProduct() {
    const confirmed =
      window.confirm(
        "Delete this product permanently? This will also delete all of its photos. This action cannot be undone."
      );

    if (!confirmed) {
      return;
    }

    const secondConfirmation =
      window.confirm(
        `Delete "${form.name}" permanently?`
      );

    if (!secondConfirmation) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const {
        data: storageFiles,
        error:
          storageListError,
      } = await supabase.storage
        .from("product-images")
        .list(productId);

      if (storageListError) {
        console.error(
          "Storage list error:",
          storageListError
        );
      }

      if (
        storageFiles &&
        storageFiles.length > 0
      ) {
        const paths =
          storageFiles.map(
            (file) =>
              `${productId}/${file.name}`
          );

        const {
          error: removeError,
        } = await supabase.storage
          .from("product-images")
          .remove(paths);

        if (removeError) {
          console.error(
            "Storage cleanup error:",
            removeError
          );
        }
      }

      const {
        error: deleteError,
      } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (deleteError) {
        throw deleteError;
      }

      router.push(
        "/admin/products"
      );
      router.refresh();
    } catch (err) {
      console.error(
        "Error deleting product:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not delete product."
      );

      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 text-black">
        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-neutral-500">
              Loading product...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (
    !productExists &&
    !loading
  ) {
    return (
      <main className="min-h-screen bg-neutral-50 text-black">
        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm text-red-700">
              {error ||
                "Product not found."}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/products"
                )
              }
              className="mt-4 text-sm font-medium underline"
            >
              Back to Products
            </button>
          </div>
        </div>
      </main>
    );
  }

  const previewImage =
    images[0]?.image_url || null;

  const isSold =
    form.status === "sold";

  return (
    <main className="min-h-screen bg-neutral-50 text-black">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* Header */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/products"
              )
            }
            className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-neutral-400 transition hover:text-black"
          >
            Products / Edit
          </button>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Edit Product
              </h1>

              <p className="mt-1 text-sm text-neutral-500">
                Update your listing and
                preview it before saving.
              </p>
            </div>

            <div className="w-fit rounded-lg border border-neutral-200 bg-white px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">
                Product ID
              </p>

              <p className="mt-0.5 max-w-[260px] truncate text-xs text-neutral-600">
                {productId}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-sm text-green-700">
              {success}
            </p>
          </div>
        )}

        {imageProcessingStatus && (
          <div className="mb-6 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-sm text-neutral-600">
              {imageProcessingStatus}
            </p>
          </div>
        )}

        <form
          onSubmit={handleSave}
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_460px]"
        >
          {/* LEFT */}
          <div className="space-y-6">

            {/* 01 Basic Information */}
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold tracking-[0.16em] text-neutral-400">
                    01
                  </span>

                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">
                    Basic Information
                  </h2>
                </div>

                <p className="mt-2 text-xs text-neutral-400">
                  Enter the main information
                  customers need to identify
                  the product.
                </p>
              </div>

              <div className="grid gap-5">
                <div>
                  <label className="mb-2 block text-xs font-medium text-neutral-600">
                    Product Name
                  </label>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      updateField(
                        "name",
                        event.target.value
                      )
                    }
                    placeholder="e.g. Uniqlo UT Graphic T-Shirt"
                    disabled={saving}
                    className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-neutral-600">
                      Brand
                    </label>

                    <input
                      type="text"
                      value={form.brand}
                      onChange={(event) =>
                        updateField(
                          "brand",
                          event.target.value
                        )
                      }
                      placeholder="e.g. Uniqlo"
                      disabled={saving}
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-neutral-600">
                      Category
                    </label>

                    <select
                      value={
                        form.category
                      }
                      onChange={(event) =>
                        updateField(
                          "category",
                          event.target.value
                        )
                      }
                      disabled={saving}
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">
                        Select category
                      </option>

                      {categoryOptions.map(
                        (category) => (
                          <option
                            key={category}
                            value={
                              category
                            }
                          >
                            {category}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* 02 Pricing */}
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold tracking-[0.16em] text-neutral-400">
                    02
                  </span>

                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">
                    Pricing
                  </h2>
                </div>

                <p className="mt-2 text-xs text-neutral-400">
                  Set the selling price and
                  optionally show the original
                  retail price.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium text-neutral-600">
                    Selling Price
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                      ₱
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        form.price
                      }
                      onChange={(event) =>
                        updateField(
                          "price",
                          event.target.value
                        )
                      }
                      placeholder="0"
                      disabled={saving}
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-neutral-600">
                    Original Price
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                      ₱
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        form.originalPrice
                      }
                      onChange={(event) =>
                        updateField(
                          "originalPrice",
                          event.target.value
                        )
                      }
                      placeholder="Optional"
                      disabled={saving}
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 03 Product Details */}
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold tracking-[0.16em] text-neutral-400">
                    03
                  </span>

                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">
                    Product Details
                  </h2>
                </div>

                <p className="mt-2 text-xs text-neutral-400">
                  Add the size, color,
                  condition, and current
                  listing status.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium text-neutral-600">
                    Size
                  </label>

                  <input
                    type="text"
                    value={form.size}
                    onChange={(event) =>
                      updateField(
                        "size",
                        event.target.value
                      )
                    }
                    placeholder="e.g. Medium"
                    disabled={saving}
                    className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-neutral-600">
                    Color
                  </label>

                  <input
                    type="text"
                    value={form.color}
                    onChange={(event) =>
                      updateField(
                        "color",
                        event.target.value
                      )
                    }
                    placeholder="e.g. Black"
                    disabled={saving}
                    className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-neutral-600">
                    Condition
                  </label>

                  <input
                    type="text"
                    value={
                      form.condition
                    }
                    onChange={(event) =>
                      updateField(
                        "condition",
                        event.target.value
                      )
                    }
                    placeholder="e.g. 9/10 — Good condition"
                    disabled={saving}
                    className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-neutral-600">
                    Status
                  </label>

                  <select
                    value={
                      form.status
                    }
                    onChange={(event) =>
                      updateField(
                        "status",
                        event.target.value as
                          | "available"
                          | "sold"
                      )
                    }
                    disabled={saving}
                    className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
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

            {/* 04 Measurements */}
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold tracking-[0.16em] text-neutral-400">
                    04
                  </span>

                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">
                    Measurements
                  </h2>
                </div>

                <p className="mt-2 text-xs text-neutral-400">
                  Add measurements when
                  available. These will appear
                  in the customer preview.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-xs font-medium text-neutral-600">
                    Length
                  </label>

                  <input
                    type="text"
                    value={
                      form.length
                    }
                    onChange={(event) =>
                      updateField(
                        "length",
                        event.target.value
                      )
                    }
                    placeholder="e.g. 27 in"
                    disabled={saving}
                    className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-neutral-600">
                    Width
                  </label>

                  <input
                    type="text"
                    value={
                      form.width
                    }
                    onChange={(event) =>
                      updateField(
                        "width",
                        event.target.value
                      )
                    }
                    placeholder="e.g. 19 in"
                    disabled={saving}
                    className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-neutral-600">
                    Waist
                  </label>

                  <input
                    type="text"
                    value={
                      form.waist
                    }
                    onChange={(event) =>
                      updateField(
                        "waist",
                        event.target.value
                      )
                    }
                    placeholder="e.g. 30 in"
                    disabled={saving}
                    className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>
            </section>

            {/* 05 Description */}
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold tracking-[0.16em] text-neutral-400">
                    05
                  </span>

                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">
                    Description
                  </h2>
                </div>

                <p className="mt-2 text-xs text-neutral-400">
                  Add any additional details
                  customers should know about
                  the item.
                </p>
              </div>

              <textarea
                value={
                  form.description
                }
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value
                  )
                }
                placeholder="Describe the item, condition details, flaws, fit, or anything else customers should know."
                rows={7}
                disabled={saving}
                className="w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
              />
            </section>

            {/* 06 Product Photos */}
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold tracking-[0.16em] text-neutral-400">
                    06
                  </span>

                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">
                    Product Photos
                  </h2>
                </div>

                <p className="mt-2 text-xs text-neutral-400">
                  Manage your listing photos.
                  The first photo is used as
                  the main product image.
                </p>
              </div>

              {images.length === 0 ? (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center transition hover:border-neutral-500 hover:bg-neutral-100">
                  <span className="text-sm font-medium">
                    Add product photos
                  </span>

                  <span className="mt-1 text-xs text-neutral-400">
                    JPG, PNG, WEBP, HEIC, or
                    HEIF
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={
                      handleAddImages
                    }
                    disabled={
                      uploading ||
                      saving
                    }
                    className="hidden"
                  />
                </label>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {images.map(
                      (
                        image,
                        index
                      ) => (
                        <div
                          key={
                            image.id
                          }
                          className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100"
                        >
                          <NextImage
                            src={
                              image.image_url
                            }
                            alt={`${form.name} photo ${
                              index + 1
                            }`}
                            fill
                            unoptimized
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
                            className="object-cover"
                          />

                          {index ===
                            0 && (
                            <div className="absolute left-2 top-2 rounded-md bg-black px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white">
                              Main
                            </div>
                          )}

                          <div className="absolute inset-x-2 bottom-2 flex gap-2 opacity-0 transition group-hover:opacity-100">
                            {index !==
                              0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleSetMain(
                                    image
                                  )
                                }
                                disabled={
                                  uploading ||
                                  saving
                                }
                                className="flex-1 rounded-lg bg-white px-2 py-2 text-[10px] font-medium shadow-sm transition hover:bg-neutral-100 disabled:opacity-50"
                              >
                                Set Main
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteImage(
                                  image
                                )
                              }
                              disabled={
                                uploading ||
                                saving
                              }
                              className="rounded-lg bg-black px-3 py-2 text-[10px] font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <label className="flex h-11 cursor-pointer items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-xs font-medium transition hover:border-black hover:bg-neutral-50">
                      Add more
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={
                          handleAddImages
                        }
                        disabled={
                          uploading ||
                          saving
                        }
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={async () => {
                        const confirmed =
                          window.confirm(
                            "Remove all product photos? This cannot be undone."
                          );

                        if (
                          !confirmed
                        ) {
                          return;
                        }

                        setError("");
                        setSuccess("");

                        try {
                          const paths =
                            images
                              .map(
                                (
                                  image
                                ) =>
                                  getStoragePathFromUrl(
                                    image.image_url
                                  )
                              )
                              .filter(
                                (
                                  path
                                ): path is string =>
                                  Boolean(
                                    path
                                  )
                              );

                          if (
                            paths.length >
                            0
                          ) {
                            await supabase.storage
                              .from(
                                "product-images"
                              )
                              .remove(
                                paths
                              );
                          }

                          const {
                            error:
                              deleteError,
                          } =
                            await supabase
                              .from(
                                "product_images"
                              )
                              .delete()
                              .eq(
                                "product_id",
                                productId
                              );

                          if (
                            deleteError
                          ) {
                            throw deleteError;
                          }

                          const {
                            error:
                              productError,
                          } =
                            await supabase
                              .from(
                                "products"
                              )
                              .update({
                                image:
                                  null,
                              })
                              .eq(
                                "id",
                                productId
                              );

                          if (
                            productError
                          ) {
                            throw productError;
                          }

                          setImages(
                            []
                          );

                          setSuccess(
                            "All photos removed."
                          );
                        } catch (err) {
                          console.error(
                            "Error clearing photos:",
                            err
                          );

                          setError(
                            err instanceof
                              Error
                              ? err.message
                              : "Could not remove photos."
                          );
                        }
                      }}
                      disabled={
                        uploading ||
                        saving
                      }
                      className="h-11 rounded-xl border border-neutral-200 bg-white px-4 text-xs font-medium text-neutral-600 transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Clear all
                    </button>
                  </div>
                </>
              )}
            </section>

            {/* Mobile Actions */}
            <div className="flex flex-col gap-3 sm:flex-row lg:hidden">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/admin/products"
                  )
                }
                disabled={
                  saving ||
                  uploading
                }
                className="h-12 rounded-xl border border-neutral-200 bg-white px-5 text-sm font-medium transition hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  saving ||
                  uploading
                }
                className="h-12 flex-1 rounded-xl bg-black px-5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>

            {/* Danger Zone */}
            <section className="rounded-2xl border border-red-200 bg-white p-5 sm:p-6">
              <div className="mb-5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold tracking-[0.16em] text-red-400">
                    07
                  </span>

                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-red-600">
                    Danger Zone
                  </h2>
                </div>

                <p className="mt-2 text-xs text-neutral-400">
                  Permanently delete this
                  product and its uploaded
                  photos.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleDeleteProduct
                }
                disabled={
                  saving ||
                  uploading
                }
                className="h-11 rounded-xl border border-red-200 px-4 text-xs font-medium text-red-600 transition hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete Product
              </button>
            </section>
          </div>

          {/* RIGHT PREVIEW */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">

              {/* Preview Header */}
              <div className="border-b border-neutral-200 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                      Customer View
                    </p>

                    <h2 className="mt-1 text-sm font-semibold">
                      Listing Preview
                    </h2>
                  </div>

                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-green-700">
                    Live
                  </span>
                </div>
              </div>

              {/* Main Image */}
              <div className="p-4">
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-neutral-100">
                  {previewImage ? (
                    <NextImage
                      src={
                        previewImage
                      }
                      alt={
                        form.name ||
                        "Product preview"
                      }
                      fill
                      unoptimized
                      sizes="(max-width: 1024px) 100vw, 460px"
                      className={`object-cover transition ${
                        isSold
                          ? "opacity-60"
                          : ""
                      }`}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-xs text-neutral-400">
                        No product photo
                      </p>
                    </div>
                  )}

                  {isSold && (
                    <>
                      <div className="absolute inset-0 bg-white/20" />

                      <div className="absolute left-4 top-4 bg-black px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white">
                        Sold
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length >
                  1 && (
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {images
                      .slice(
                        0,
                        5
                      )
                      .map(
                        (
                          image,
                          index
                        ) => (
                          <div
                            key={
                              image.id
                            }
                            className={`relative aspect-square overflow-hidden rounded-lg bg-neutral-100 ${
                              index ===
                              0
                                ? "ring-1 ring-black"
                                : ""
                            }`}
                          >
                            <NextImage
                              src={
                                image.image_url
                              }
                              alt={`${form.name} thumbnail ${
                                index +
                                1
                              }`}
                              fill
                              unoptimized
                              sizes="80px"
                              className="object-cover"
                            />
                          </div>
                        )
                      )}
                  </div>
                )}

                {/* Product Info */}
                <div className="pt-5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">
                    {form.category ||
                      "Category"}
                  </p>

                  <p className="mt-2 text-xs uppercase tracking-[0.12em] text-neutral-400">
                    {form.brand ||
                      "Brand"}
                  </p>

                  <h3 className="mt-1 text-lg font-medium leading-tight">
                    {form.name ||
                      "Product Name"}
                  </h3>

                  <div className="mt-3 flex items-center gap-2">
                    <p
                      className={`text-base font-semibold ${
                        isSold
                          ? "text-neutral-400"
                          : "text-black"
                      }`}
                    >
                      ₱
                      {form.price
                        ? Number(
                            form.price
                          ).toLocaleString()
                        : "0"}
                    </p>

                    {form.originalPrice && (
                      <p className="text-xs text-neutral-400 line-through">
                        ₱
                        {Number(
                          form.originalPrice
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {form.size && (
                      <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-[10px] text-neutral-600">
                        Size{" "}
                        {form.size}
                      </span>
                    )}

                    {form.color && (
                      <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-[10px] text-neutral-600">
                        {
                          form.color
                        }
                      </span>
                    )}

                    {form.condition && (
                      <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-[10px] text-neutral-600">
                        {
                          form.condition
                        }
                      </span>
                    )}
                  </div>

                  {(form.length ||
                    form.width ||
                    form.waist) && (
                    <div className="mt-5 border-t border-neutral-200 pt-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                        Measurements
                      </p>

                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {form.length && (
                          <div>
                            <p className="text-[9px] uppercase tracking-wide text-neutral-400">
                              Length
                            </p>

                            <p className="mt-0.5 text-xs">
                              {
                                form.length
                              }
                            </p>
                          </div>
                        )}

                        {form.width && (
                          <div>
                            <p className="text-[9px] uppercase tracking-wide text-neutral-400">
                              Width
                            </p>

                            <p className="mt-0.5 text-xs">
                              {
                                form.width
                              }
                            </p>
                          </div>
                        )}

                        {form.waist && (
                          <div>
                            <p className="text-[9px] uppercase tracking-wide text-neutral-400">
                              Waist
                            </p>

                            <p className="mt-0.5 text-xs">
                              {
                                form.waist
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {form.description && (
                    <div className="mt-5 border-t border-neutral-200 pt-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                        Description
                      </p>

                      <p className="mt-2 whitespace-pre-line text-xs leading-5 text-neutral-600">
                        {
                          form.description
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/admin/products"
                    )
                  }
                  disabled={
                    saving ||
                    uploading
                  }
                  className="h-12 flex-1 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium transition hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    uploading
                  }
                  className="h-12 flex-1 rounded-xl bg-black px-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </div>

            <div className="mt-3 px-1">
              <p className="text-[10px] leading-4 text-neutral-400">
                This preview updates
                automatically as you edit the
                listing.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}