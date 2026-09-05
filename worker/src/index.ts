import type { Env } from './env'
import { hasValidAppSecret } from './lib/auth'
import { corsPreflight, withCors } from './lib/cors'
import { json } from './lib/http'
import { checkRateLimit } from './lib/rateLimit'
import { getProfile, putProfile } from './routes/profile'
import { handleRecommend } from './routes/recommend'
import { handleTmdbProxy } from './routes/tmdb'

const PROFILE_PATH = /^\/profile\/([^/]+)$/

export default {
  async fetch(request, env, _ctx): Promise<Response> {
    if (request.method === 'OPTIONS') return corsPreflight(request)

    if (!hasValidAppSecret(request, env)) {
      return withCors(request, json({ error: 'unauthorized' }, 401))
    }

    const url = new URL(request.url)

    try {
      if (url.pathname.startsWith('/tmdb/')) {
        const deviceId = request.headers.get('X-Device-Id')
        if (!deviceId) return withCors(request, json({ error: 'missing X-Device-Id header' }, 400))

        const limited = await checkRateLimit(env, `rl:tmdb:device:${deviceId}`, 200)
        if (limited) return withCors(request, limited)

        return withCors(request, await handleTmdbProxy(request, env, url))
      }

      if (url.pathname === '/recommend' && request.method === 'POST') {
        const deviceId = request.headers.get('X-Device-Id')
        if (!deviceId) return withCors(request, json({ error: 'missing X-Device-Id header' }, 400))

        const limitedByDevice = await checkRateLimit(env, `rl:recommend:device:${deviceId}`, 20)
        if (limitedByDevice) return withCors(request, limitedByDevice)

        const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'
        const limitedByIp = await checkRateLimit(env, `rl:recommend:ip:${ip}`, 20)
        if (limitedByIp) return withCors(request, limitedByIp)

        return withCors(request, await handleRecommend(request, env))
      }

      const profileMatch = url.pathname.match(PROFILE_PATH)
      if (profileMatch) {
        const deviceId = decodeURIComponent(profileMatch[1])
        if (request.method === 'GET') return withCors(request, await getProfile(deviceId, env))
        if (request.method === 'PUT') return withCors(request, await putProfile(deviceId, request, env))
      }

      return withCors(request, json({ error: 'not found' }, 404))
    } catch (err) {
      console.error(err)
      return withCors(request, json({ error: 'internal error' }, 500))
    }
  },
} satisfies ExportedHandler<Env>
