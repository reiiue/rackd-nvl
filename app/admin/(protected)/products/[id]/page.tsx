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

async function optimizeImage(
  file: File
): Promise<File> {
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

      const convertedBlob =
        await heic2any({
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

  return new Promise(
    (resolve, reject) => {
      const image =
        new window.Image();

      const objectUrl =
        URL.createObjectURL(
          inputFile
        );

      image.onload = () => {
        try {
          const maxSize = 1600;

          let width =
            image.naturalWidth;
          let height =
            image.naturalHeight;

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
            document.createElement(
              "canvas"
            );

          canvas.width = width;
          canvas.height = height;

          const context =
            canvas.getContext(
              "2d"
            );

          if (!context) {
            URL.revokeObjectURL(
              objectUrl
            );

            reject(
              new Error(
                `Could not process image: ${file.name}`
              )
            );

            return;
          }

          context.imageSmoothingEnabled =
            true;

          context.imageSmoothingQuality =
            "high";

          context.drawImage(
            image,
            0,
            0,
            width,
            height
          );

          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(
                objectUrl
              );

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

              resolve(
                optimizedFile
              );
            },
            "image/webp",
            0.82
          );
        } catch (error) {
          URL.revokeObjectURL(
            objectUrl
          );

          reject(error);
        }
      };

      image.onerror = () => {
        URL.revokeObjectURL(
          objectUrl
        );

        reject(
          new Error(
            `Could not read image: ${file.name}.`
          )
        );
      };

      image.src = objectUrl;
    }
  );
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();

  const productId =
    params.id as string;

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

  const [images, setImages] =
    useState<ProductImage[]>(
      []
    );

  const [mainImage, setMainImage] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [imageLoading, setImageLoading] =
    useState(false);

  const [
    imageProcessingStatus,
    setImageProcessingStatus,
  ] = useState("");

  const [error, setError] =
    useState("");

  const [imageError, setImageError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [
    deleteConfirm,
    setDeleteConfirm,
  ] = useState(false);

  useEffect(() => {
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
          setError(
            "Product not found."
          );
          return;
        }

        const measurements =
          product.measurements ?? {};

        setForm({
          name: product.name ?? "",
          brand: product.brand ?? "",
          price:
            product.price !==
              null &&
            product.price !==
              undefined
              ? String(
                  product.price
                )
              : "",
          originalPrice:
            product.original_price !==
              null &&
            product.original_price !==
              undefined
              ? String(
                  product.original_price
                )
              : "",
          size:
            product.size ?? "",
          color:
            product.color ?? "",
          condition:
            product.condition ??
            "",
          category:
            product.category ??
            "",
          length:
            measurements.length ??
            "",
          width:
            measurements.width ??
            "",
          waist:
            measurements.waist ??
            "",
          description:
            product.description ??
            "",
          status:
            product.status ===
            "sold"
              ? "sold"
              : "available",
        });

        setMainImage(
          product.image ?? ""
        );

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
          .eq(
            "product_id",
            productId
          )
          .order("sort_order", {
            ascending: true,
          });

        if (imagesError) {
          throw imagesError;
        }

        setImages(
          productImages ?? []
        );
      } catch (err) {
        console.error(
          "Error loading product:",
          err
        );

        setError(
          "Unable to load this product."
        );
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  function handleChange(
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const measurements = {
        length:
          form.length.trim(),
        width:
          form.width.trim(),
        waist:
          form.waist.trim(),
      };

      const {
        error: updateError,
      } = await supabase
        .from("products")
        .update({
          name: form.name.trim(),
          brand: form.brand.trim(),
          price: Number(
            form.price
          ),
          original_price:
            form.originalPrice.trim()
              ? Number(
                  form.originalPrice
                )
              : null,
          size:
            form.size.trim(),
          color:
            form.color.trim(),
          condition:
            form.condition.trim(),
          category:
            form.category.trim(),
          measurements,
          description:
            form.description.trim() ||
            null,
          status:
            form.status,
        })
        .eq(
          "id",
          productId
        );

      if (updateError) {
        throw updateError;
      }

      setSuccess(
        "Product updated successfully."
      );
    } catch (err) {
      console.error(
        "Save product error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update the product."
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

    setImageError("");
    setSuccess("");
    setImageLoading(true);

    const uploadedStoragePaths: string[] =
      [];

    const insertedImageIds: number[] =
      [];

    try {
      setImageProcessingStatus(
        "Optimizing photos..."
      );

      const optimizedFiles: File[] =
        [];

      for (
        let index = 0;
        index < files.length;
        index++
      ) {
        setImageProcessingStatus(
          `Optimizing photo ${
            index + 1
          } of ${files.length}...`
        );

        const optimizedFile =
          await optimizeImage(
            files[index]
          );

        optimizedFiles.push(
          optimizedFile
        );
      }

      setImageProcessingStatus(
        "Uploading photos..."
      );

      const newImages: ProductImage[] =
        [];

      const startingSortOrder =
        images.length;

      for (
        let index = 0;
        index <
        optimizedFiles.length;
        index++
      ) {
        const optimizedFile =
          optimizedFiles[index];

        const uniqueFileName =
          `${crypto.randomUUID()}.webp`;

        const filePath =
          `${productId}/${uniqueFileName}`;

        const {
          error: uploadError,
        } = await supabase.storage
          .from(
            "product-images"
          )
          .upload(
            filePath,
            optimizedFile,
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

        uploadedStoragePaths.push(
          filePath
        );

        const {
          data: publicUrlData,
        } =
          supabase.storage
            .from(
              "product-images"
            )
            .getPublicUrl(
              filePath
            );

        const imageUrl =
          publicUrlData.publicUrl;

        const {
          data: insertedImage,
          error:
            insertImageError,
        } = await supabase
          .from("product_images")
          .insert({
            product_id:
              productId,
            image_url:
              imageUrl,
            sort_order:
              startingSortOrder +
              index,
          })
          .select(
            "id, image_url, sort_order"
          )
          .single();

        if (insertImageError) {
          throw insertImageError;
        }

        if (!insertedImage) {
          throw new Error(
            "Unable to save uploaded product image."
          );
        }

        insertedImageIds.push(
          insertedImage.id
        );

        newImages.push(
          insertedImage
        );
      }

      if (
        !mainImage &&
        newImages.length > 0
      ) {
        setImageProcessingStatus(
          "Saving product photos..."
        );

        const firstImage =
          newImages[0];

        const {
          error: mainImageError,
        } = await supabase
          .from("products")
          .update({
            image:
              firstImage.image_url,
          })
          .eq(
            "id",
            productId
          );

        if (mainImageError) {
          throw mainImageError;
        }

        setMainImage(
          firstImage.image_url
        );
      }

      setImages((current) => [
        ...current,
        ...newImages,
      ]);

      setSuccess(
        newImages.length === 1
          ? "Photo added successfully."
          : `${newImages.length} photos added successfully.`
      );

      setImageProcessingStatus(
        ""
      );
    } catch (err) {
      console.error(
        "Add images error:",
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
        uploadedStoragePaths.length >
        0
      ) {
        await supabase.storage
          .from(
            "product-images"
          )
          .remove(
            uploadedStoragePaths
          );
      }

      setImageError(
        err instanceof Error
          ? err.message
          : "Unable to add the selected photos."
      );

      setImageProcessingStatus(
        ""
      );
    } finally {
      setImageLoading(false);
      setImageProcessingStatus("");

      event.target.value = "";
    }
  }

  async function handleDeleteImage(
    image: ProductImage
  ) {
    if (imageLoading) {
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this product photo?"
      );

    if (!confirmed) {
      return;
    }

    setImageError("");
    setSuccess("");

    try {
      const imageUrl =
        image.image_url;

      const storagePrefix =
        "/storage/v1/object/public/product-images/";

      const prefixIndex =
        imageUrl.indexOf(
          storagePrefix
        );

      if (prefixIndex !== -1) {
        const filePath =
          decodeURIComponent(
            imageUrl.substring(
              prefixIndex +
                storagePrefix.length
            )
          );

        const {
          error:
            storageDeleteError,
        } = await supabase.storage
          .from(
            "product-images"
          )
          .remove([filePath]);

        if (storageDeleteError) {
          throw storageDeleteError;
        }
      }

      const {
        error: deleteError,
      } = await supabase
        .from("product_images")
        .delete()
        .eq(
          "id",
          image.id
        );

      if (deleteError) {
        throw deleteError;
      }

      const remainingImages =
        images.filter(
          (item) =>
            item.id !== image.id
        );

      setImages(
        remainingImages
      );

      if (
        image.image_url ===
        mainImage
      ) {
        const nextMainImage =
          remainingImages[0]
            ?.image_url ?? "";

        const {
          error: updateError,
        } = await supabase
          .from("products")
          .update({
            image:
              nextMainImage ||
              null,
          })
          .eq(
            "id",
            productId
          );

        if (updateError) {
          throw updateError;
        }

        setMainImage(
          nextMainImage
        );
      }

      setSuccess(
        "Photo deleted successfully."
      );
    } catch (err) {
      console.error(
        "Delete image error:",
        err
      );

      setImageError(
        err instanceof Error
          ? err.message
          : "Unable to delete the photo."
      );
    }
  }

  async function handleSetMainImage(
    image: ProductImage
  ) {
    if (
      image.image_url ===
      mainImage
    ) {
      return;
    }

    setImageError("");
    setSuccess("");

    try {
      const currentImages = [
        ...images,
      ];

      const reorderedImages =
        currentImages
          .filter(
            (item) =>
              item.id !==
              image.id
          )
          .sort(
            (a, b) =>
              a.sort_order -
              b.sort_order
          );

      const newOrder = [
        image,
        ...reorderedImages,
      ];

      for (
        let index = 0;
        index < newOrder.length;
        index++
      ) {
        const item =
          newOrder[index];

        const {
          error:
            reorderError,
        } = await supabase
          .from("product_images")
          .update({
            sort_order:
              index,
          })
          .eq(
            "id",
            item.id
          );

        if (reorderError) {
          throw reorderError;
        }
      }

      const {
        error: updateError,
      } = await supabase
        .from("products")
        .update({
          image:
            image.image_url,
        })
        .eq(
          "id",
          productId
        );

      if (updateError) {
        throw updateError;
      }

      setImages(
        newOrder.map(
          (
            item,
            index
          ) => ({
            ...item,
            sort_order:
              index,
          })
        )
      );

      setMainImage(
        image.image_url
      );

      setSuccess(
        "Main photo updated successfully."
      );
    } catch (err) {
      console.error(
        "Set main image error:",
        err
      );

      setImageError(
        err instanceof Error
          ? err.message
          : "Unable to set the main photo."
      );
    }
  }

  async function handleDeleteProduct() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const {
        data: storageFiles,
        error:
          storageListError,
      } = await supabase.storage
        .from(
          "product-images"
        )
        .list(productId);

      if (storageListError) {
        throw storageListError;
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
          error:
            storageDeleteError,
        } = await supabase.storage
          .from(
            "product-images"
          )
          .remove(paths);

        if (storageDeleteError) {
          throw storageDeleteError;
        }
      }

      const {
        error: deleteError,
      } = await supabase
        .from("products")
        .delete()
        .eq(
          "id",
          productId
        );

      if (deleteError) {
        throw deleteError;
      }

      router.push(
        "/admin/products"
      );

      router.refresh();
    } catch (err) {
      console.error(
        "Delete product error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete the product."
      );

      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8 lg:px-10">
          <div className="animate-pulse">
            <div className="h-4 w-24 rounded bg-neutral-200" />

            <div className="mt-6 h-10 w-64 rounded bg-neutral-200" />

            <div className="mt-3 h-4 w-96 max-w-full rounded bg-neutral-200" />

            <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_460px]">
              <div className="space-y-5">
                <div className="h-64 rounded-2xl bg-white" />
                <div className="h-52 rounded-2xl bg-white" />
                <div className="h-52 rounded-2xl bg-white" />
              </div>

              <div className="aspect-[4/5] rounded-2xl bg-white" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error && !form.name) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8 lg:px-10">
          <div className="rounded-2xl border border-red-200 bg-white p-8">
            <p className="text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/products"
                )
              }
              className="mt-6 text-sm font-medium underline underline-offset-4"
            >
              Back to products
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 md:py-10 lg:px-10">
        {/* Header */}
        <header className="mb-8">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/products"
              )
            }
            className="text-xs font-medium text-neutral-500 transition hover:text-black"
          >
            ← Back to Products
          </button>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  Admin
                </p>

                <span className="h-1 w-1 rounded-full bg-neutral-300" />

                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                  Edit Listing
                </p>
              </div>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                Edit Product
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                Update your product
                information, photos,
                pricing, and listing
                details.
              </p>
            </div>

            <div className="hidden rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-400 sm:block">
              {productId}
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSave}
          className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_460px]"
        >
          {/* LEFT */}
          <div className="space-y-5">
            {/* 01 Product Information */}
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-7">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-semibold text-neutral-500">
                  01
                </div>

                <div>
                  <h2 className="text-base font-semibold text-neutral-950">
                    Product Information
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Basic information
                    about this listing.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-xs font-medium text-neutral-700"
                  >
                    Product Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    value={
                      form.name
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="brand"
                      className="mb-2 block text-xs font-medium text-neutral-700"
                    >
                      Brand
                    </label>

                    <input
                      id="brand"
                      name="brand"
                      value={
                        form.brand
                      }
                      onChange={
                        handleChange
                      }
                      required
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="category"
                      className="mb-2 block text-xs font-medium text-neutral-700"
                    >
                      Category
                    </label>

                    <select
                      id="category"
                      name="category"
                      value={
                        form.category
                      }
                      onChange={
                        handleChange
                      }
                      required
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
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

                      <option value="Polo">
                        Polo
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

                      <option value="Jeans">
                        Jeans
                      </option>

                      <option value="Pants">
                        Pants
                      </option>

                      <option value="Shorts">
                        Shorts
                      </option>

                      <option value="Sportswear">
                        Sportswear
                      </option>

                      <option value="Other">
                        Other
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="price"
                      className="mb-2 block text-xs font-medium text-neutral-700"
                    >
                      Price
                    </label>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                        ₱
                      </span>

                      <input
                        id="price"
                        name="price"
                        type="number"
                        min="0"
                        step="1"
                        value={
                          form.price
                        }
                        onChange={
                          handleChange
                        }
                        required
                        className="h-12 w-full rounded-xl border border-neutral-200 bg-white py-3 pl-8 pr-4 text-sm text-neutral-950 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="originalPrice"
                      className="mb-2 block text-xs font-medium text-neutral-700"
                    >
                      Original Price
                    </label>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                        ₱
                      </span>

                      <input
                        id="originalPrice"
                        name="originalPrice"
                        type="number"
                        min="0"
                        step="1"
                        value={
                          form.originalPrice
                        }
                        onChange={
                          handleChange
                        }
                        className="h-12 w-full rounded-xl border border-neutral-200 bg-white py-3 pl-8 pr-4 text-sm text-neutral-950 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="status"
                      className="mb-2 block text-xs font-medium text-neutral-700"
                    >
                      Status
                    </label>

                    <select
                      id="status"
                      name="status"
                      value={
                        form.status
                      }
                      onChange={
                        handleChange
                      }
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
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
              </div>
            </section>

            {/* 02 Details */}
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-7">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-semibold text-neutral-500">
                  02
                </div>

                <div>
                  <h2 className="text-base font-semibold text-neutral-950">
                    Details
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Add the key details
                    customers need.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="size"
                      className="mb-2 block text-xs font-medium text-neutral-700"
                    >
                      Size
                    </label>

                    <input
                      id="size"
                      name="size"
                      value={
                        form.size
                      }
                      onChange={
                        handleChange
                      }
                      required
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="color"
                      className="mb-2 block text-xs font-medium text-neutral-700"
                    >
                      Color
                    </label>

                    <input
                      id="color"
                      name="color"
                      value={
                        form.color
                      }
                      onChange={
                        handleChange
                      }
                      required
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="condition"
                    className="mb-2 block text-xs font-medium text-neutral-700"
                  >
                    Condition
                  </label>

                  <input
                    id="condition"
                    name="condition"
                    value={
                      form.condition
                    }
                    onChange={
                      handleChange
                    }
                    required
                    placeholder="e.g. 9/10 — Good pre-loved condition"
                    className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                  />
                </div>
              </div>
            </section>

            {/* 03 Measurements */}
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-7">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-semibold text-neutral-500">
                  03
                </div>

                <div>
                  <h2 className="text-base font-semibold text-neutral-950">
                    Measurements
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Use inches for
                    consistency.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="length"
                    className="mb-2 block text-xs font-medium text-neutral-700"
                  >
                    Length
                  </label>

                  <div className="relative">
                    <input
                      id="length"
                      name="length"
                      value={
                        form.length
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="27"
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 pr-12 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                      in
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="width"
                    className="mb-2 block text-xs font-medium text-neutral-700"
                  >
                    Width
                  </label>

                  <div className="relative">
                    <input
                      id="width"
                      name="width"
                      value={
                        form.width
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="19"
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 pr-12 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                      in
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="waist"
                    className="mb-2 block text-xs font-medium text-neutral-700"
                  >
                    Waist
                  </label>

                  <div className="relative">
                    <input
                      id="waist"
                      name="waist"
                      value={
                        form.waist
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="27"
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 pr-12 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                      in
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* 04 Description */}
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-7">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-semibold text-neutral-500">
                  04
                </div>

                <div>
                  <h2 className="text-base font-semibold text-neutral-950">
                    Description
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Give customers
                    useful information
                    about the item.
                  </p>
                </div>
              </div>

              <textarea
                id="description"
                name="description"
                value={
                  form.description
                }
                onChange={
                  handleChange
                }
                rows={7}
                placeholder="Add product details, flaws, fit notes, or other information..."
                className="w-full resize-y rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
              />
            </section>

            {/* 05 Product Photos */}
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-7">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-semibold text-neutral-500">
                  05
                </div>

                <div>
                  <h2 className="text-base font-semibold text-neutral-950">
                    Product Photos
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Add clear photos of
                    the product. The
                    first photo is used
                    as the main listing
                    image.
                  </p>
                </div>
              </div>

              {imageError && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {imageError}
                </div>
              )}

              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {images.map(
                    (
                      image,
                      index
                    ) => {
                      const isMain =
                        image.image_url ===
                        mainImage;

                      return (
                        <div
                          key={
                            image.id
                          }
                          className="group relative"
                        >
                          <div
                            className={`relative aspect-[4/5] overflow-hidden rounded-xl bg-neutral-100 ${
                              isMain
                                ? "ring-2 ring-black ring-offset-2"
                                : ""
                            }`}
                          >
                            <NextImage
                              src={
                                image.image_url
                              }
                              alt={`${form.name} photo ${
                                index +
                                1
                              }`}
                              fill
                              unoptimized
                              className="object-cover transition duration-300 group-hover:scale-[1.02]"
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 220px"
                            />

                            {isMain && (
                              <div className="absolute left-2 top-2 rounded-full bg-black px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white">
                                Main
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteImage(
                                  image
                                )
                              }
                              disabled={
                                imageLoading
                              }
                              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-xs text-red-600 opacity-0 shadow-sm transition hover:bg-white group-hover:opacity-100 disabled:cursor-not-allowed"
                              aria-label="Delete photo"
                            >
                              ×
                            </button>

                            {!isMain && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleSetMainImage(
                                    image
                                  )
                                }
                                disabled={
                                  imageLoading
                                }
                                className="absolute inset-x-2 bottom-2 rounded-lg bg-white/95 px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-black opacity-0 shadow-sm transition hover:bg-white group-hover:opacity-100 disabled:cursor-not-allowed"
                              >
                                Set as Main
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              <label
                className={`mt-4 flex min-h-32 items-center justify-center rounded-xl border border-dashed px-6 py-8 text-center transition ${
                  imageLoading
                    ? "cursor-not-allowed border-neutral-200 bg-neutral-50"
                    : "cursor-pointer border-neutral-300 bg-neutral-50/50 hover:border-neutral-500 hover:bg-neutral-50"
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={
                    imageLoading
                  }
                  onChange={
                    handleAddImages
                  }
                  className="sr-only"
                />

                <div>
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-lg text-neutral-400">
                    +
                  </div>

                  <p className="mt-3 text-sm font-medium text-neutral-900">
                    {imageLoading
                      ? imageProcessingStatus ||
                        "Processing..."
                      : images.length >
                        0
                      ? "Add more photos"
                      : "Add product photos"}
                  </p>

                  {!imageLoading && (
                    <>
                      <p className="mt-1 text-xs text-neutral-500">
                        Select one or
                        multiple photos
                      </p>

                      <p className="mt-1 text-[10px] text-neutral-400">
                        JPG, PNG, HEIC,
                        and other
                        image formats
                        supported
                      </p>
                    </>
                  )}
                </div>
              </label>

              {imageLoading && (
                <div className="mt-4">
                  <div className="h-1 overflow-hidden rounded-full bg-neutral-100">
                    <div className="h-full w-1/2 animate-pulse rounded-full bg-black" />
                  </div>

                  <p className="mt-2 text-xs text-neutral-500">
                    {imageProcessingStatus ||
                      "Processing..."}
                  </p>
                </div>
              )}
            </section>

            {/* 06 Save */}
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-950">
                    Ready to save?
                  </p>

                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Your product
                    information will be
                    updated immediately.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    imageLoading
                  }
                  className="h-12 rounded-xl bg-black px-7 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </section>

            {/* Danger Zone */}
            <section className="rounded-2xl border border-red-200 bg-white p-5 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-[10px] font-semibold text-red-500">
                  !
                </div>

                <div>
                  <h2 className="text-base font-semibold text-neutral-950">
                    Delete Product
                  </h2>

                  <p className="mt-1 max-w-xl text-xs leading-5 text-neutral-500">
                    Permanently removes
                    this product and
                    all of its uploaded
                    photos. This action
                    cannot be undone.
                  </p>
                </div>
              </div>

              <div className="mt-5">
                {!deleteConfirm ? (
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteConfirm(
                        true
                      )
                    }
                    className="h-11 rounded-xl border border-red-200 px-5 text-xs font-semibold uppercase tracking-[0.1em] text-red-600 transition hover:bg-red-50"
                  >
                    Delete Product
                  </button>
                ) : (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-medium text-red-700">
                      Are you sure you
                      want to delete this
                      product?
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={
                          handleDeleteProduct
                        }
                        disabled={
                          deleting
                        }
                        className="h-11 rounded-xl bg-red-600 px-5 text-xs font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deleting
                          ? "Deleting..."
                          : "Yes, Delete"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteConfirm(
                            false
                          )
                        }
                        disabled={
                          deleting
                        }
                        className="h-11 rounded-xl border border-neutral-200 bg-white px-5 text-xs font-semibold uppercase tracking-[0.1em] text-neutral-900 transition hover:bg-neutral-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT — LISTING PREVIEW */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              {/* Preview Header */}
              <div className="border-b border-neutral-100 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                      Customer View
                    </p>

                    <h2 className="mt-1 text-sm font-semibold text-neutral-950">
                      Listing Preview
                    </h2>
                  </div>

                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-green-700">
                    Live
                  </span>
                </div>
              </div>

              {/* Main Preview Image */}
              <div className="p-4">
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-neutral-100">
                  {mainImage ? (
                    <NextImage
                      src={
                        mainImage
                      }
                      alt={
                        form.name ||
                        "Product preview"
                      }
                      fill
                      priority
                      unoptimized
                      className={`object-cover transition duration-500 ${
                        form.status ===
                        "sold"
                          ? "opacity-60"
                          : ""
                      }`}
                      sizes="460px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl text-neutral-300">
                          +
                        </div>

                        <p className="mt-3 text-xs text-neutral-400">
                          No product
                          image
                        </p>
                      </div>
                    </div>
                  )}

                  {form.status ===
                    "sold" && (
                    <div className="absolute left-3 top-3 rounded-full bg-black px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white">
                      Sold
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length >
                  0 && (
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {images
                      .slice(
                        0,
                        5
                      )
                      .map(
                        (
                          image
                        ) => (
                          <button
                            key={
                              image.id
                            }
                            type="button"
                            onClick={() =>
                              setMainImage(
                                image.image_url
                              )
                            }
                            className={`relative aspect-square overflow-hidden rounded-lg bg-neutral-100 transition ${
                              image.image_url ===
                              mainImage
                                ? "ring-2 ring-black ring-offset-1"
                                : "opacity-70 hover:opacity-100"
                            }`}
                          >
                            <NextImage
                              src={
                                image.image_url
                              }
                              alt=""
                              fill
                              unoptimized
                              className="object-cover"
                              sizes="80px"
                            />
                          </button>
                        )
                      )}
                  </div>
                )}
              </div>

              {/* Product Information */}
              <div className="border-t border-neutral-100 px-5 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                      {form.brand ||
                        "Brand"}
                    </p>

                    <h3 className="mt-1 text-base font-semibold leading-5 text-neutral-950">
                      {form.name ||
                        "Product Name"}
                    </h3>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-base font-semibold text-neutral-950">
                      ₱
                      {form.price
                        ? Number(
                            form.price
                          ).toLocaleString()
                        : "0"}
                    </p>

                    {form.originalPrice && (
                      <p className="mt-0.5 text-[10px] text-neutral-400 line-through">
                        ₱
                        {Number(
                          form.originalPrice
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {form.size && (
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.08em] text-neutral-600">
                      {form.size}
                    </span>
                  )}

                  {form.color && (
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.08em] text-neutral-600">
                      {form.color}
                    </span>
                  )}

                  {form.category && (
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.08em] text-neutral-600">
                      {form.category}
                    </span>
                  )}
                </div>

                {/* Condition */}
                {form.condition && (
                  <div className="mt-5 border-t border-neutral-100 pt-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                      Condition
                    </p>

                    <p className="mt-1 text-xs leading-5 text-neutral-600">
                      {
                        form.condition
                      }
                    </p>
                  </div>
                )}

                {/* Measurements */}
                {(form.length ||
                  form.width ||
                  form.waist) && (
                  <div className="mt-5 border-t border-neutral-100 pt-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                      Measurements
                    </p>

                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {form.length && (
                        <div className="rounded-lg bg-neutral-50 px-2.5 py-2">
                          <p className="text-[9px] text-neutral-400">
                            Length
                          </p>

                          <p className="mt-0.5 text-xs font-medium">
                            {
                              form.length
                            }{" "}
                            in
                          </p>
                        </div>
                      )}

                      {form.width && (
                        <div className="rounded-lg bg-neutral-50 px-2.5 py-2">
                          <p className="text-[9px] text-neutral-400">
                            Width
                          </p>

                          <p className="mt-0.5 text-xs font-medium">
                            {
                              form.width
                            }{" "}
                            in
                          </p>
                        </div>
                      )}

                      {form.waist && (
                        <div className="rounded-lg bg-neutral-50 px-2.5 py-2">
                          <p className="text-[9px] text-neutral-400">
                            Waist
                          </p>

                          <p className="mt-0.5 text-xs font-medium">
                            {
                              form.waist
                            }{" "}
                            in
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                {form.description && (
                  <div className="mt-5 border-t border-neutral-100 pt-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                      Description
                    </p>

                    <p className="mt-1 line-clamp-5 text-xs leading-5 text-neutral-600">
                      {
                        form.description
                      }
                    </p>
                  </div>
                )}

                {/* Desktop Action */}
                <button
                  type="button"
                  disabled={
                    form.status ===
                    "sold"
                  }
                  className="mt-5 hidden h-11 w-full rounded-xl bg-black text-xs font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 sm:block"
                >
                  {form.status ===
                  "sold"
                    ? "Sold Out"
                    : "Add to Cart"}
                </button>
              </div>
            </div>

            {/* Preview Save Button */}
            <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
              <button
                type="submit"
                disabled={
                  saving ||
                  imageLoading
                }
                className="h-12 w-full rounded-xl bg-black text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving Changes..."
                  : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/admin/products"
                  )
                }
                className="mt-2 h-11 w-full rounded-xl text-xs font-medium text-neutral-500 transition hover:bg-neutral-50 hover:text-black"
              >
                Cancel
              </button>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}