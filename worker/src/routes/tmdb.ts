import type { Env } from '../env'

const TMDB_BASE = 'https://api.themoviedb.org/3'

// GET /tmdb/* — pass-through proxy. Strips the leading /tmdb, forwards the
// rest of the path and query string to TMDB, injects the bearer token the
// client never sees.
export async function handleTmdbProxy(request: Request, env: Env, url: URL): Promise<Response> {
  const upstream = new URL(TMDB_BASE + url.pathname.slice('/tmdb'.length))
  upstream.search = url.search

  const upstreamResponse = await fetch(upstream.toString(), {
    headers: {
      Authorization: `Bearer ${env.TMDB_READ_TOKEN}`,
      accept: 'application/json',
    },
  })

  // Rebuild the response rather than return upstreamResponse directly so we
  // never accidentally forward an upstream header that could hint at the
  // token (e.g. a WWW-Authenticate error header echoing part of the request).
  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: { 'content-type': upstreamResponse.headers.get('content-type') ?? 'application/json' },
  })
}
