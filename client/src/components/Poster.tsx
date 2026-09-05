import { posterUrl } from '../lib/tmdb'

type PosterProps = {
  posterPath: string | null
  title: string
  width?: number
}

// Native rectangular corners, no shadow, no card — the poster sits directly
// on the paper (BRIEF.md §6).
export function Poster({ posterPath, title, width = 120 }: PosterProps) {
  const src = posterUrl(posterPath)
  if (!src) {
    return (
      <div
        className="flex items-center justify-center bg-bloom p-2 text-center font-sans text-sm text-heartwood/70"
        style={{ width, aspectRatio: '2 / 3' }}
      >
        {title}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt=""
      width={width}
      style={{ width, aspectRatio: '2 / 3', objectFit: 'cover' }}
      className="block"
    />
  )
}
