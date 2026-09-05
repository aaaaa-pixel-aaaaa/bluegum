import type { Env } from '../env'

export type TmdbSearchResult = {
  id: number
  title?: string // present on /search/movie results
  name?: string // present on /search/tv results
  release_date?: string // movie
  first_air_date?: string // tv
  poster_path: string | null
}

// Used server-side for grounding candidates from Claude — distinct from the
// client-facing GET /tmdb/* pass-through proxy in routes/tmdb.ts.
export async function searchTmdb(
  env: Env,
  mediaType: 'movie' | 'tv',
  query: string
): Promise<TmdbSearchResult[]> {
  const url = new URL(`https://api.themoviedb.org/3/search/${mediaType}`)
  url.searchParams.set('query', query)
  url.searchParams.set('include_adult', 'false')

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.TMDB_READ_TOKEN}`,
      accept: 'application/json',
    },
  })
  if (!response.ok) return []

  const data = (await response.json()) as { results?: TmdbSearchResult[] }
  return data.results ?? []
}
