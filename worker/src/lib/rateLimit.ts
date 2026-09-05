import type { Env } from '../env'
import { json } from './http'

const WINDOW_SECONDS = 3600

// Fixed-window counter in KV, keyed by whatever the caller passes (a
// deviceId or an IP). Read-then-write isn't atomic, so a handful of
// concurrent requests could slip past the limit — acceptable for a single
// user; this exists to blunt abuse, not to be exact. Returns a 429 Response
// if the caller is over budget, or null if the request may proceed.
export async function checkRateLimit(
  env: Env,
  key: string,
  limit: number
): Promise<Response | null> {
  const stored = await env.BLUEGUM_KV.get(key)
  const count = stored ? Number(stored) : 0

  if (count >= limit) {
    return json({ error: 'rate limit exceeded' }, 429)
  }

  await env.BLUEGUM_KV.put(key, String(count + 1), { expirationTtl: WINDOW_SECONDS })
  return null
}
