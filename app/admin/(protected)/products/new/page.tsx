"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

function createProductId(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const uniquePart = Date.now().toString(36);

  return `${slug}-${uniquePart}`;
}

/**
 * Resize and convert an image to WebP before uploading.
 *
 * Supports:
 * - JPG / JPEG
 * - PNG
 * - WEBP
 * - HEIC / HEIF
 *
 * Maximum dimension:
 * 1600px
 *
 * WebP quality:
 * 82%
 */
async function optimizeImage(file: File): Promise<File> {
  let inputFile = file;

  /*
   * HEIC / HEIF files cannot normally be decoded by the
   * browser's Image() API.
   *
   * Convert them to JPEG first using heic2any.
   */
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
    const image = new Image();

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
          document.createElement(
            "canvas"
          );

        canvas.width = width;
        canvas.height = height;

        const context =
          canvas.getContext("2d");

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
          `Could not read image: ${file.name}. Please use JPG, PNG, WEBP, HEIC, or HEIF.`
        )
      );
    };

    image.src = objectUrl;
  });
}

export default function NewProductPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] =
    useState("");

  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [condition, setCondition] =
    useState("");
  const [category, setCategory] =
    useState("");

  const [length, setLength] =
    useState("");
  const [width, setWidth] =
    useState("");
  const [waist, setWaist] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [images, setImages] = useState<
    File[]
  >([]);

  const [loading, setLoading] =
    useState(false);

  const [loadingMessage, setLoadingMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const imagePreviews = useMemo(() => {
    return images.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
  }, [images]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((image) => {
        URL.revokeObjectURL(image.url);
      });
    };
  }, [imagePreviews]);

  function handleImagesChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    if (!event.target.files) return;

    const newImages = Array.from(
      event.target.files
    );

    setImages((currentImages) => [
      ...currentImages,
      ...newImages,
    ]);

    event.target.value = "";
  }

  function removeImage(
    indexToRemove: number
  ) {
    setImages((currentImages) =>
      currentImages.filter(
        (_, index) =>
          index !== indexToRemove
      )
    );
  }

  function clearImages() {
    setImages([]);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);
    setLoadingMessage(
      "Optimizing photos..."
    );

    const productId =
      createProductId(name);

    const optimizedImages: File[] = [];
    const uploadedStoragePaths: string[] =
      [];

    try {
      /*
       * 1. Optimize all selected images
       *
       * JPG / PNG / WEBP:
       * → resize if necessary
       * → convert to WebP
       *
       * HEIC / HEIF:
       * → convert to JPEG
       * → resize if necessary
       * → convert to WebP
       */
      for (
        let index = 0;
        index < images.length;
        index++
      ) {
        const file = images[index];

        try {
          const optimizedFile =
            await optimizeImage(file);

          optimizedImages.push(
            optimizedFile
          );
        } catch (imageError) {
          throw new Error(
            imageError instanceof Error
              ? imageError.message
              : `Could not optimize ${file.name}`
          );
        }
      }

      /*
       * 2. Create the product
       */
      setLoadingMessage(
        "Creating product..."
      );

      const {
        error: productError,
      } = await supabase
        .from("products")
        .insert({
          id: productId,
          name,
          brand,
          price: Number(price),

          original_price:
            originalPrice
              ? Number(originalPrice)
              : null,

          size,
          color,
          condition,
          category,

          image: "",

          measurements: {
            ...(length && { length }),
            ...(width && { width }),
            ...(waist && { waist }),
          },

          description:
            description || null,

          status: "available",
        });

      if (productError) {
        console.error(
          "Product insert error:",
          productError
        );

        throw new Error(
          productError.message
        );
      }

      /*
       * 3. Upload optimized images
       *
       * UUID filenames prevent:
       *
       * "The resource already exists"
       *
       * errors when the same product/image
       * path is uploaded again.
       */
      setLoadingMessage(
        "Uploading photos..."
      );

      const uploadedImages: {
        image_url: string;
        sort_order: number;
      }[] = [];

      for (
        let index = 0;
        index < optimizedImages.length;
        index++
      ) {
        const file =
          optimizedImages[index];

        const uniqueFileName =
          `${crypto.randomUUID()}.webp`;

        const filePath =
          `${productId}/${uniqueFileName}`;

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
          console.error(
            "Image upload error:",
            uploadError
          );

          throw new Error(
            uploadError.message
          );
        }

        uploadedStoragePaths.push(
          filePath
        );

        const {
          data: {
            publicUrl,
          },
        } = supabase.storage
          .from("product-images")
          .getPublicUrl(
            filePath
          );

        uploadedImages.push({
          image_url: publicUrl,
          sort_order: index,
        });
      }

      /*
       * 4. Save image URLs
       */
      setLoadingMessage(
        "Saving product photos..."
      );

      if (
        uploadedImages.length > 0
      ) {
        const {
          error: imageInsertError,
        } = await supabase
          .from("product_images")
          .insert(
            uploadedImages.map(
              (image) => ({
                product_id:
                  productId,
                image_url:
                  image.image_url,
                sort_order:
                  image.sort_order,
              })
            )
          );

        if (imageInsertError) {
          console.error(
            "Product images insert error:",
            imageInsertError
          );

          throw new Error(
            imageInsertError.message
          );
        }

        /*
         * 5. Set first image as main image
         */
        const {
          error: updateError,
        } = await supabase
          .from("products")
          .update({
            image:
              uploadedImages[0]
                .image_url,
          })
          .eq(
            "id",
            productId
          );

        if (updateError) {
          console.error(
            "Main image update error:",
            updateError
          );

          throw new Error(
            updateError.message
          );
        }
      }

      /*
       * 6. Redirect with success notification
       */
      setLoadingMessage(
        "Product created successfully."
      );

      router.push(
        `/admin/products/${productId}?created=true`
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Create product error:",
        error
      );

      /*
       * CLEANUP
       *
       * If something fails after the
       * product was created, remove
       * uploaded images and the
       * incomplete product.
       */
      if (
        uploadedStoragePaths.length > 0
      ) {
        const {
          error:
            storageCleanupError,
        } = await supabase.storage
          .from("product-images")
          .remove(
            uploadedStoragePaths
          );

        if (storageCleanupError) {
          console.error(
            "Storage cleanup error:",
            storageCleanupError
          );
        }
      }

      const {
        error:
          productCleanupError,
      } = await supabase
        .from("products")
        .delete()
        .eq(
          "id",
          productId
        );

      if (productCleanupError) {
        console.error(
          "Product cleanup error:",
          productCleanupError
        );
      }

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while creating the product."
      );

      setLoading(false);
      setLoadingMessage("");
    }
  }

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

  const formattedPrice = price
    ? `₱${Number(
        price
      ).toLocaleString()}`
    : "₱0";

  const formattedOriginalPrice =
    originalPrice
      ? `₱${Number(
          originalPrice
        ).toLocaleString()}`
      : null;

  return (
    <main className="min-h-screen bg-neutral-50 text-black">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            <span>Products</span>
            <span>/</span>
            <span>New</span>
          </div>

          <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Add Product
              </h1>

              <p className="mt-2 text-sm text-neutral-500 sm:text-base">
                Create your listing and preview it before publishing.
              </p>
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

        {/* Loading status */}
        {loading && loadingMessage && (
          <div className="mb-6 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm">
            {loadingMessage}
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
                    Start with the essential product details.
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
                      disabled={loading}
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="Name of T-Shirt"
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
                      disabled={loading}
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="UNIQLO"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label
                      htmlFor="category"
                      className="mb-2 block text-sm font-medium"
                    >
                      Category
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <select
                      id="category"
                      required
                      value={category}
                      onChange={(event) =>
                        setCategory(event.target.value)
                      }
                      disabled={loading}
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition focus:border-black focus:bg-white focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
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
                        disabled={loading}
                        className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
                        placeholder="499"
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
                        disabled={loading}
                        className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
                        placeholder="790"
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
                    Add the item's size, color, and condition.
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
                      disabled={loading}
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="XL"
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
                      disabled={loading}
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="White"
                    />
                  </div>

                  {/* Condition */}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="condition"
                      className="mb-2 block text-sm font-medium"
                    >
                      Condition
                    </label>

                    <input
                      id="condition"
                      value={condition}
                      onChange={(event) =>
                        setCondition(
                          event.target.value
                        )
                      }
                      disabled={loading}
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="Good pre-loved condition"
                    />
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
                      disabled={loading}
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
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
                      disabled={loading}
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
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
                      disabled={loading}
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
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
                  disabled={loading}
                  rows={5}
                  className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="Additional information about the product..."
                />
              </section>

              {/* Photos */}
              <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                    06
                  </p>

                  <h2 className="mt-1 text-lg font-semibold">
                    Product Photos
                  </h2>

                  <p className="mt-1 text-sm text-neutral-500">
                    Photos are automatically resized and converted to WebP before uploading.
                  </p>
                </div>

                <input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  required={
                    images.length === 0
                  }
                  onChange={
                    handleImagesChange
                  }
                  className="sr-only"
                  disabled={loading}
                />

                {images.length === 0 && (
                  <label
                    htmlFor="images"
                    className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 px-5 py-9 text-center transition hover:border-neutral-400 hover:bg-neutral-100"
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

                    <span className="mt-4 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-xs font-medium group-hover:border-neutral-300">
                      Choose Files
                    </span>
                  </label>
                )}

                {images.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {images.length}{" "}
                        {images.length === 1
                          ? "photo"
                          : "photos"}{" "}
                        selected
                      </p>

                      <button
                        type="button"
                        onClick={
                          clearImages
                        }
                        disabled={loading}
                        className="text-xs font-medium text-neutral-500 underline underline-offset-4 hover:text-black disabled:opacity-50"
                      >
                        Clear all
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {imagePreviews.map(
                        (
                          image,
                          index
                        ) => (
                          <div
                            key={`${image.file.name}-${index}`}
                            className="group relative aspect-square overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100"
                          >
                            <img
                              src={image.url}
                              alt={
                                image.file.name
                              }
                              className="h-full w-full object-cover"
                            />

                            {index ===
                              0 && (
                              <div className="absolute left-2 top-2 rounded-md bg-black px-2 py-1 text-[9px] font-semibold text-white">
                                MAIN
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                removeImage(
                                  index
                                )
                              }
                              disabled={
                                loading
                              }
                              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/80 text-sm font-medium text-white opacity-100 transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={`Remove ${image.file.name}`}
                            >
                              ×
                            </button>
                          </div>
                        )
                      )}

                      {/* Add more */}
                      <label
                        htmlFor="images"
                        className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 text-neutral-400 transition hover:border-neutral-400 hover:bg-neutral-100 hover:text-black"
                      >
                        <span className="text-2xl font-light">
                          +
                        </span>

                        <span className="mt-1 text-[10px] font-medium">
                          Add more
                        </span>
                      </label>
                    </div>

                    <p className="mt-3 text-xs text-neutral-400">
                      Select more photos anytime. Photos will be optimized automatically when you publish.
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
                    disabled={loading}
                    className="h-12 w-full rounded-xl px-5 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-black disabled:opacity-50 sm:w-auto"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="h-12 w-full rounded-xl bg-black px-7 text-sm font-semibold !text-white transition hover:bg-neutral-800 hover:!text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {loading
                      ? loadingMessage ||
                        "Saving..."
                      : "Add Product"}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* RIGHT — LIVE PREVIEW */}
          <aside className="lg:sticky lg:top-6">
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

            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">

              {/* Main Image */}
              <div className="relative aspect-[4/5] bg-neutral-100">
                {imagePreviews.length >
                0 ? (
                  <img
                    src={
                      imagePreviews[0]
                        .url
                    }
                    alt={displayName}
                    className="h-full w-full object-cover"
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
                      Your first uploaded photo will appear here
                    </p>
                  </div>
                )}

                <div className="absolute left-4 top-4 rounded-full bg-black px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider !text-white">
                  Available
                </div>
              </div>

              {/* Thumbnail Images */}
              {imagePreviews.length >
                1 && (
                <div className="flex gap-2 overflow-x-auto border-b border-neutral-100 p-3">
                  {imagePreviews.map(
                    (
                      image,
                      index
                    ) => (
                      <div
                        key={`${image.file.name}-thumb-${index}`}
                        className={`h-16 w-16 flex-none overflow-hidden rounded-lg border ${
                          index === 0
                            ? "border-black"
                            : "border-neutral-200"
                        }`}
                      >
                        <img
                          src={image.url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Product Information */}
              <div className="p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  {displayCategory}
                </p>

                <h3 className="mt-2 text-xl font-semibold leading-tight tracking-tight">
                  {displayName}
                </h3>

                <p className="mt-1 text-sm text-neutral-500">
                  {displayBrand}
                </p>

                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold tracking-tight">
                    {formattedPrice}
                  </span>

                  {formattedOriginalPrice && (
                    <span className="text-sm text-neutral-400 line-through">
                      {
                        formattedOriginalPrice
                      }
                    </span>
                  )}
                </div>

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

                <div className="mt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                    Condition
                  </p>

                  <p className="mt-1 text-sm text-neutral-600">
                    {displayCondition}
                  </p>
                </div>

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
                          Length{" "}
                          {length}
                        </span>
                      )}

                      {width && (
                        <span className="rounded-lg bg-neutral-100 px-3 py-2 text-xs font-medium">
                          Width{" "}
                          {width}
                        </span>
                      )}

                      {waist && (
                        <span className="rounded-lg bg-neutral-100 px-3 py-2 text-xs font-medium">
                          Waist{" "}
                          {waist}
                        </span>
                      )}
                    </div>
                  </div>
                )}

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

                <p className="mt-3 text-center text-[10px] text-neutral-400">
                  This is a preview of how your listing will appear.
                </p>
              </div>
            </div>

            {/* Preview Note */}
            <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
              <p className="text-xs font-medium">
                Live preview
              </p>

              <p className="mt-1 text-xs leading-5 text-neutral-500">
                Changes you make on the left will automatically appear here before you publish the product.
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
                  disabled={loading}
                  className="h-12 flex-1 rounded-xl px-5 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-black disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    const form =
                      document.querySelector(
                        "form"
                      ) as HTMLFormElement | null;

                    form?.requestSubmit();
                  }}
                  className="h-12 flex-[1.5] rounded-xl bg-black px-6 text-sm font-semibold !text-white transition hover:bg-neutral-800 hover:!text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? loadingMessage ||
                      "Saving..."
                    : "Add Product"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}