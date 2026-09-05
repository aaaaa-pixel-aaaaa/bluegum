import { LeafGlyph } from './LeafGlyph'

export function LoadingBranch({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5" aria-hidden="true">
        {[0, 180, 360].map((delay) => (
          <LeafGlyph
            key={delay}
            variant="solid"
            color="var(--color-sickle)"
            size={12}
            className="leaf-pulse-dot"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
      <p className="font-serif text-md text-heartwood">{label}</p>
    </div>
  )
}
