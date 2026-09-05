import type { Env } from '../env'
import { json } from '../lib/http'

// POST /recommend — stubbed for Phase B. The auth check, both rate limits,
// and CORS are already live around this handler; the actual Claude call and
// TMDB grounding land in Phase C.
export async function handleRecommend(_request: Request, _env: Env): Promise<Response> {
  return json({ error: 'not implemented yet' }, 501)
}
