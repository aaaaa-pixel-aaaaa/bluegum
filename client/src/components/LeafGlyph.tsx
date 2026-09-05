import type { CSSProperties } from 'react'

// The same falcate leaf silhouette as the app icon (see
// client/scripts/generate-icons.mjs) — reused here as the shared visual
// vocabulary for actions, rating, and the branch itself.
const LEAF_PATH = 'M50,8 C82,30 82,74 50,92 C40,74 40,26 50,8 Z'

type LeafGlyphProps = {
  variant?: 'solid' | 'hollow' | 'falling'
  color?: string
  size?: number
  className?: string
  style?: CSSProperties
}

export function LeafGlyph({
  variant = 'solid',
  color = 'currentColor',
  size = 14,
  className = '',
  style,
}: LeafGlyphProps) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} style={style} aria-hidden="true">
      <path
        d={LEAF_PATH}
        transform={variant === 'falling' ? 'rotate(35 50 50)' : undefined}
        fill={variant === 'hollow' ? 'none' : color}
        stroke={variant === 'hollow' ? color : 'none'}
        strokeWidth={variant === 'hollow' ? 7 : 0}
      />
    </svg>
  )
}
