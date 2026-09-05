import type { Pick } from '../../../../shared/types'
import type { TmdbSearchResult } from '../tmdb'
import type { Candidate } from './types'

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function resultYear(result: TmdbSearchResult): number | null {
  const date = result.release_date || result.first_air_date
  if (!date) return null
  const year = Number(date.slice(0, 4))
  return Number.isFinite(year) ? year : null
}

function resultTitle(result: TmdbSearchResult): string {
  return result.title ?? result.name ?? ''
}

// A confident match is a normalized title match (exact, or one containing
// the other to tolerate subtitle differences) whose release year is within
// one of what Claude said. Anything looser risks grounding a hallucinated
// title onto the wrong film's poster, which is the one failure this whole
// step exists to prevent — so ties go to dropping the candidate, not
// guessing.
export function groundCandidate(
  candidate: Candidate,
  results: TmdbSearchResult[],
  mediaType: 'movie' | 'tv'
): Pick | null {
  const target = normalize(candidate.title)
  let best: { result: TmdbSearchResult; score: number } | null = null

  for (const result of results) {
    const year = resultYear(result)
    if (year === null || Math.abs(year - candidate.year) > 1) continue

    const title = normalize(resultTitle(result))
    let score = 0
    if (title === target) score = 2
    else if (title.includes(target) || target.includes(title)) score = 1
    else continue

    if (!best || score > best.score) best = { result, score }
  }

  if (!best) return null

  return {
    tmdbId: best.result.id,
    mediaType,
    title: resultTitle(best.result),
    year: resultYear(best.result) ?? candidate.year,
    posterPath: best.result.poster_path,
    reason: candidate.reason,
  }
}
