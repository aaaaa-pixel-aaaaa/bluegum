// The client is a static single-page app with no cookies/credentials, so an
// explicit allowlist (rather than a wildcard) just keeps the response honest
// about who's expected to call this — it isn't load-bearing security, the
// X-App-Secret check is.
const ALLOWED_ORIGINS = new Set([
  'https://aaaaa-pixel-aaaaa.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
])

function allowedOrigin(request: Request): string | null {
  const origin = request.headers.get('Origin')
  return origin && ALLOWED_ORIGINS.has(origin) ? origin : null
}

export function withCors(request: Request, response: Response): Response {
  const origin = allowedOrigin(request)
  if (!origin) return response

  const headers = new Headers(response.headers)
  headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Vary', 'Origin')
  return new Response(response.body, { status: response.status, headers })
}

export function corsPreflight(request: Request): Response {
  const origin = allowedOrigin(request)
  if (!origin) return new Response(null, { status: 403 })

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Vary': 'Origin',
      'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-App-Secret, X-Device-Id',
      'Access-Control-Max-Age': '86400',
    },
  })
}
