export default function ProductCardSkeleton() {
  return (
    <div className="flex flex-col h-full glass-card rounded-[2rem] p-4 border border-white/50 shadow-glass animate-pulse">
      <div className="relative aspect-[3/4] bg-brand-blush/40 rounded-[1.5rem] mb-4 overflow-hidden">
        <div className="absolute inset-0 crystal-shimmer opacity-60" />
      </div>
      <div className="flex flex-col flex-grow space-y-3 px-1">
        <div className="space-y-2">
          <div className="h-4 bg-brand-blush/60 rounded-lg w-3/4" />
          <div className="h-4 bg-brand-blush/40 rounded-lg w-1/2" />
        </div>
        <div className="flex gap-2">
          <div className="w-5 h-5 rounded-full bg-brand-blush/50" />
          <div className="w-5 h-5 rounded-full bg-brand-blush/50" />
          <div className="w-5 h-5 rounded-full bg-brand-blush/50" />
        </div>
        <div className="flex items-baseline gap-2">
          <div className="h-5 bg-brand-blush/60 rounded-lg w-20" />
          <div className="h-4 bg-brand-blush/40 rounded-lg w-12" />
        </div>
        <div className="mt-auto pt-2 lg:hidden">
          <div className="h-10 bg-brand-blush/50 rounded-xl w-full" />
        </div>
      </div>
    </div>
  );
}
