import type { MediaType, Title } from '../../../shared/types'
import { WORKER_URL, workerHeaders } from './api'

type TmdbMultiResult = {
  id: number
  media_type: 'movie' | 'tv' | 'person'
  title?: string
  name?: string
  release_date?: string
  first_air_date?: string
  poster_path: string | null
}

export function posterUrl(posterPath: string | null, size: 'w185' | 'w342' = 'w342'): string | null {
  return posterPath ? `https://image.tmdb.org/t/p/${size}${posterPath}` : null
}

export async function searchTitles(query: string, signal?: AbortSignal): Promise<Title[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const url = new URL(`${WORKER_URL}/tmdb/search/multi`)
  url.searchParams.set('query', trimmed)
  url.searchParams.set('include_adult', 'false')

  const response = await fetch(url, { headers: workerHeaders(), signal })
  if (!response.ok) return []

  const data = (await response.json()) as { results?: TmdbMultiResult[] }
  return (data.results ?? [])
    .filter((r): r is TmdbMultiResult & { media_type: MediaType } => r.media_type === 'movie' || r.media_type === 'tv')
    .map((r) => {
      const dateStr = r.release_date || r.first_air_date || ''
      return {
        tmdbId: r.id,
        mediaType: r.media_type,
        title: r.title ?? r.name ?? '',
        year: dateStr ? Number(dateStr.slice(0, 4)) : 0,
        posterPath: r.poster_path,
      }
    })
}
