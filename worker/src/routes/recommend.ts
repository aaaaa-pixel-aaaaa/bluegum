import type { Pick, Profile } from '../../../shared/types'
import type { Env } from '../env'
import { requestPicks } from '../lib/anthropic'
import { json } from '../lib/http'
import { groundCandidate } from '../lib/recommend/ground'
import { parseCandidates } from '../lib/recommend/parse'
import { searchTmdb } from '../lib/tmdb'

function excludedIds(profile: Profile): Set<number> {
  // `dismissed` only stores tmdb ids (see BRIEF.md §4), so it can't be named
  // in the prompt text the way seeds/ratings/saved can — this is where it's
  // actually enforced instead, alongside a defense-in-depth pass over
  // everything else we already know the id for.
  return new Set([
    ...profile.dismissed,
    ...profile.seeds.map((t) => t.tmdbId),
    ...profile.ratings.map((t) => t.tmdbId),
    ...profile.saved.map((t) => t.tmdbId),
  ])
}

export async function handleRecommend(request: Request, env: Env): Promise<Response> {
  let profile: Profile
  try {
    profile = await request.json()
  } catch {
    return json({ error: 'invalid JSON body' }, 400)
  }

  let candidates = null
  try {
    candidates = parseCandidates(await requestPicks(env, profile))
    if (!candidates) {
      candidates = parseCandidates(await requestPicks(env, profile))
    }
  } catch (err) {
    console.error(err)
    return json({ error: 'recommendation service unavailable' }, 502)
  }

  if (!candidates) {
    return json({ error: 'could not generate picks' }, 502)
  }

  const excluded = excludedIds(profile)

  // The 12 TMDB lookups are independent — run them concurrently rather than
  // one at a time, which was the difference between a ~17s and a ~3s reply.
  const grounded = await Promise.all(
    candidates.map(async (candidate) => {
      const results = await searchTmdb(env, candidate.mediaType, candidate.title)
      return groundCandidate(candidate, results, candidate.mediaType)
    })
  )

  const seenIds = new Set<number>()
  const picks: Pick[] = []
  for (const pick of grounded) {
    if (!pick) continue
    if (excluded.has(pick.tmdbId) || seenIds.has(pick.tmdbId)) continue
    seenIds.add(pick.tmdbId)
    picks.push(pick)
  }

  return json({ picks })
}
