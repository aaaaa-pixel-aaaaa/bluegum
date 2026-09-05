import type { Candidate } from './types'

// Claude is asked for strict JSON with no fences, but models don't always
// listen — strip a ```json ... ``` wrapper if one shows up before parsing.
export function stripFences(raw: string): string {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
  return fenced ? fenced[1].trim() : trimmed
}

function isCandidate(value: unknown): value is Candidate {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.title === 'string' &&
    v.title.length > 0 &&
    typeof v.year === 'number' &&
    (v.mediaType === 'movie' || v.mediaType === 'tv') &&
    typeof v.reason === 'string' &&
    v.reason.length > 0
  )
}

// Parses Claude's response into candidates, dropping any entry that doesn't
// match the expected shape rather than failing the whole batch over one bad
// entry. Returns null (signalling a retry) only if parsing fails outright or
// nothing usable survives.
export function parseCandidates(raw: string): Candidate[] | null {
  let data: unknown
  try {
    data = JSON.parse(stripFences(raw))
  } catch {
    return null
  }

  if (!Array.isArray(data)) return null

  const candidates = data.filter(isCandidate)
  return candidates.length > 0 ? candidates : null
}
