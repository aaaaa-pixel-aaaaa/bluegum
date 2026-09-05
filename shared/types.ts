// Shared between client/ and worker/ via plain relative imports — no build
// step, no workspace package. See BRIEF.md §4 for the data model this
// mirrors.

export type MediaType = 'movie' | 'tv'

export type Title = {
  tmdbId: number
  mediaType: MediaType
  title: string
  year: number
  posterPath: string | null
}

export type Rating = Title & {
  score: 1 | 2 | 3 | 4 | 5
  ratedAt: string
}

export type Pick = Title & {
  reason: string
}

export type Pacing = 'patient' | 'either' | 'brisk'

export type Calibration = {
  subtitlesOk: boolean
  pacing: Pacing
  avoid: string[]
}

export type LastPicks = {
  generatedAt: string
  shown: Pick[]
  buffer: Pick[]
}

export type Profile = {
  deviceId: string
  version: 1
  seeds: Title[]
  calibration: Calibration
  ratings: Rating[]
  saved: Title[]
  dismissed: number[]
  lastPicks?: LastPicks
}

// The tappable chip labels for the "anything he'd never watch" calibration
// screen — see BRIEF.md §7.
export const AVOID_OPTIONS = [
  'Horror',
  'Musicals',
  'Reality TV',
  'True crime',
  'Broad comedy',
  'Romance-forward',
  'Anime',
  'Slow / arthouse pacing',
  'High violence or gore',
  'Long prestige dramas',
] as const
