export default function Loading() {
  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 lg:px-10">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Image skeleton */}
        <div className="aspect-[3/4] animate-pulse bg-neutral-100" />

        {/* Product information skeleton */}
        <div className="flex flex-col justify-center">
          <div className="h-3 w-24 animate-pulse bg-neutral-200" />

          <div className="mt-4 h-8 w-3/4 animate-pulse bg-neutral-200" />

          <div className="mt-4 h-5 w-24 animate-pulse bg-neutral-200" />

          <div className="mt-8 space-y-3">
            <div className="h-3 w-full animate-pulse bg-neutral-100" />
            <div className="h-3 w-5/6 animate-pulse bg-neutral-100" />
            <div className="h-3 w-4/6 animate-pulse bg-neutral-100" />
          </div>
        </div>
      </div>
    </main>
  );
}