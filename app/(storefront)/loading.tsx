export default function Loading() {
  return (
    <main className="bg-white text-black">
      {/* Hero Skeleton */}
      <section>
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">
          <div className="flex min-h-[400px] flex-col items-center justify-center py-8 text-center md:min-h-[460px] md:py-10">
            <div className="w-full max-w-5xl">
              {/* Eyebrow */}
              <div className="mx-auto h-3 w-48 animate-pulse rounded-full bg-neutral-200" />

              {/* Logo / Title */}
              <div className="mx-auto mt-6 h-[100px] w-[80%] max-w-4xl animate-pulse rounded-lg bg-neutral-100 sm:h-[120px] md:h-[150px]" />

              {/* Description */}
              <div className="mt-8 flex flex-col items-center gap-3">
                <div className="h-3 w-72 animate-pulse rounded-full bg-neutral-200" />
                <div className="h-3 w-60 animate-pulse rounded-full bg-neutral-200" />
              </div>

              {/* Buttons */}
              <div className="mt-6 flex justify-center gap-3">
                <div className="h-12 w-36 animate-pulse rounded bg-neutral-900/10" />
                <div className="hidden h-12 w-24 animate-pulse rounded bg-neutral-100 sm:block" />
              </div>
            </div>

            {/* Bottom Tagline */}
            <div className="mt-7 flex w-full max-w-5xl items-center justify-center border-t border-neutral-200 pt-3">
              <div className="h-2.5 w-44 animate-pulse rounded-full bg-neutral-200" />
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals Skeleton */}
      <section className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 md:py-10 lg:px-10">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <div className="h-2.5 w-14 animate-pulse rounded-full bg-neutral-200" />

            <div className="mt-3 h-10 w-52 animate-pulse rounded-md bg-neutral-100 md:h-12 md:w-64" />
          </div>

          <div className="hidden h-4 w-20 animate-pulse rounded-full bg-neutral-100 sm:block" />
        </div>

        {/* Product Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index}>
              <div className="aspect-[4/5] animate-pulse bg-neutral-100" />

              <div className="pt-4">
                <div className="h-2.5 w-16 animate-pulse rounded-full bg-neutral-200" />

                <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-neutral-100" />

                <div className="mt-3 h-4 w-20 animate-pulse rounded bg-neutral-100" />

                <div className="mt-2 h-3 w-12 animate-pulse rounded bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Skeleton */}
      <section className="border-y border-neutral-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-5 py-9 sm:px-8 md:py-11 lg:px-10">
          {/* Header */}
          <div className="mb-5">
            <div className="h-2.5 w-16 animate-pulse rounded-full bg-neutral-200" />

            <div className="mt-3 h-10 w-64 animate-pulse rounded-md bg-neutral-100 md:h-12 md:w-80" />
          </div>

          {/* Category Cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex min-h-[150px] flex-col justify-between border border-neutral-200 bg-white p-5 md:min-h-[180px] md:p-6"
              >
                <div className="h-2.5 w-16 animate-pulse rounded-full bg-neutral-200" />

                <div>
                  <div className="h-6 w-28 animate-pulse rounded bg-neutral-100 md:h-7 md:w-32" />

                  <div className="mt-2 h-3 w-24 animate-pulse rounded-full bg-neutral-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Statement Skeleton */}
      <section className="border-y border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 md:py-16 lg:px-10">
          <div className="grid gap-7 md:grid-cols-[1.3fr_1fr] md:items-end">
            {/* Heading */}
            <div>
              <div className="h-2.5 w-20 animate-pulse rounded-full bg-neutral-200" />

              <div className="mt-5 space-y-3">
                <div className="h-10 w-56 animate-pulse rounded bg-neutral-200 sm:h-12 sm:w-72 md:h-16 md:w-96" />

                <div className="h-10 w-64 animate-pulse rounded bg-neutral-200 sm:h-12 sm:w-80 md:h-16 md:w-[420px]" />

                <div className="h-10 w-44 animate-pulse rounded bg-neutral-100 sm:h-12 sm:w-56 md:h-16 md:w-72" />
              </div>
            </div>

            {/* Description */}
            <div className="max-w-md">
              <div className="space-y-3">
                <div className="h-3 w-full animate-pulse rounded-full bg-neutral-200" />
                <div className="h-3 w-[90%] animate-pulse rounded-full bg-neutral-200" />
                <div className="h-3 w-[75%] animate-pulse rounded-full bg-neutral-200" />
              </div>

              <div className="mt-6 h-4 w-40 animate-pulse rounded-full bg-neutral-200" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}