
export default function Loading() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 md:py-14 lg:px-10">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <div className="h-3 w-16 animate-pulse bg-neutral-100" />

            <div className="mt-3 h-10 w-40 animate-pulse bg-neutral-100 md:h-12 md:w-56" />
          </div>

          <div className="hidden h-4 w-20 animate-pulse bg-neutral-100 sm:block" />
        </div>

        {/* Filters */}
        <div className="mt-8 flex gap-2 overflow-hidden border-b border-neutral-200 pb-4">
          <div className="h-9 w-16 shrink-0 animate-pulse bg-neutral-100" />
          <div className="h-9 w-24 shrink-0 animate-pulse bg-neutral-100" />
          <div className="h-9 w-20 shrink-0 animate-pulse bg-neutral-100" />
          <div className="h-9 w-28 shrink-0 animate-pulse bg-neutral-100" />
          <div className="h-9 w-24 shrink-0 animate-pulse bg-neutral-100" />
        </div>

        {/* Product Grid */}
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index}>
              {/* Product Image */}
              <div className="aspect-[4/5] animate-pulse bg-neutral-100" />

              {/* Product Info */}
              <div className="pt-4">
                <div className="h-3 w-16 animate-pulse bg-neutral-100" />

                <div className="mt-2 h-4 w-4/5 animate-pulse bg-neutral-100" />

                <div className="mt-3 h-4 w-20 animate-pulse bg-neutral-100" />

                <div className="mt-2 h-3 w-12 animate-pulse bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

