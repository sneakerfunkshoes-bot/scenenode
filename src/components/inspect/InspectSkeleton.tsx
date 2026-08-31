export function InspectSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl animate-pulse space-y-5 px-4 pb-8 pt-6 sm:px-6">
      <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-[#121212] p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-zinc-700" />
          <div className="space-y-2">
            <div className="h-4 w-48 rounded bg-zinc-800" />
            <div className="h-3 w-28 rounded bg-zinc-800/80" />
          </div>
        </div>
        <div className="h-7 w-32 rounded-lg bg-zinc-800" />
      </div>

      <div className="space-y-2 rounded-2xl border border-zinc-800 bg-[#121212] p-4">
        <div className="flex justify-between">
          <div className="h-4 w-52 rounded bg-zinc-800" />
          <div className="h-3 w-36 rounded bg-zinc-800/80" />
        </div>
        <div className="h-[120px] rounded-xl border border-zinc-800 bg-[#0c0c0c] sm:h-[140px]" />
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 space-y-2.5 lg:col-span-5">
          <div className="h-4 w-40 rounded bg-zinc-800" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[58px] rounded-xl border border-zinc-800 bg-[#121212]"
            />
          ))}
        </div>
        <div className="col-span-12 space-y-3 rounded-2xl border border-zinc-800 bg-[#121212] p-5 lg:col-span-7">
          <div className="h-10 rounded bg-zinc-800/80" />
          <div className="h-20 rounded-xl bg-zinc-800" />
          <div className="h-14 rounded-xl bg-zinc-800/60" />
          <div className="h-32 rounded-xl bg-zinc-800/40" />
        </div>
      </div>

      <p className="text-center text-xs font-medium text-zinc-300/80">
        Analyzing edit — extracting beats, overlays, and recreation steps…
      </p>
    </div>
  );
}
