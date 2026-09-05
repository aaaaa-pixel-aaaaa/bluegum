export function LoadingBranch({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5" aria-hidden="true">
        <span className="leaf-pulse-dot h-2 w-2 rounded-full bg-bloom" style={{ animationDelay: '0ms' }} />
        <span className="leaf-pulse-dot h-2 w-2 rounded-full bg-bloom" style={{ animationDelay: '180ms' }} />
        <span className="leaf-pulse-dot h-2 w-2 rounded-full bg-bloom" style={{ animationDelay: '360ms' }} />
      </div>
      <p className="font-serif text-md text-heartwood">{label}</p>
    </div>
  )
}
