import type { ReactNode } from 'react'

// The 1px stem down the centre, shared by screening thumbnails and the
// picks list so both feel like the same place (BRIEF.md §6).
export function Branch({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-md px-6 py-12">
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-bloom" aria-hidden />
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
}

export function BranchItem({ align, poster, children, animateIndex }: BranchItemProps) {
  const posterHalf = (
    <div className={`flex w-1/2 ${align === 'left' ? 'justify-end pr-3' : 'justify-start pl-3'}`}>{poster}</div>
  )
  const textHalf = (
    <div className={`flex w-1/2 ${align === 'left' ? 'justify-start pl-3 text-left' : 'justify-end pr-3 text-right'}`}>
      <div>{children}</div>
    </div>
  )

  const style = animateIndex !== undefined ? { animationDelay: `${animateIndex * 110}ms` } : undefined

  return (
    <div className={`flex w-full items-start ${animateIndex !== undefined ? 'animate-branch-in' : ''}`} style={style}>
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
