import { useState, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary'

type PillButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  icon?: ReactNode
}

type Ripple = { id: number; x: number; y: number; size: number }

let nextRippleId = 0

export function PillButton({ variant = 'secondary', icon, className = '', onClick, children, ...props }: PillButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([])

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 1.6
    setRipples((prev) => [
      ...prev,
      { id: nextRippleId++, x: event.clientX - rect.left - size / 2, y: event.clientY - rect.top - size / 2, size },
    ])
    onClick?.(event)
  }

  const base =
    'press relative inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 overflow-hidden rounded-full px-4 py-2 font-sans text-base leading-none disabled:opacity-40'
  const styles =
    variant === 'primary'
      ? 'bg-sickle text-paper active:bg-heartwood'
      : 'border border-bloom bg-transparent text-heartwood active:bg-bloom/60'

  return (
    <button type="button" className={`${base} ${styles} ${className}`} onClick={handleClick} {...props}>
      {icon}
      {children}
      {ripples.map((r) => (
        <span
          key={r.id}
          className={`ripple ${variant === 'primary' ? 'ripple-light' : ''}`}
          style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
          onAnimationEnd={() => setRipples((prev) => prev.filter((ripple) => ripple.id !== r.id))}
        />
      ))}
    </button>
  )
}
