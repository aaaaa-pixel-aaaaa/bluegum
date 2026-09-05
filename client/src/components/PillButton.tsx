import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary'

type PillButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
}

export function PillButton({ variant = 'secondary', className = '', ...props }: PillButtonProps) {
  const base =
    'press min-h-11 min-w-11 rounded-full px-4 py-2 font-sans text-base leading-none disabled:opacity-40'
  const styles =
    variant === 'primary'
      ? 'bg-sickle text-paper active:bg-heartwood'
      : 'border border-bloom bg-transparent text-heartwood active:bg-bloom/60'
  return <button type="button" className={`${base} ${styles} ${className}`} {...props} />
}
