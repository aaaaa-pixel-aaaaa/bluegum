import type { Profile } from '../../../shared/types'
import { getDeviceId } from './deviceId'

const STORAGE_KEY = 'bluegum:profile'

export function createEmptyProfile(): Profile {
  return {
    deviceId: getDeviceId(),
    version: 1,
    seeds: [],
    calibration: { subtitlesOk: true, pacing: 'either', avoid: [] },
    ratings: [],
    saved: [],
    dismissed: [],
  }
}

export function loadLocalProfile(): Profile | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Profile
  } catch {
    return null
  }
}

export function saveLocalProfile(profile: Profile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

// A seed/rated/saved/dismissed title is "known" once — used to keep Claude's
// suggestions and the buffer free of things the viewer has already dealt
// with, without waiting on a round trip to the server to find out.
export function knownTmdbIds(profile: Profile): Set<number> {
  return new Set([
    ...profile.seeds.map((t) => t.tmdbId),
    ...profile.ratings.map((t) => t.tmdbId),
    ...profile.saved.map((t) => t.tmdbId),
    ...profile.dismissed,
  ])
}
