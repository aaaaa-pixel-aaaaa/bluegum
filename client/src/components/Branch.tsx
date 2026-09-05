import type { ReactNode } from 'react'
import { LeafGlyph } from './LeafGlyph'

// The stem down the centre — a gentle curve rather than a ruler-straight
// line, shared by screening thumbnails and the picks list so both feel like
// the same place (BRIEF.md §6). preserveAspectRatio="none" lets one drawn
// curve stretch to whatever height the actual content ends up needing.
export function Branch({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-md px-6 py-12">
      <svg
        className="pointer-events-none absolute inset-y-0 left-1/2 h-full w-[60px] -translate-x-1/2"
        viewBox="0 0 60 800"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M30,0 C10,100 50,200 30,300 C12,380 48,460 30,560 C14,630 46,700 30,800"
          fill="none"
          stroke="var(--color-bloom)"
          strokeWidth="1.5"
        />
      </svg>
      <div className="relative flex flex-col gap-16">{children}</div>
    </div>
  )
}

type BranchItemProps = {
  align: 'left' | 'right'
  poster: ReactNode
  children: ReactNode
  /** Set on a genuine "new set of picks" load to play the staggered fade-in. */
  animateIndex?: number
  /** Plays an exit animation, then calls back once it's done. */
  exit?: 'fall' | 'settle'
}

export function BranchItem({ align, poster, children, animateIndex, exit }: BranchItemProps) {
  const posterHalf = (
    <div className={`flex w-1/2 ${align === 'left' ? 'justify-end pr-3' : 'justify-start pl-3'}`}>{poster}</div>
  )
  const textHalf = (
    <div className={`flex w-1/2 ${align === 'left' ? 'justify-start pl-3 text-left' : 'justify-end pr-3 text-right'}`}>
      <div>{children}</div>
    </div>
  )

  const style = animateIndex !== undefined ? { animationDelay: `${animateIndex * 110}ms` } : undefined
  const exitClass = exit === 'fall' ? 'exit-fall' : exit === 'settle' ? 'exit-settle' : ''

  return (
    <div
      className={`relative flex w-full items-start ${animateIndex !== undefined ? 'animate-branch-in' : ''} ${exitClass}`}
      style={style}
    >
      <LeafGlyph
        variant="hollow"
        color="var(--color-glaucous)"
        size={16}
        className="absolute left-1/2 top-1 -translate-x-1/2"
      />
      {align === 'left' ? (
        <>
          {posterHalf}
          {textHalf}
        </>
      ) : (
        <>
          {textHalf}
          {posterHalf}
        </>
      )}
    </div>
  )
}
